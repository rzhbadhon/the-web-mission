"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MissionExperience — the brain: stage machine, voice wiring, agent calls,
// persistence, chapter banners, the boot cinematic, and the hidden viewer.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useJourney, nextStage } from "@/lib/invitation/store";
import { useVoice } from "@/lib/invitation/use-voice";
import { audioBus, pulse } from "@/lib/invitation/audio-bus";
import {
  OFFLINE_COMFORT,
  BOOKED_COMFORT,
  STAGE_ORDER,
  VOICE_LANG,
  CANONICAL_IDS,
  HOST_REVEAL_TOKEN,
  STAGE_BUDGETS,
} from "@/lib/invitation/config";
import { sanitizeReply } from "@/lib/invitation/sanitize";
import { NameGate } from "@/components/invitation/NameGate";
import { VoiceStage } from "@/components/invitation/VoiceStage";
import { JourneyChat } from "@/components/invitation/JourneyChat";
import { AdminViewer } from "@/components/invitation/AdminViewer";

const Scene3D = dynamic(() => import("@/components/invitation/scene3d/Scene3D"), {
  ssr: false,
});

/* client-only: the cinematic depends on viewport motion and framer styles
 * — SSR-rendering it caused hydration attribute mismatches */
const BootCinematic = dynamic(
  () => import("@/components/invitation/BootCinematic"),
  { ssr: false }
);

const LS_KEY = "webmission-state-v1";
const LS_ID = "webmission-id-v1";

interface SavedState {
  stage: string;
  nameEntered: string;
  displayName: string;
  matched: string;
  messages: {
    role: "user" | "guide";
    content: string;
    source?: "live" | "offline";
    score?: number | null;
  }[];
  voiceLang: "bn-BD" | "en-US";
  voiceActive: boolean;
  celebrated: boolean;
}

function saveLocal() {
  try {
    const s = useJourney.getState();
    if (s.stage === "gate") return;
    const data: SavedState = {
      stage: s.stage,
      nameEntered: s.nameEntered,
      displayName: s.displayName,
      matched: s.matched,
      messages: s.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.source ? { source: m.source } : {}),
        ...(m.score != null ? { score: m.score } : {}),
      })),
      voiceLang: s.voiceLang,
      voiceActive: voiceActiveRef.current,
      celebrated: s.celebrated,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* private mode — the mission continues in memory */
  }
}

function persistServer() {
  try {
    const s = useJourney.getState();
    if (s.stage === "gate") return;
    const id =
      localStorage.getItem(LS_ID) ||
      (() => {
        const id = (crypto as any).randomUUID?.() || `w-${Date.now()}-${Math.random()}`;
        localStorage.setItem(LS_ID, id);
        return id;
      })();
    // NOTE: no `keepalive` — fire-and-forget keepalive fetches were observed
    // hanging in some environments, which silently dropped the last updates.
    fetch("/api/journey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        nameEntered: s.nameEntered,
        nameMatched: s.matched,
        stage: s.stage,
        transcript: s.messages.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.source ? { source: m.source } : {}),
        })),
        accepted: s.celebrated,
      }),
    }).catch(() => {});
  } catch {
    /* offline — fine */
  }
}

// module-level flag for voice activation (survives closure scope cleanly)
let voiceActiveRef = { current: false };

/* local comfort fallback when even the agent endpoint is unreachable
 * (same protocol as the server: keep them company, never advance) */
let localComfortIdx = Math.floor(Math.random() * 4);
function localComfort(stage: string): string {
  const pool = stage === "booked" ? BOOKED_COMFORT : OFFLINE_COMFORT;
  localComfortIdx = (localComfortIdx + 1) % pool.length;
  return pool[localComfortIdx];
}

// yes/no detectors for the client-side safety net (the model is creative but
// occasionally too polite to celebrate — after two clear yeses we book it)
const YES_RE =
  /\b(yes|yeah|yep|yas|sure|ok|okay|of course|why not|done|deal|accept|agreed|confirm|cholbe|thik ache|thik acche|acha|achha|korbo|dibo|jai|jabo|choluk|love to|would love)\b|হ্যাঁ|জি বলছি|চলবে|ঠিক আছে|আচ্ছা ঠিক|করব|যাব|দেখব|অবশ্যই|একদম|বেশ|মানেলাম|লাভ টু|i do/i;
const NO_RE =
  /\b(no|nope|never|not now|later|busy|can'?t|cannot|nah)\b|পারব না|পারবনা|ব্যস্ত|আরে পরে|মানা কর/i;

// counts consecutive clear yeses in the invite stage
let inviteYesStreak = 0;

export function MissionExperience() {
  const stage = useJourney((s) => s.stage);
  const voiceLang = useJourney((s) => s.voiceLang);
  const setVoiceLang = useJourney((s) => s.setVoiceLang);
  const setStage = useJourney((s) => s.setStage);
  const pushMessage = useJourney((s) => s.pushMessage);
  const setThinking = useJourney((s) => s.setThinking);
  const setSpeaking = useJourney((s) => s.setSpeaking);
  const setListening = useJourney((s) => s.setListening);
  const failGate = useJourney((s) => s.failGate);
  const unlockStore = useJourney((s) => s.unlock);
  const resetStore = useJourney((s) => s.reset);
  const setCelebrated = useJourney((s) => s.setCelebrated);

  const [booted, setBooted] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [restoredIntroDone, setRestoredIntroDone] = useState<string[] | null>(null);
  const gateAttempts = useJourney((s) => s.gateAttempts);
  const busyRef = useRef(false);
  const params = useSearchParams();
  const adminKey = params.get("admin");

  /* ── boot + restore ───────────────────────────────────────────────── */
  useEffect(() => {
    // restore a previous session asynchronously (setState in timer callbacks
    // is the sanctioned pattern for one-shot external sync). The boot
    // cinematic runs on top and hands over when it finishes.
    const restore = setTimeout(() => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        const saved: SavedState = JSON.parse(raw);
        const idx = STAGE_ORDER.indexOf(saved.stage as any);
        if (idx > 0 && saved.messages?.length >= 0) {
          unlockStore(
            saved.nameEntered,
            // NOTE: the matched-name canonical id is read from the saved
            // session. If the canonical ids in config change between sessions,
            // old saved data will fall back to the first canonical id.
            (saved.matched as any) || (CANONICAL_IDS[0] || "guest"),
            saved.displayName || "Guest"
          );
          saved.messages.forEach((m) =>
            pushMessage({
              role: m.role,
              content: m.content,
              ...(m.source ? { source: m.source } : {}),
              ...(m.score != null ? { score: m.score } : {}),
            })
          );
          setVoiceLang(VOICE_LANG); // the journey speaks English — always
          setVoiceActive(saved.voiceActive);
          voiceActiveRef.current = saved.voiceActive;
          setCelebrated(saved.celebrated);
          setStage(saved.stage as any);
          // mark earlier stages' intros as done to avoid replays
          setRestoredIntroDone(
            STAGE_ORDER.slice(0, idx + 1).filter(
              (s) => s !== "gate" && s !== "voice"
            )
          );
        }
      } catch {
        /* corrupt save — start fresh */
      }
    }, 0);
    return () => clearTimeout(restore);
  }, []);

  /* ── the voice engine ───────────────────────────────────────────────── */
  const agentRef = useRef<
    (text: string | null, opts?: { justEntered?: boolean }) => Promise<void>
  >(async () => {});

  /* held messages — if the guest speaks while Parker is mid-exchange their words
   * are QUEUED (never dropped); the held turn is answered the instant the
   * current one finishes. */
  const pendingUserRef = useRef<string | null>(null);
  const pendingIntroRef = useRef<boolean>(false);

  const flushHeld = useCallback(() => {
    const held = pendingUserRef.current;
    const intro = pendingIntroRef.current;
    if (!held && !intro) return;
    pendingUserRef.current = null;
    pendingIntroRef.current = false;
    // a short beat so two voices never collide
    setTimeout(() => {
      agentRef.current(held, intro ? { justEntered: true } : undefined);
    }, 420);
  }, []);

  const onUserSpeech = useCallback((text: string) => {
    const st = useJourney.getState();
    if (st.stage === "gate" || st.stage === "voice") return;
    if (st.speaking) return; // echo territory — barge-in via the orb instead
    // thinking/mid-exchange → sendToAgent queues it; nothing is ever lost
    agentRef.current(text);
  }, []);

  const {
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoice({ lang: voiceLang, onUserSpeech });

  const startMic = useCallback(async () => {
    const ok = await startListening();
    if (ok) {
      setVoiceActive(true);
      voiceActiveRef.current = true;
      setListening(true);
    }
    return ok;
  }, [startListening, setListening]);

  /* store-synced stop helpers */
  const stopMic = useCallback(() => {
    stopListening();
    setListening(false);
  }, [stopListening, setListening]);

  const haltSpeaking = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
  }, [stopSpeaking, setSpeaking]);

  /* ── agent communication ─────────────────────────────────────────────── */
  const sendToAgent = useCallback(
    async (text: string | null, opts?: { justEntered?: boolean }) => {
      if (busyRef.current) {
        // the guest spoke while Parker is mid-exchange — HOLD, never drop
        if (text) pendingUserRef.current = text;
        else if (opts?.justEntered) pendingIntroRef.current = true;
        return;
      }
      const st0 = useJourney.getState();
      if (st0.stage === "gate" || st0.stage === "voice") return;
      busyRef.current = true;

      if (text) pushMessage({ role: "user", content: text });
      if (useJourney.getState().speaking) haltSpeaking();

      setThinking(true);
      let reply = "";
      let action = "stay";
      let score: number | null = null;
      let source = "offline";
      try {
        const history = useJourney
          .getState()
          .messages.slice(-12)
          .map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage: st0.stage,
            justEntered: !!opts?.justEntered,
            displayName: st0.displayName || "superstar",
            messages: history,
          }),
        });
        const data = await res.json();
        reply = sanitizeReply(String(data.reply || ""));
        action = String(data.action || "stay");
        score =
          typeof data.score === "number" && isFinite(data.score)
            ? Math.max(0, Math.min(9, data.score))
            : null;
        // fallback: the model often writes the verdict into the reply text
        // ("Band 8.0 — lovely vocabulary…") but forgets the JSON field
        if (score == null && reply) {
          const band = reply.match(/\bband\s*(\d(?:\.\d)?)/i);
          if (band) score = Math.max(0, Math.min(9, parseFloat(band[1])));
        }
        source = String(data.source || "offline");
        console.log("[mission] agent reply:", {
          action,
          source,
          stage: st0.stage,
          score,
          len: reply.length,
        });

        /* ── deterministic pacing + celebration net ──────────────────────
         * LIVE ONLY. When the AI satellite is offline the level NEVER
         * progresses — that is deliberate: the mission's owner can tell
         * live from offline at a glance while testing. While live, the
         * model's own pacing wins; this net only rescues a stalled journey.
         */
        const live = source !== "offline";
        if (live) {
          const clearYes = !!text && YES_RE.test(text) && !NO_RE.test(text);
          const strongYes =
            !!text &&
            /\b(i would love to|i'?d love to|love to|absolutely|definitely|count me in|i'?m in|let'?s do it|book it|i accept|deal|yes!)\b/i.test(
              text
            );
          const recentGuide = useJourney
            .getState()
            .messages.slice(-8)
            .filter((m) => m.role === "guide")
            .map((m) => m.content)
            .join(" ")
            .toLowerCase();
          const revealed =
            recentGuide.toLowerCase().includes(HOST_REVEAL_TOKEN.toLowerCase()) &&
            /(movie|cinema|spider|film|invite|date)/.test(recentGuide);

          if (revealed && (clearYes || strongYes)) {
            if (strongYes) {
              action = "celebrate";
              console.log("[mission] pacing net: strong yes → celebrate");
            } else {
              inviteYesStreak++;
              if (inviteYesStreak >= 2) {
                action = "celebrate";
                console.log("[mission] pacing net: yes streak → celebrate");
              }
            }
          } else if (text) {
            inviteYesStreak = 0;
          }

          // forward motion — generous budgets rescue a stalled journey only
          const BUDGET = STAGE_BUDGETS;
          const stNow = useJourney.getState();
          const turnsInStage = stNow.messages
            .slice(stNow.stageStartIdx)
            .filter((m) => m.role === "user").length;
          if (
            action === "stay" &&
            BUDGET[st0.stage] !== undefined &&
            turnsInStage >= (BUDGET[st0.stage] as number)
          ) {
            action = "advance";
            console.log("[mission] pacing net: budget reached → advance", {
              stage: st0.stage,
              turnsInStage,
            });
          }
        }
      } catch {
        // network failed — comfort protocol keeps them company, never advances
        reply = sanitizeReply(localComfort(st0.stage));
        action = "stay";
        score = null;
        source = "offline";
      }

      setThinking(false);
      if (!reply) {
        busyRef.current = false;
        flushHeld();
        return;
      }
      pushMessage({
        role: "guide",
        content: reply,
        source: source === "offline" ? "offline" : "live",
        score,
      });
      saveLocal();
      persistServer();

      const afterVoice = () => {
        const st = useJourney.getState();
        if (action === "celebrate") {
          // SHE SAID YES — fireworks + golden ticket
          pulse(3);
          setCelebrated(true);
          setStage("booked");
          persistServer();
        } else if (action === "advance") {
          pulse(1.6);
          const next = nextStage(st.stage);
          if (next !== st.stage) setStage(next);
          persistServer();
        } else if (voiceActiveRef.current && !pendingUserRef.current) {
          startListening();
        }
      };

      const st = useJourney.getState();
      if (st.guideMuted || !voiceActiveRef.current) {
        // text-only mode — small dramatic pause, then continue
        setSpeaking(false);
        setTimeout(afterVoice, 650);
      } else {
        setSpeaking(true);
        await speak(reply, () => setSpeaking(false));
        afterVoice();
      }
      busyRef.current = false;
      flushHeld();
    },
    [pushMessage, setThinking, setSpeaking, setStage, setCelebrated, speak, haltSpeaking, startListening, flushHeld]
  );

  // keep a stable ref for onUserSpeech (declared before sendToAgent)
  useEffect(() => {
    agentRef.current = sendToAgent;
  }, [sendToAgent]);

  /* ── stage transitions ───────────────────────────────────────────────── */
  const goStage = useCallback(
    (s: string) => {
      setFlashKey((k) => k + 1);
      setStage(s as any);
      if (s === "welcome") {
        setBanner("Chapter I · The Mission Brief");
        setTimeout(() => setBanner(null), 2200);
      } else if (s === "ielts") {
        setBanner("Chapter II · Level 1 — The IELTS Trial");
        setTimeout(() => setBanner(null), 2200);
      } else if (s === "heart") {
        setBanner("Chapter III · Level 2 — The Web of the Heart");
        setTimeout(() => setBanner(null), 2200);
      } else if (s === "invite") {
        setBanner("Final Level · The Question");
        setTimeout(() => setBanner(null), 2200);
      } else if (s === "booked") {
        setBanner("Reservation Confirmed");
        setTimeout(() => setBanner(null), 2600);
      }
      saveLocal();
      persistServer();
    },
    [setStage]
  );

  const handleUnlock = useCallback(
    // Canonical ids are strings that the gate's name-matcher can resolve to.
    // Configure them in lib/invitation/config.ts. By default there is only
    // one canonical id "guest"; add more if multiple people share the
    // mission (e.g. "friend", "partner", …).
    (entered: string, canonical: string, display: string) => {
      unlockStore(entered, canonical, display);
      goStage("voice");
    },
    [unlockStore, goStage]
  );

  /* The guide's own welcome line IS the voice-link confirmation — one voice,
   * one message. (Previously two messages collided here and one was lost.) */
  const handleMicGranted = useCallback(
    async (_speakFn: (t: string) => Promise<void>) => {
      goStage("welcome");
    },
    [goStage]
  );

  const handleTypingFallback = useCallback(() => {
    setVoiceActive(false);
    voiceActiveRef.current = false;
    goStage("welcome");
  }, [goStage]);

  const handleRestart = useCallback(() => {
    // order matters: reset the store FIRST (later saveLocal calls skip the
    // 'gate' stage), then silence the engines, then wipe the saved session —
    // otherwise a subscribe-driven save can resurrect the finished journey.
    resetStore();
    inviteYesStreak = 0;
    pendingUserRef.current = null;
    pendingIntroRef.current = false;
    stopMic();
    haltSpeaking();
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_ID);
    } catch {
      /* ignore */
    }
    setVoiceActive(false);
    voiceActiveRef.current = false;
    setFlashKey((k) => k + 1);
  }, [resetStore, stopMic, haltSpeaking]);

  /* persist on every message */
  useEffect(() => {
    const unsub = useJourney.subscribe(() => saveLocal());
    return unsub;
  }, []);

  /* guard: page hidden → stop listening */
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        stopMic();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [stopMic]);

  /* ── hidden viewer for the host ───────────────────────────────────────── */
  if (adminKey) {
    return <AdminViewer passkey={adminKey} />;
  }

  const chatStages = ["welcome", "ielts", "heart", "invite", "booked"];

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#07070d]">
      <Scene3D stage={stage} />

      {/* stage-change darkness dip — the city exhales, the next level breathes */}
      <AnimatePresence>
        <motion.div
          key={flashKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.96, 0.96, 0] }}
          transition={{ duration: 1.15, times: [0, 0.3, 0.6, 1], ease: "easeInOut" }}
          className="pointer-events-none fixed inset-0 z-20 bg-[#04040a]"
        />
      </AnimatePresence>

      {/* chapter banner — glows above the darkness */}
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
          >
            <div className="border-y border-red-400/40 bg-black/70 px-8 py-5 backdrop-blur-md">
              <p className="font-display text-lg uppercase tracking-[0.18em] text-red-100 sm:text-2xl">
                {banner}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the boot cinematic — Spidey swings in, the mission wakes */}
      <AnimatePresence>
        {!booted && <BootCinematic key="boot" onDone={() => setBooted(true)} />}
      </AnimatePresence>

      {/* stage machine */}
      <AnimatePresence mode="wait">
        {stage === "gate" && (
          <NameGate
            key="gate"
            attempts={gateAttempts}
            onAttempt={failGate}
            onUnlock={handleUnlock}
          />
        )}
        {stage === "voice" && (
          <VoiceStage
            key="voice"
            onMicGranted={handleMicGranted}
            onTypingFallback={handleTypingFallback}
            speak={speak}
            startMic={startMic}
          />
        )}
        {chatStages.includes(stage) && (
          <JourneyChat
            key="chat"
            stage={stage}
            voiceActive={voiceActive}
            onAdvance={() => goStage(nextStage(stage))}
            onCelebrate={() => {
              pulse(3);
              setCelebrated(true);
              goStage("booked");
            }}
            sendToAgent={sendToAgent}
            startListening={startMic}
            stopListening={stopMic}
            stopSpeaking={haltSpeaking}
            onRestart={handleRestart}
            seedIntroDone={restoredIntroDone ?? undefined}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
