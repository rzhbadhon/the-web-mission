// ─────────────────────────────────────────────────────────────────────────────
// app/api/journey/route.ts — journey persistence (log + read).
//
// BY DEFAULT this route stores journeys in a process-local in-memory Map.
// That means journeys disappear on serverless cold-starts and across
// instances. For real persistence, swap in your database of choice:
//   - SQLite (better-sqlite3) for single-instance deploys
//   - Postgres / MySQL for managed
//   - KV / D1 / Turso for serverless
//
// To get started, leave it as-is — the experience works perfectly with
// in-memory storage; you just lose the mission log between restarts.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JourneyRow {
  id: string;
  nameEntered: string;
  nameMatched: string | null;
  stage: string;
  accepted: boolean;
  createdAt: string;
  updatedAt: string;
  transcript: { role: string; content: string; source?: string }[];
}

// in-memory store — see file header for upgrade notes
declare global {
  // eslint-disable-next-line no-var
  var __journeyStore: Map<string, JourneyRow> | undefined;
}
const store: Map<string, JourneyRow> =
  (globalThis as any).__journeyStore ?? new Map();
(globalThis as any).__journeyStore = store;

/** The admin passkey. Set ADMIN_KEY in .env (default "spidey"). */
function adminKey() {
  return process.env.ADMIN_KEY || "spidey";
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const id = String(body.id || "").slice(0, 64);
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const now = new Date().toISOString();
  const existing = store.get(id);

  const row: JourneyRow = {
    id,
    nameEntered: String(body.nameEntered || "").slice(0, 64),
    nameMatched: body.nameMatched ? String(body.nameMatched).slice(0, 64) : null,
    stage: String(body.stage || "").slice(0, 32),
    accepted: !!body.accepted,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    transcript: Array.isArray(body.transcript)
      ? body.transcript.slice(-200).map((m: any) => ({
          role: String(m.role || "").slice(0, 16),
          content: String(m.content || "").slice(0, 2000),
          ...(m.source ? { source: String(m.source).slice(0, 16) } : {}),
        }))
      : [],
  };
  store.set(id, row);

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key || key !== adminKey()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = Array.from(store.values()).sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
  );

  return NextResponse.json({ journeys: rows });
}
