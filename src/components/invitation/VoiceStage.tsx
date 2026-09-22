"use client";

// ─────────────────────────────────────────────────────────────────────────────
// VoiceStage — voice authentication. Once the guest taps the orb and grants the mic,
// the whole journey becomes spoken. Typed mode remains as a graceful fallback.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pulse } from "@/lib/invitation/audio-bus";

interface VoiceStageProps {
  onMicGranted: (speak: (t: string) => Promise<void>) => void;
  onTypingFallback: () => void;
  speak: (t: string, onDone?: () => void) => Promise<void>;
  startMic: () => Promise<boolean>;
}

export function VoiceStage({
  onMicGranted,
  onTypingFallback,
  speak,
  startMic,
}: VoiceStageProps) {
  const [status, setStatus] = useState<
    "idle" | "asking" | "granted" | "denied" | "unsupported"
  >("idle");

  const beginVoice = async () => {
    pulse(1);
    setStatus("asking");
    const ok = await startMic();
    if (ok) {
      setStatus("granted");
      onMicGranted(speak);
    } else {
      setStatus("denied");
    }
  };

  return (
    <motion.div
      key="voice"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24, transition: { duration: 0.4 } }}
      className="relative z-10 flex h-[100dvh] flex-col items-center justify-center overflow-y-auto px-5 py-6"
    >
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-red-500/30 bg-black/60 px-5 py-6 text-center shadow-[0_0_60px_-12px_rgba(230,36,41,0.4)] backdrop-blur-xl sm:px-10 sm:py-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-red-300/70">
            Step 02 · Biometric Protocol
          </p>
          <h2 className="mt-2 font-display text-xl uppercase tracking-wide text-red-50 sm:mt-3 sm:text-2xl">
            Voice Required
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70 sm:mt-3 sm:text-[15px]">
            This mission runs on your voice.
            <br />
            The web listens. The web speaks. Press the orb and allow the
            microphone — then talk to it like a friend.
          </p>

          {/* the orb — sized to always fit the viewport without scrolling */}
          <div className="relative mx-auto mt-6 mb-6 flex h-32 w-32 items-center justify-center sm:mt-9 sm:mb-9 sm:h-44 sm:w-44">
            {/* animated rings */}
            <motion.div
              className="absolute inset-0 rounded-full border border-red-500/30"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.7, 0.1, 0.7],
              }}
              transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-3 rounded-full border border-red-400/20"
              animate={{
                scale: [1.15, 0.95, 1.15],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
            />
            <motion.button
              onClick={beginVoice}
              disabled={status === "asking" || status === "granted"}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label="Enable your microphone"
              className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500 via-red-700 to-red-950 shadow-[0_0_55px_rgba(230,36,41,0.65),inset_0_2px_10px_rgba(255,255,255,0.3)] sm:h-28 sm:w-28"
            >
              <motion.div
                animate={
                  status === "asking"
                    ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 0.9 }}
              >
                {status === "denied" || status === "unsupported" ? (
                  <MicOff className="h-9 w-9 text-white sm:h-10 sm:w-10" />
                ) : (
                  <Mic className="h-9 w-9 text-white sm:h-10 sm:w-10" />
                )}
              </motion.div>
            </motion.button>
          </div>

          {/* status line */}
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm"
            >
              {status === "idle" && (
                <p className="flex items-center justify-center gap-2 text-white/60">
                  <Volume2 className="h-4 w-4 text-red-400" />
                  Tap the orb · Allow the microphone
                </p>
              )}
              {status === "asking" && (
                <p className="text-amber-200/80">Waiting for your permission…</p>
              )}
              {status === "granted" && (
                <p className="text-emerald-300/90">
                  Voice link established — the web hums with excitement…
                </p>
              )}
              {(status === "denied" || status === "unsupported") && (
                <div className="space-y-3">
                  <p className="text-red-200/80">
                    {status === "denied"
                      ? "Microphone blocked — no worries. The mission continues by text."
                      : "This browser hides its microphone — the mission continues by text."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={onTypingFallback}
                    className="gap-2 border-red-400/40 bg-black/40 text-red-100 hover:bg-red-950/40"
                  >
                    <Keyboard className="h-4 w-4" />
                    Continue with typing
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 sm:mt-5">
          Works best on Chrome · Safari iOS 14.5+ · Android
        </p>
      </div>
    </motion.div>
  );
}
