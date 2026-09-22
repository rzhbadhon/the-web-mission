// ─────────────────────────────────────────────────────────────────────────────
// app/api/agent/route.ts — the AI guide endpoint.
//
// The client sends the current stage + the last ~12 messages; this endpoint
// replies with a JSON envelope:
//   {
//     reply:  string,           // what the guide says
//     action: "stay" | "advance" | "celebrate",
//     score:  number | null,    // 0..9 — only used in the IELTS stage
//     source: "live" | "offline"
//   }
//
// BY DEFAULT this route returns offline fallbacks (so the mission works with
// ZERO configuration — you can send the link and the journey just plays).
// To make the AI come alive, set OPENAI_API_KEY (or any OpenAI-compatible
// endpoint) in .env. The template below uses the standard OpenAI chat
// completions API — swap in Anthropic, Gemini, or your own LLM as you like.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  BOOKED_COMFORT,
  HOST_REVEAL_TOKEN,
  HIM,
  MOVIE,
  OFFLINE_COMFORT,
  type Stage,
} from "@/lib/invitation/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AgentRequest {
  stage: Stage;
  justEntered?: boolean;
  displayName?: string;
  messages: { role: "user" | "guide"; content: string }[];
}

/** Offline fallbacks — the journey never gets stuck waiting. */
function offlineReply(stage: Stage): string {
  if (stage === "booked") {
    return BOOKED_COMFORT[Math.floor(Math.random() * BOOKED_COMFORT.length)];
  }
  return OFFLINE_COMFORT[Math.floor(Math.random() * OFFLINE_COMFORT.length)];
}

/** Build a stage-aware system prompt — see lib/invitation/config.ts. */
function systemPrompt(stage: Stage): string {
  const host = HIM.name;
  const reveal = HOST_REVEAL_TOKEN;
  const movie = `${MOVIE.title} — ${MOVIE.date}, ${MOVIE.time} @ ${MOVIE.place} (seats ${MOVIE.seat})`;

  const base = `You are "Parker", a charming, slightly teasing AI guide inside an
interactive cinematic web experience called "The Web Mission". The guest
(whom you address as "${"superstar"}" until you learn otherwise) is walking
through a multi-stage journey that ends with you inviting them to a movie
date with ${host}. You will reveal ${host}'s identity at the right moment
during the "invite" stage — that is your signature move.

Tone: warm, cinematic, lightly flirty, never crude. Short sentences. Never
break character. Never mention that you are an AI. Reply in ONE message of
1–3 sentences unless an extended monologue is clearly needed.

CRITICAL — STAGE PROTOCOL:
- The current stage is "${stage}".
- "welcome": greet them, set the tone, ask a light opening question.
- "ielts": play a friendly examiner — give them a speaking prompt, then
  reply with a Band 0–9 score and a one-line tip (the JSON "score" field
  must match your verdict).
- "heart": change the conversation from playful to sincere. Ask them
  something real about their life, dreams, fears. Listen. Reflect back.
- "invite": this is the moment. Use the token "${reveal}" in your reply
  when you are about to reveal ${host}'s identity. Then ask them out to the
  movie: ${movie}.
- "booked": the guest said YES. Celebrate warmly. Then settle into companion
  mode — answer whatever the guest wants to talk about.

OUTPUT FORMAT — strictly one JSON object, no prose, no code fences:
{ "reply": string, "action": "stay"|"advance"|"celebrate", "score": number|null }
- "action": "advance" when the current level is clearly complete;
            "celebrate" only after the guest clearly accepts your invite;
            "stay" otherwise.
- "score": in "ielts" stage only, a number 0–9 (one decimal). null otherwise.
- "reply": never include JSON braces or quotes inside the reply text itself.
`;

  return base;
}

/** Call an OpenAI-compatible chat completions endpoint. */
async function callLLM(
  system: string,
  messages: { role: string; content: string }[],
  displayName?: string
): Promise<{ reply: string; action: string; score: number | null } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl =
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) return null; // no key → offline

  const userMsg =
    (displayName ? `[The guest just unlocked the gate: ${displayName}]\n` : "") +
    messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 360,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
      }),
      // don't hang the client — 12s budget per turn
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;

    // the model may sometimes wrap JSON in prose; pull the first {...}
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return {
      reply: String(parsed.reply ?? "").slice(0, 2000),
      action: String(parsed.action ?? "stay"),
      score:
        typeof parsed.score === "number" && isFinite(parsed.score)
          ? Math.max(0, Math.min(9, parsed.score))
          : null,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: AgentRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { reply: offlineReply("welcome"), action: "stay", source: "offline" },
      { status: 200 }
    );
  }

  const stage = body.stage || "welcome";
  const system = systemPrompt(stage);

  const llm = await callLLM(system, body.messages, body.displayName);

  if (llm) {
    return NextResponse.json(
      { ...llm, source: "live" },
      { status: 200 }
    );
  }

  // Offline — keep them company, NEVER advance (deliberate).
  return NextResponse.json(
    {
      reply: offlineReply(stage),
      action: "stay",
      score: null,
      source: "offline",
    },
    { status: 200 }
  );
}
