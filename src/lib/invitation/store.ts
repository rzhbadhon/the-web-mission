// ─────────────────────────────────────────────────────────────────────────────
// store.ts — the journey's single source of state (zustand).
//
// One store, no React context, no prop drilling. Every component reads from
// here and writes through the actions. The store survives the boot cinematic
// and HMR, and is restored from localStorage on reload.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import type { Stage } from "./config";
import { STAGE_ORDER } from "./config";

export interface Message {
  id: string;
  role: "user" | "guide";
  content: string;
  source?: "live" | "offline";
  score?: number | null;
}

interface JourneyState {
  // identity
  stage: Stage;
  nameEntered: string;
  matched: string; // canonical id of the matched name
  displayName: string;
  gateAttempts: number;

  // transcript
  messages: Message[];
  stageStartIdx: number;

  // voice
  voiceLang: "bn-BD" | "en-US";
  listening: boolean;
  speaking: boolean;
  thinking: boolean;
  guideMuted: boolean;

  // finale
  celebrated: boolean;

  // actions
  setStage: (s: Stage) => void;
  setVoiceLang: (l: "bn-BD" | "en-US") => void;
  pushMessage: (m: Omit<Message, "id">) => void;
  failGate: () => void;
  unlock: (entered: string, canonical: string, display: string) => void;
  reset: () => void;
  setListening: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  setThinking: (v: boolean) => void;
  setGuideMuted: (v: boolean) => void;
  setCelebrated: (v: boolean) => void;
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `m${Date.now().toString(36)}-${idCounter}`;
}

const INITIAL: Pick<
  JourneyState,
  | "stage"
  | "nameEntered"
  | "matched"
  | "displayName"
  | "gateAttempts"
  | "messages"
  | "stageStartIdx"
  | "voiceLang"
  | "listening"
  | "speaking"
  | "thinking"
  | "guideMuted"
  | "celebrated"
> = {
  stage: "gate",
  nameEntered: "",
  matched: "",
  displayName: "",
  gateAttempts: 0,
  messages: [],
  stageStartIdx: 0,
  voiceLang: "en-US",
  listening: false,
  speaking: false,
  thinking: false,
  guideMuted: false,
  celebrated: false,
};

export const useJourney = create<JourneyState>((set) => ({
  ...INITIAL,

  setStage: (s) =>
    set((st) => ({
      stage: s,
      stageStartIdx: st.messages.length, // mark the boundary for budget counting
    })),

  setVoiceLang: (l) => set({ voiceLang: l }),

  pushMessage: (m) =>
    set((st) => ({
      messages: [...st.messages, { id: nextId(), ...m }],
    })),

  failGate: () => set((st) => ({ gateAttempts: st.gateAttempts + 1 })),

  unlock: (entered, canonical, display) =>
    set({
      nameEntered: entered,
      matched: canonical,
      displayName: display,
    }),

  reset: () => set({ ...INITIAL, messages: [], stageStartIdx: 0 }),

  setListening: (v) => set({ listening: v }),
  setSpeaking: (v) => set({ speaking: v }),
  setThinking: (v) => set({ thinking: v }),
  setGuideMuted: (v) => set({ guideMuted: v }),
  setCelebrated: (v) => set({ celebrated: v }),
}));

/** Return the next stage in the canonical order (or the same stage if last). */
export function nextStage(s: Stage): Stage {
  const i = STAGE_ORDER.indexOf(s);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return s;
  return STAGE_ORDER[i + 1];
}
