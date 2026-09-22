"use client";

// ─────────────────────────────────────────────────────────────────────────────
// JourneyChat — the voice conversation cockpit: chapter bar, chat stream,
// the living mic orb, typed input (always available), per-stage atmospheres
// (embers → golden dust → rose petals → darkness → celebration), and score
// verdict chips when Parker examines the guest's answers. The page never sits still.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Volume2, VolumeX, User, Gauge } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TicketCard } from "./TicketCard";
import type { Stage } from "@/lib/invitation/config";
import { useJourney } from "@/lib/invitation/store";
import { sanitizeReply } from "@/lib/invitation/sanitize";

const CHAPTERS: { key: Stage; short: string }[] = [
  { key: "welcome", short: "Brief" },
  { key: "ielts", short: "IELTS" },
  { key: "heart", short: "Heart" },
  { key: "invite", short: "The Question" },
  { key: "booked", short: "Booked" },
];

const CHAPTER_TITLES: Record<string, string> = {
  welcome: "Level 0 · Mission Brief",
  ielts: "Level 1 · IELTS Speaking Trial",
  heart: "Level 2 · The Web of the Heart",
  invite: "Final Level · The Question",
  booked: "Booked · The Night Is Hers",
};

interface JourneyChatProps {
  stage: Stage;
  voiceActive: boolean; // mic was granted
  onAdvance: () => void;
  onCelebrate: () => void;
  sendToAgent: (text: string | null, opts?: { justEntered?: boolean }) => Promise<void>;
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  stopSpeaking: () => void;
  onRestart: () => void;
  seedIntroDone?: string[]; // restored sessions: skip these stage intros
}

/* deterministic pseudo-random so particles don't reshuffle on every render */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** rising ember field — the warm default night (welcome + booked) */
function EmberField({ gold = false }: { gold?: boolean }) {
  const embers = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: `${4 + seeded(i, 1) * 92}%`,
        size: 2 + seeded(i, 2) * 3.5,
        delay: `${-seeded(i, 3) * 16}s`,
        duration: `${9 + seeded(i, 4) * 9}s`,
        drift: `${(seeded(i, 5) - 0.5) * 90}px`,
        warm: seeded(i, 6) > 0.55,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {embers.map((e, i) => (
        <span
          key={i}
          className="wm-ember"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            animationDelay: e.delay,
            animationDuration: e.duration,
            // @ts-expect-error custom property for drift
            "--wm-drift": e.drift,
            background: gold
              ? "radial-gradient(circle, rgba(255,214,130,0.95), rgba(255,150,60,0) 70%)"
              : e.warm
                ? "radial-gradient(circle, rgba(255,190,120,0.95), rgba(230,36,41,0) 70%)"
                : "radial-gradient(circle, rgba(255,90,110,0.9), rgba(230,36,41,0) 70%)",
          }}
        />
      ))}
    </div>
  );
}

/** IELTS stage — a grand library at night: golden dust drifts through a
 *  slowly sweeping examination spotlight */
function DustField() {
  const dust = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: `${2 + seeded(i, 21) * 96}%`,
        size: 1.5 + seeded(i, 22) * 2.5,
        delay: `${-seeded(i, 23) * 14}s`,
        duration: `${12 + seeded(i, 24) * 10}s`,
        drift: `${(seeded(i, 25) - 0.3) * 120}px`,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* sweeping examination spotlight */}
      <div className="wm-beam absolute -top-[10%] left-1/2 h-[130%] w-[46%] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_36%,rgba(255,224,160,0.16)_46%,rgba(255,224,160,0.26)_50%,rgba(255,224,160,0.16)_54%,transparent_64%)]" />
      {dust.map((d, i) => (
        <span
          key={i}
          className="wm-dust absolute top-[8%]"
          style={{
            left: d.left,
            width: d.size,
            height: d.size,
            animationDelay: d.delay,
            animationDuration: d.duration,
            // @ts-expect-error custom property for drift
            "--wm-drift": d.drift,
          }}
        />
      ))}
    </div>
  );
}

/** heart stage — rose petals falling through the night, swaying, spinning */
function PetalField() {
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${3 + seeded(i, 31) * 94}%`,
        size: 8 + seeded(i, 32) * 8,
        delay: `${-seeded(i, 33) * 18}s`,
        duration: `${11 + seeded(i, 34) * 8}s`,
        sway: 30 + seeded(i, 35) * 70,
        spin: 360 + seeded(i, 36) * 540,
        deep: seeded(i, 37) > 0.5,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {petals.map((p, i) => (
        <span
          key={i}
          className="wm-petal absolute top-[-6%]"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            // @ts-expect-error custom properties
            "--wm-sway": `${p.sway}px`,
            "--wm-spin": `${p.spin}deg`,
            background: p.deep
              ? "linear-gradient(135deg, #ff5d73 0%, #c8102e 60%, #7a0c1e 100%)"
              : "linear-gradient(135deg, #ffb3c0 0%, #ff5975 55%, #c8102e 100%)",
            boxShadow: "0 0 10px rgba(255,89,117,0.35)",
          }}
        />
      ))}
    </div>
  );
}

/** invite stage — the darkness closes in; a single moonbeam keeps them company */
function DarkVeil() {
  const fireflies = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        left: `${38 + seeded(i, 41) * 24}%`,
        size: 1.5 + seeded(i, 42) * 2,
        delay: `${-seeded(i, 43) * 9}s`,
        duration: `${5 + seeded(i, 44) * 4}s`,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* heavy vignette — the city holds its breath */}
      <div className="wm-veil absolute inset-0 bg-[radial-gradient(ellipse_62%_50%_at_50%_38%,transparent_0%,rgba(2,2,8,0.62)_48%,rgba(2,2,8,0.93)_100%)]" />
      {/* the moonbeam */}
      <div className="wm-beam absolute -top-[8%] left-1/2 h-[120%] w-[34%] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_38%,rgba(255,240,205,0.12)_46%,rgba(255,240,205,0.22)_50%,rgba(255,240,205,0.12)_54%,transparent_62%)]" />
      {/* fireflies in the beam */}
      {fireflies.map((f, i) => (
        <span
          key={i}
          className="wm-fly absolute"
          style={{
            left: f.left,
            top: `${30 + seeded(i, 45) * 50}%`,
            width: f.size,
            height: f.size,
            animationDelay: f.delay,
            animationDuration: f.duration,
          }}
        />
      ))}
    </div>
  );
}

/** hand-drawn corner spider webs with a shimmer sweep — FIXED to the
 *  viewport: they are frame decorations and must never contribute scroll
 *  height inside the chat stream (bottom-0 inside a scroller anchors to the
 *  scrollable-area bottom and pushes bubbles out of view) */
function CornerWeb({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const pos =
    corner === "tl"
      ? "top-0 left-0 origin-top-left"
      : corner === "tr"
        ? "top-0 right-0 origin-top-right scale-x-[-1]"
        : corner === "bl"
          ? "bottom-0 left-0 origin-bottom-left scale-y-[-1]"
          : "bottom-0 right-0 origin-bottom-right scale-[-1]";
  return (
    <svg
      viewBox="0 0 120 120"
      className={`pointer-events-none fixed ${pos} z-0 h-28 w-28 text-red-200/25 sm:h-36 sm:w-36`}
      aria-hidden="true"
    >
      {/* radial strands */}
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (Math.PI / 2) * (i / 6);
        const x = 120 * Math.cos(a);
        const y = 120 * Math.sin(a);
        return (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeWidth="1"
          />
        );
      })}
      {/* concentric arcs */}
      {[22, 44, 66, 88, 110].map((r) => (
        <path
          key={r}
          d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="3 4"
        />
      ))}
      {/* dew-drop shimmer */}
      <circle cx="66" cy="30" r="2.2" fill="currentColor" className="wm-web-dew" />
      <circle cx="34" cy="70" r="1.6" fill="currentColor" className="wm-web-dew" />
    </svg>
  );
}

/** the guest's answer's verdict — the examiner's stamp */
function ScoreChip({ score }: { score: number }) {
  const tone =
    score >= 8
      ? "border-amber-300/50 bg-amber-400/10 text-amber-200"
      : score >= 6
        ? "border-red-300/40 bg-red-500/10 text-red-200"
        : "border-white/25 bg-white/5 text-white/60";
  return (
    <span
      className={`mt-1 inline-flex items-center gap-1 self-end rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone}`}
      title="Parker's verdict on the guest's answer"
    >
      <Gauge className="h-3 w-3" />
      Band {score.toFixed(1)}
    </span>
  );
}

export function JourneyChat({
  stage,
  voiceActive,
  onAdvance,
  onCelebrate,
  sendToAgent,
  startListening,
  stopListening,
  stopSpeaking,
  onRestart,
  seedIntroDone,
}: JourneyChatProps) {
  const messages = useJourney((s) => s.messages);
  const listening = useJourney((s) => s.listening);
  const speaking = useJourney((s) => s.speaking);
  const thinking = useJourney((s) => s.thinking);
  const guideMuted = useJourney((s) => s.guideMuted);
  const setGuideMuted = useJourney((s) => s.setGuideMuted);
  const displayName = useJourney((s) => s.displayName);
  const [typed, setTyped] = useState("");
  const [stageIntroDone, setStageIntroDone] = useState<Record<string, boolean>>(
    () => Object.fromEntries((seedIntroDone ?? []).map((s) => [s, true]))
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  /* autoscroll */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  /* stage intro — the guide opens every chapter */
  useEffect(() => {
    if (!CHAPTERS.some((c) => c.key === stage)) return;
    if (stageIntroDone[stage]) return;
    // brief pause lets the chapter banner breathe (setState inside the async
    // callback — not a synchronous cascading render)
    const t = setTimeout(() => {
      setStageIntroDone((m) => ({ ...m, [stage]: true }));
      sendToAgent(null, { justEntered: true });
    }, 700);
    return () => clearTimeout(t);
  }, [stage, stageIntroDone, sendToAgent]);

  const submitTyped = async () => {
    const text = typed.trim();
    if (!text || busyRef.current) return;
    setTyped("");
    if (speaking) stopSpeaking();
    await sendToAgent(text);
  };

  const orbClick = async () => {
    if (speaking) {
      // barge-in: interrupt the guide, take the floor
      stopSpeaking();
      await startListening();
    } else if (listening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const chapterIdx = CHAPTERS.findIndex((c) => c.key === stage);

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.4 } }}
      className="relative z-10 flex h-[100dvh] flex-col"
    >
      {/* the living background — a fresh atmosphere for every level */}
      {stage === "welcome" && <EmberField />}
      {stage === "ielts" && <DustField />}
      {stage === "heart" && <PetalField />}
      {stage === "invite" && <DarkVeil />}
      {stage === "booked" && <EmberField gold />}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="wm-aurora absolute inset-0" />
      </div>

      {/* corner webs frame the conversation (fixed — never scroll the page) */}
      <CornerWeb corner="tl" />
      <CornerWeb corner="br" />

      {/* chapter bar */}
      <header className="relative border-b border-red-500/20 bg-black/55 backdrop-blur-xl">
        {/* animated scan line */}
        <div className="wm-scanline pointer-events-none absolute bottom-0 left-0 h-px w-full overflow-visible" />
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-900 font-display text-xs text-red-50 shadow-[0_0_18px_rgba(230,36,41,0.5)]">
            P
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-display text-[13px] uppercase tracking-wider text-red-100">
                {CHAPTER_TITLES[stage] ?? "Mission"}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setGuideMuted(!guideMuted)}
                  aria-label={guideMuted ? "Unmute the guide's voice" : "Mute the guide's voice"}
                  className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {guideMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {/* progress segments */}
            <div className="mt-1.5 flex gap-1">
              {CHAPTERS.map((c, i) => (
                <div
                  key={c.key}
                  className={`h-1 flex-1 rounded-full transition-colors duration-700 ${
                    i < chapterIdx
                      ? "bg-red-500"
                      : i === chapterIdx
                        ? "bg-red-400 shadow-[0_0_8px_rgba(230,36,41,0.8)]"
                        : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* chat stream — corner webs are fixed outside the scroller */}
      <div
        ref={scrollRef}
        className="relative mx-auto w-full max-w-2xl flex-1 space-y-4 overflow-y-auto px-4 py-5"
      >
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={`relative flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                m.role === "guide"
                  ? "bg-gradient-to-br from-red-600 to-red-900 text-red-50 shadow-[0_0_12px_rgba(230,36,41,0.45)]"
                  : "border border-red-300/30 bg-red-950/40 text-red-200"
              }`}
            >
              {m.role === "guide" ? "P" : <User className="h-3.5 w-3.5" />}
            </div>
            {/* defense in depth: never render anything unsanitized */}
            <div
              className={`flex max-w-[82%] flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`wm-bubble whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed backdrop-blur-md ${
                  m.role === "guide"
                    ? "wm-bubble-guide rounded-tl-sm border border-red-400/25 bg-black/55 text-red-50"
                    : "rounded-tr-sm border border-red-300/25 bg-red-950/50 text-red-50"
                }`}
              >
                {m.role === "guide" ? sanitizeReply(m.content) : m.content}
              </div>
              {/* the examiner's stamp */}
              {m.role === "guide" && m.score != null && <ScoreChip score={m.score} />}
            </div>
          </motion.div>
        ))}

        {/* thinking indicator */}
        {thinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-900 text-[10px] font-bold text-red-50">
              P
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-red-400/25 bg-black/55 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-red-400"
                  animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* the golden ticket, inline at the end of the stream */}
        {stage === "booked" && <TicketCard displayName={displayName} onRestart={onRestart} />}
      </div>

      {/* mic orb + typed input — the conversation never ends, not even
          after the ticket: the guest can talk here forever */}
      <footer className="relative border-t border-red-500/20 bg-black/55 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-end gap-3">
          {/* orb */}
          <motion.button
            onClick={orbClick}
            whileTap={{ scale: 0.92 }}
            aria-label={
              speaking ? "Interrupt and talk" : listening ? "Stop listening" : "Start talking"
            }
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors ${
              speaking
                ? "bg-gradient-to-br from-amber-500 to-red-700"
                : listening
                  ? "bg-gradient-to-br from-red-500 to-red-800"
                  : "bg-gradient-to-br from-red-700 to-red-950"
            } ${voiceActive ? "" : "opacity-60"}`}
          >
            {/* idle breathing halo — the orb is never static */}
            {!speaking && !listening && (
              <motion.span
                className="absolute inset-0 rounded-full border border-red-400/40"
                animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.7, 0.25] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              />
            )}
            {/* listening ripple */}
            <AnimatePresence>
              {listening && (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-red-400"
                    animate={{ scale: [1, 1.45], opacity: [0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-full border border-red-300"
                    animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: 0.35, ease: "easeOut" }}
                  />
                </>
              )}
            </AnimatePresence>
            {/* speaking equalizer bars */}
            {speaking ? (
              <span className="flex items-end gap-[3px]">
                {[0, 1, 2, 3].map((i) => (
                  <motion.span
                    key={i}
                    className="w-[3px] rounded-full bg-white"
                    animate={{ height: [6, 16, 8, 18, 6] }}
                    transition={{ repeat: Infinity, duration: 0.85, delay: i * 0.12 }}
                  />
                ))}
              </span>
            ) : thinking ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
              />
            ) : voiceActive ? (
              <Mic className="h-6 w-6 text-white" />
            ) : (
              <MicOff className="h-6 w-6 text-white/70" />
            )}
          </motion.button>

          {/* status + typed input */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.p
                key={speaking ? "s" : listening ? "l" : thinking ? "t" : "i"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-white/50"
              >
                {speaking
                  ? "Parker is speaking — tap to interrupt"
                  : listening
                    ? "Listening… speak now"
                    : thinking
                      ? "The web is thinking…"
                      : voiceActive
                        ? "Tap the mic and speak — or type below"
                        : "Type your reply below"}
              </motion.p>
            </AnimatePresence>
            <div className="flex gap-2">
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitTyped()}
                placeholder={
                  stage === "booked" ? "Talk about anything — no limits here…" : "Type here if you're shy…"
                }
                aria-label="Type your message"
                className="h-11 border-red-400/25 bg-black/50 text-[15px] text-red-50 placeholder:text-white/30 focus-visible:ring-red-400/40"
              />
              <Button
                onClick={submitTyped}
                disabled={!typed.trim()}
                aria-label="Send message"
                className="h-11 w-11 shrink-0 bg-red-600 p-0 hover:bg-red-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
