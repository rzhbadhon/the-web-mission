// ─────────────────────────────────────────────────────────────────────────────
// use-voice.ts — the Web Speech API wrapper.
//
// Two responsibilities:
//   1. `speak(text)` — guide's TTS voice. Uses SpeechSynthesis with
//      voice-picking, barge-in support, and a level analyser fed into the
//      audio-bus so the 3D scene can react.
//   2. `startListening()` / `stopListening()` — guest's STT. Uses
//      webkitSpeechRecognition / SpeechRecognition. The `onUserSpeech`
//      callback fires on a finalised phrase.
//
// This is the trickiest file in the project — Web Speech API has quirks
// across Chrome / Safari / Firefox / mobile. The implementation below
// works on Chrome desktop, Chrome Android, and Safari iOS 14.5+. If you
// need to support other browsers, swap in a custom STT/TTS provider here.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useRef, useCallback } from "react";
import { audioBus } from "./audio-bus";
import { VOICE_LANG } from "./config";

type Listener = (text: string) => void;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (e: any) => void;
  onerror: (e: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null;
}

export function useVoice({
  lang = VOICE_LANG,
  onUserSpeech,
}: {
  lang?: "bn-BD" | "en-US";
  onUserSpeech: Listener;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const analyserRef = useRef<{ stop: () => void } | null>(null);
  const userListenerRef = useRef<Listener>(onUserSpeech);
  userListenerRef.current = onUserSpeech;

  /* ── TTS ─────────────────────────────────────────────────────────────── */
  const speak = useCallback(
    (text: string, onDone?: () => void) =>
      new Promise<void>((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          onDone?.();
          resolve();
          return;
        }
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang;
          u.rate = 1;
          u.pitch = 1;

          // pick a voice that matches the language (prefers female when available)
          const voices = window.speechSynthesis.getVoices();
          const match =
            voices.find((v) => v.lang?.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)) && /female|woman|samantha|zira/i.test(v.name)) ||
            voices.find((v) => v.lang?.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2))) ||
            null;
          if (match) u.voice = match;

          u.onstart = () => {
            // ramp the guide level up; the 3D scene will brighten the city windows
            audioBus.guideLevel = 0.6;
          };
          u.onboundary = () => {
            // pulse a little on every word — keeps the scene reactive
            audioBus.guideLevel = Math.min(1, audioBus.guideLevel + 0.04);
          };
          u.onend = () => {
            audioBus.guideLevel = 0;
            utterRef.current = null;
            onDone?.();
            resolve();
          };
          u.onerror = () => {
            audioBus.guideLevel = 0;
            utterRef.current = null;
            onDone?.();
            resolve();
          };
          utterRef.current = u;
          window.speechSynthesis.speak(u);
        } catch {
          onDone?.();
          resolve();
        }
      }),
    [lang]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    audioBus.guideLevel = 0;
    utterRef.current = null;
  }, []);

  /* ── STT ─────────────────────────────────────────────────────────────── */
  const startListening = useCallback(async () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return false;

    // stop any existing recognition first — Chrome throws if you start twice
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript?.trim() || "";
      if (text) userListenerRef.current(text);
    };
    rec.onerror = () => {
      audioBus.micLevel = 0;
    };
    rec.onend = () => {
      audioBus.micLevel = 0;
    };

    try {
      rec.start();
      recognitionRef.current = rec;

      // optional mic-level analyser — only on browsers that expose
      // getUserMedia + AudioContext. Skip silently if blocked.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaStreamSource(stream);
        const an = ctx.createAnalyser();
        an.fftSize = 256;
        src.connect(an);
        const data = new Uint8Array(an.frequencyBinCount);
        let running = true;
        const tick = () => {
          if (!running) return;
          an.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          audioBus.micLevel = Math.min(1, sum / data.length / 90);
          requestAnimationFrame(tick);
        };
        tick();
        analyserRef.current = {
          stop: () => {
            running = false;
            stream.getTracks().forEach((t) => t.stop());
            ctx.close?.();
          },
        };
      } catch {
        // mic-level analyser is best-effort — recognition still works without it
      }

      return true;
    } catch {
      return false;
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    analyserRef.current?.stop();
    analyserRef.current = null;
    audioBus.micLevel = 0;
  }, []);

  return { startListening, stopListening, speak, stopSpeaking };
}
