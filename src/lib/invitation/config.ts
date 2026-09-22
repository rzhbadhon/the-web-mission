// ─────────────────────────────────────────────────────────────────────────────
// config.ts — THE SINGLE SOURCE OF TRUTH FOR PERSONALIZATION.
//
// Everything the host wants to change about the mission lives here:
//   - the host's name & reveal token
//   - the invitation details (movie / place / time / seats)
//   - the gate's accepted names + spelling variants + hints + rejections
//   - the stages the journey walks through
//   - offline "comfort" fallback replies (used when the AI is unreachable)
//
// Open this file, edit the strings, and your mission is ready.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The journey stage. The chat walks through these in order; the 3D scene and
 * the chapter banners react to the current stage. Add or rename stages here,
 * but be careful: the store, the agent prompt, and the pacing logic all
 * reference these strings by name.
 */
export type Stage =
  | "gate" // the name-entry lock screen
  | "voice" // mic permission prompt
  | "welcome" // Level 0 · Mission Brief
  | "ielts" // Level 1 · IELTS Speaking Trial
  | "heart" // Level 2 · Web of the Heart
  | "invite" // Final Level · The Question
  | "booked"; // Reservation Confirmed · the guest said YES

/** Order the chat stages walk through. `gate` and `voice` are prelude. */
export const STAGE_ORDER: Stage[] = [
  "gate",
  "voice",
  "welcome",
  "ielts",
  "heart",
  "invite",
  "booked",
];

/** The voice the guide speaks in (Web Speech API locale code). */
export const VOICE_LANG: "bn-BD" | "en-US" = "en-US";

// ─── The host's identity ─────────────────────────────────────────────────────

/**
 * The host's display name — shown on the ticket ("Guest of honour: … — with {name}")
 * and as the wax-seal letter on the gate.
 *
 * Replace "the Host" with your own name (or a pen-name) before publishing.
 */
export const HIM = {
  name: "the Host",
} as const;

/**
 * A short token the AI agent is told to use when it's time to reveal the host's
 * identity. The pacing logic watches recent guide replies for this token to
 * decide "the reveal has happened — now listen for a yes".
 *
 * If you change this, also update the agent's system prompt (see
 * `app/api/agent/route.ts`) so the model knows the same token.
 */
export const HOST_REVEAL_TOKEN = "the host";

// ─── The mission's branding ──────────────────────────────────────────────────

/**
 * SITE is shown on the gate.
 *   - `senderLabel`: the single letter on the wax-seal (usually the host's
 *     initial — replace with your own).
 *   - `codename`: the mission title.
 *   - `tagline`: a short classified-style subtitle.
 */
export const SITE = {
  senderLabel: "H",
  codename: "THE WEB MISSION",
  tagline: "EYES ONLY · ONE MISSION · ONE PERSON",
} as const;

// ─── The invitation details (shown on the golden ticket) ─────────────────────

/**
 * The invitation details. Replace these with your own. Any string works — the
 * UI does not parse them. Multi-line values can use "\n".
 *
 * `title` is the headline of the ticket (the movie / event name).
 * The four detail fields appear in a 2×2 grid on the ticket.
 */
export const MOVIE = {
  title: "Spider-Man: Into the Spider-Verse",
  date: "Friday, 25 December",
  time: "7:00 PM",
  place: "Star Cineplex, Bashundhara",
  seat: "G7, G8",
} as const;

// ─── The name-gate ────────────────────────────────────────────────────────────

/**
 * Canonical ids the gate can resolve to.
 *
 * A canonical id is the *internal* name the journey associates with the
 * person who unlocked it. Most hosts will have exactly one canonical id
 * (the one person the mission is for), but you can add more if several
 * people share the same mission (e.g. `["partner", "best-friend"]`).
 *
 * For each canonical id, list every accepted spelling variant you can think
 * of — capitalisation, common typos, transliterations, nicknames. The matcher
 * is forgiving: lowercase + strip accents + Levenshtein-distance ≤ 2 counts
 * as a hit. See `name-match.ts` for the exact algorithm.
 */
export const CANONICAL_IDS = ["guest"] as const;

export interface CanonicalName {
  /** The internal id — used by the store and the agent prompt. */
  id: string;
  /** The pretty display name shown in the UI when this name matches. */
  display: string;
  /** Every accepted spelling variant. Add liberally. */
  variants: string[];
}

export const GATE_NAMES: CanonicalName[] = [
  {
    id: "guest",
    display: "Guest",
    variants: [
      "guest",
      "superstar",
      // ↓ replace these with your invitee's name and its common spellings
      // "emily",
      // "nigor",
      // "nighaar",
    ],
  },
];

/**
 * Hints revealed after `n` failed attempts. The first hint is the gentlest;
 * later hints get more direct. Add as many as you like.
 */
export const GATE_HINTS: { after: number; text: string }[] = [
  {
    after: 1,
    text: "The web is patient. Try a name it might recognise…",
  },
  {
    after: 3,
    text: "It begins with a letter you've already typed. Look again.",
  },
  {
    after: 5,
    text: "The person this mission is sealed for — say their name.",
  },
];

/**
 * Rejection lines, shown in order after each failed attempt. Add as many as
 * you like; the last one repeats forever.
 */
export const GATE_REJECTIONS: string[] = [
  "Access denied. The web does not yield.",
  "Wrong name. The silk tightens.",
  "Still wrong. The city watches in silence.",
  "No. Try again — the night is long.",
  "The web is disappointed but patient.",
];

// ─── Offline comfort replies ─────────────────────────────────────────────────

/**
 * When the AI agent endpoint is unreachable, the journey keeps the guest
 * company using these lines — but it NEVER advances to the next level while
 * offline (deliberate: you can tell at a glance whether the AI was live).
 *
 * Used in two pools:
 *   - OFFLINE_COMFORT: every stage except `booked`
 *   - BOOKED_COMFORT:  only after the YES, when the celebration is already done
 */
export const OFFLINE_COMFORT: string[] = [
  "The satellite is quiet tonight — but I'm still here. Tell me more.",
  "Signal's a little faint. Give me a moment and try again.",
  "Hmm, the web is tangled. Say that again?",
  "I lost that for a second. Could you repeat it?",
];

export const BOOKED_COMFORT: string[] = [
  "I'm still here. The night is yours — talk to me.",
  "The web hums softly. What else is on your mind?",
  "Stay a while. I love the sound of your voice.",
  "The stars are out. Tell me anything.",
];

// ─── Stage budgets (advanced) ────────────────────────────────────────────────

/**
 * Per-stage turn budget for the client-side pacing safety-net. If the live AI
 * hasn't advanced the journey after this many clear user turns, the client
 * gently advances it. Tune up if you want longer stays per level.
 *
 * Only `welcome`, `ielts`, and `heart` are paced this way — the `invite`
 * stage relies on the AI's own yes-detection, and `booked` is the finale.
 */
export const STAGE_BUDGETS: Partial<Record<Stage, number>> = {
  welcome: 4,
  ielts: 4,
  heart: 6,
};
