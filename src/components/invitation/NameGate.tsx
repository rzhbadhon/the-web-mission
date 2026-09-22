"use client";

// ─────────────────────────────────────────────────────────────────────────────
// NameGate — the classified lock screen. Only one name (and its 40+ spellings)
// opens the web. Wrong names get roasts; persistence earns poetic hints.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Fingerprint, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE, GATE_HINTS, GATE_REJECTIONS } from "@/lib/invitation/config";
import { matchName } from "@/lib/invitation/name-match";
import { pulse } from "@/lib/invitation/audio-bus";

interface NameGateProps {
  attempts: number;
  onAttempt: () => void;
  // `canonical` is the matched canonical id (a string configured in
  // lib/invitation/config.ts — see CANONICAL_IDS). `display` is the
  // pretty version shown in the UI. Add more canonical ids there if
  // multiple people share this mission.
  onUnlock: (entered: string, canonical: string, display: string) => void;
}

export function NameGate({ attempts, onAttempt, onUnlock }: NameGateProps) {
  const [value, setValue] = useState("");
  const [rejectMsg, setRejectMsg] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const visibleHints = GATE_HINTS.filter((h) => attempts >= h.after);
  const rejection =
    attempts > 0
      ? GATE_REJECTIONS[Math.min(attempts - 1, GATE_REJECTIONS.length - 1)]
      : null;

  const submit = () => {
    const name = value.trim();
    if (!name) {
      setRejectMsg("Empty field detected. The web ignores blank answers.");
      setShakeKey((k) => k + 1);
      return;
    }
    const result = matchName(name);
    if (result.ok) {
      setUnlocking(true);
      pulse(2.5);
      onAttempt();
      setTimeout(
        () => onUnlock(name, result.canonical || "guest", result.display || "Guest"),
        900
      );
    } else {
      onAttempt();
      pulse(0.8);
      setRejectMsg(
        result.close
          ? "So close it's almost painful. The web is teasing you — try again."
          : null
      );
      setShakeKey((k) => k + 1);
      // NOTE: never touch input DOM directly — React controls the value
    }
  };

  return (
    <motion.div
      key="gate"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: 1.35,
        filter: "blur(8px)",
        transition: { duration: 0.7 },
      }}
      className="relative z-10 flex h-[100dvh] flex-col items-center justify-center overflow-y-auto px-5 py-8"
    >
      <motion.div
        animate={shakeKey ? { x: [0, -12, 12, -8, 8, -4, 0] } : {}}
        key={shakeKey}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        {/* classified file card */}
        <div className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-black/60 shadow-[0_0_60px_-12px_rgba(230,36,41,0.45)] backdrop-blur-xl">
          {/* stamp */}
          <div className="pointer-events-none absolute right-4 top-4 rotate-12 rounded border-2 border-red-500/70 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.3em] text-red-400/90">
            CLASSIFIED
          </div>
          <div className="pointer-events-none absolute -left-8 top-16 -rotate-6 rounded border border-amber-200/30 px-2 py-0.5 font-mono text-[9px] tracking-[0.25em] text-amber-200/50">
            EYES ONLY
          </div>

          <div className="px-5 pb-7 pt-8 sm:px-10 sm:pb-8 sm:pt-10">
            {/* wax seal */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-600 via-red-800 to-red-950 shadow-[0_0_35px_rgba(230,36,41,0.55),inset_0_2px_8px_rgba(255,255,255,0.25)] sm:mb-6 sm:h-20 sm:w-20"
            >
              <span className="font-display text-2xl font-bold text-red-50 drop-shadow sm:text-3xl">
                {SITE.senderLabel}
              </span>
            </motion.div>

            <h1 className="text-center font-display text-2xl uppercase tracking-wider text-red-50 sm:text-3xl">
              {SITE.codename}
            </h1>
            <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.35em] text-red-300/70">
              {SITE.tagline}
            </p>

            <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4 sm:mt-7">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-amber-100/90">
                <Fingerprint className="h-4 w-4 text-red-400" />
                A message is sealed for exactly one person.
                <br className="hidden sm:block" /> Identify yourself to proceed.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Your name, superstar…"
                  aria-label="Enter your name to unlock"
                  className="h-12 border-red-400/30 bg-black/50 text-lg text-red-50 placeholder:text-red-200/30 focus-visible:ring-red-400/50"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button
                  onClick={submit}
                  disabled={unlocking}
                  className="h-12 gap-2 bg-red-600 px-6 font-display text-sm uppercase tracking-wider hover:bg-red-500"
                >
                  {unlocking ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {unlocking ? "Unlocking" : "Unlock"}
                </Button>
              </div>

              {/* rejection line */}
              <AnimatePresence mode="wait">
                {(rejectMsg ?? rejection) && !unlocking && (
                  <motion.div
                    key={(rejectMsg ?? rejection)!.slice(0, 12)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex items-start gap-2 rounded-md border border-red-400/20 bg-red-950/30 px-3 py-2 text-[13px] text-red-200/90"
                  >
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span>{rejectMsg ?? rejection}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* hints */}
              <div className="mt-4 space-y-2">
                <AnimatePresence>
                  {visibleHints.map((h, i) => (
                    <motion.div
                      key={h.after}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 rounded-md border border-amber-300/20 bg-amber-950/20 px-3 py-2 text-[13px] italic text-amber-100/90"
                    >
                      <span className="not-italic opacity-60">✦</span>
                      <span>{h.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
              Spider-Web Security · v2.1 · This page knows who you are
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
