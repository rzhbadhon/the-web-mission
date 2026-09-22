# 🎨 Customisation Guide

This guide walks you through every personalisation touchpoint in The Web Mission. After reading it, you'll know exactly which file to edit to change X.

> **TL;DR — 90% of personalisation lives in one file:** `src/lib/invitation/config.ts`. Open it, edit strings, save. Done.

---

## Table of contents
1. [The host's identity](#1-the-hosts-identity)
2. [The guest's accepted names](#2-the-guests-accepted-names)
3. [The invitation details (ticket)](#3-the-invitation-details-ticket)
4. [The gate's branding & rejections](#4-the-gates-branding--rejections)
5. [The AI guide's personality](#5-the-ai-guides-personality)
6. [The voice & language](#6-the-voice--language)
7. [The 3D world (Spidey, car, city, fireworks)](#7-the-3d-world-spidey-car-city-fireworks)
8. [Adding or removing stages](#8-adding-or-removing-stages)
9. [Re-theming away from Spider-Man](#9-re-theming-away-from-spider-man)

---

## 1. The host's identity

The "host" is the person who built this mission — you. Your name appears on the ticket and is revealed by Parker during the invite stage.

**File:** `src/lib/invitation/config.ts`

```ts
export const HIM = {
  name: "the Host", // ← change to your name
} as const;

export const HOST_REVEAL_TOKEN = "the host";
```

- `HIM.name` shows up on the ticket: *"Guest of honour: {displayName} — with {HIM.name}"*.
- `HOST_REVEAL_TOKEN` is a string the AI uses when it's time to reveal your identity. The pacing logic also watches for this token to know "the reveal has happened — start listening for a yes".
  - If you change `HIM.name`, change the token to match (e.g. `HIM.name = "Alex"`, `HOST_REVEAL_TOKEN = "Alex"`).
  - **Important:** The agent prompt (in `src/app/api/agent/route.ts`) references this token — keep them in sync.

---

## 2. The guest's accepted names

The gate only opens for one (or a few) specific names. Configure them here:

**File:** `src/lib/invitation/config.ts`

```ts
export const CANONICAL_IDS = ["guest"] as const;

export const GATE_NAMES: CanonicalName[] = [
  {
    id: "guest",          // internal id, must be in CANONICAL_IDS
    display: "Guest",     // shown in the UI
    variants: [
      "guest",
      "superstar",
      // ↓ replace these with your invitee's name + every common spelling
      // "emily",
      // "emiloy",
      // "emi",
    ],
  },
];
```

**How matching works** (see `src/lib/invitation/name-match.ts`):
1. Input is normalised (lowercase, accents stripped, punctuation removed).
2. If it exactly matches a variant → ✅.
3. Otherwise Levenshtein distance ≤ 2 → "close" — softer rejection.
4. Anything else → hard reject.

**Tips for adding variants:**
- Add typos you've actually seen your friend make.
- Add transliterations (Bangla ↔ English: "Emily" / "Emilee" / "Emy").
- Add nicknames ("Niggy", "Sweetie").
- Capitalisation doesn't matter — `"EMILY"` matches `"emily"`.

**Multiple guests?** Add more entries to `GATE_NAMES` and their ids to `CANONICAL_IDS`. The same journey will work for any of them — useful for sharing the same link with two friends.

---

## 3. The invitation details (ticket)

The golden ticket at the end shows the date / time / place / seats of your invitation. All strings — the UI doesn't parse them.

**File:** `src/lib/invitation/config.ts`

```ts
export const MOVIE = {
  title: "Spider-Man: Into the Spider-Verse",
  date: "Friday, 25 December",
  time: "7:00 PM",
  place: "Star Cineplex, Bashundhara",
  seat: "G7, G8",
} as const;
```

You can put anything here — it doesn't have to be a movie. The template uses "movie" because the original was a movie date, but you could use it for:
- A concert ("Coldplay — Music of the Spheres Tour")
- A dinner ("Italian night at Bella Cucina")
- A weekend trip ("Train to Sylhet — Saturday 7am")

The `seat` field is a free-form string — use "Table 4" or "Row C" or anything that fits.

---

## 4. The gate's branding & rejections

The lock screen shows a wax seal with a letter, a codename, and a tagline.

**File:** `src/lib/invitation/config.ts`

```ts
export const SITE = {
  senderLabel: "H",              // ← the letter on the wax seal (usually your initial)
  codename: "THE WEB MISSION",   // ← the big title
  tagline: "EYES ONLY · ONE MISSION · ONE PERSON",
} as const;
```

For wrong-name rejections (in order, last repeats forever):

```ts
export const GATE_REJECTIONS: string[] = [
  "Access denied. The web does not yield.",
  "Wrong name. The silk tightens.",
  // add more, in order
];
```

And hints that surface after N failed attempts:

```ts
export const GATE_HINTS: { after: number; text: string }[] = [
  { after: 1, text: "The web is patient. Try a name it might recognise…" },
  { after: 3, text: "It begins with a letter you've already typed. Look again." },
  { after: 5, text: "The person this mission is sealed for — say their name." },
];
```

---

## 5. The AI guide's personality

"Parker" is the AI guide — charming, slightly teasing, lightly flirty, cinematic. To change the personality, edit the system prompt:

**File:** `src/app/api/agent/route.ts` → function `systemPrompt(stage)`

Look for the long template string starting with `"You are "Parker", a charming, slightly teasing AI guide..."`. Change the tone, the rules, the stage behaviours. The model is instructed to return strict JSON:

```json
{ "reply": "...", "action": "stay|advance|celebrate", "score": null }
```

**Things you might want to change:**
- The guide's name (currently "Parker") — search & replace in this file and in `JourneyChat.tsx` (the "P" avatar label) + `AdminViewer.tsx` (the "Parker" tag).
- The tone — make it more formal, more playful, more poetic, in a different language.
- The host's reveal language.
- The IELTS scoring scale (currently 0–9).

**Advanced — swap the LLM entirely:**
The template uses the standard OpenAI chat completions API. To use:
- **Anthropic Claude** → swap the `/chat/completions` call for the Messages API
- **Google Gemini** → swap for the Gemini generateContent endpoint
- **Ollama / local** → set `OPENAI_BASE_URL=http://localhost:11434/v1` (Ollama speaks OpenAI's API)
- **Together / Groq / Mistral / DeepSeek** → just change `OPENAI_BASE_URL` and `OPENAI_MODEL`

---

## 6. The voice & language

The guide speaks in `VOICE_LANG` (default `"en-US"`). Change it for a different accent:

**File:** `src/lib/invitation/config.ts`

```ts
export const VOICE_LANG: "bn-BD" | "en-US" = "en-US";
```

- `"en-US"` — American English (most voice options)
- `"en-GB"` — British English (you may need to extend the type)
- `"bn-BD"` — Bengali (Bangladesh) — works in Chrome with limited voices
- `"hi-IN"` — Hindi
- `"es-ES"`, `"fr-FR"`, `"ja-JP"`, etc.

**Notes:**
- The guest's speech recognition locale follows the same `VOICE_LANG`.
- The voice is picked at runtime: the engine prefers a matching-language female voice. If none matches, it falls back to the system default.
- Browsers ship different voices — Chrome has Google's, Safari has Apple's. There's no guarantee a specific voice exists; the code does its best.

---

## 7. The 3D world (Spidey, car, city, fireworks)

Each 3D element is its own component in `src/components/invitation/scene3d/`:

| File | What it draws |
|---|---|
| `Scene3D.tsx` | The Canvas, lighting, fog, camera rig |
| `City.tsx` | 46 instanced skyscrapers with lit windows |
| `Road.tsx` (inside Scene3D) | The neon road the car drives on |
| `SpideyCar.tsx` | The hypercar — single extruded body, neon underglow, full-width LEDs |
| `SpiderSwing.tsx` | The hero — hangs upside-down, pendulum swings, reacts to the guest's voice |
| `WebStrands.tsx` | Glowing silk lines arcing across the sky |
| `Dangler.tsx` | The cute low-poly spider at the gate |
| `Fireworks.tsx` | 240-particle instanced celebration |
| `textures.ts` | Procedural canvas textures (windows, road, web decal, glow, moon) |

To customise:
- **Colors** — search for `RED = "#c8102e"` / `BLUE = "#1f3a93"` / `DARK = "#0d0d14"` in each file. The palette is intentionally consistent.
- **Speeds** — `DRIVE: Record<Stage, number>` in `SpideyCar.tsx` controls how fast the car cruises per stage. `ROAD_SPEED` in `Scene3D.tsx` is the road scroll.
- **Camera framing** — `CAMS: Record<Stage, ...>` in `Scene3D.tsx` controls where the camera sits for each stage.

---

## 8. Adding or removing stages

The journey walks through `STAGE_ORDER` (defined in `config.ts`). Adding a stage is a 4-step change:

1. Add the new stage to the `Stage` type and `STAGE_ORDER` array in `config.ts`.
2. Update `CHAPTERS` and `CHAPTER_TITLES` in `JourneyChat.tsx`.
3. Add a banner for it in `MissionExperience.tsx`'s `goStage`.
4. Update the `systemPrompt()` function in `app/api/agent/route.ts` so the AI knows what to do in the new stage.

Removing a stage is the reverse — but be careful, the pacing logic in `MissionExperience.tsx` references stage names directly.

---

## 9. Re-theming away from Spider-Man

If you want to publish without any trademarked references, here's the checklist:

- **`SpiderSwing.tsx`** — rename & re-skin the hero. The figure is built from primitives (cylinder, sphere, capsule) — replace with a different character (an astronaut, a fairy, a bat, an angel, a drone).
- **`BootCinematic.tsx`** — the SVG figure and the title (`TITLE = "THE WEB MISSION"`) are easy to swap.
- **`Dangler.tsx`** — the cute spider at the gate. Replace with a moon, a star, a hummingbird, anything.
- **`SpideyCar.tsx`** — the supercar is generic (no brand references) but you can swap for a different vehicle.
- **`webTexture()` in `textures.ts`** — used as a hood decal; replace with any pattern.
- **`SITE.codename` in `config.ts`** — change the title to whatever you want.
- **The agent prompt in `app/api/agent/route.ts`** — references "Parker" and "Spider-Man" in the system prompt. Re-write for your theme.

You can also re-color the whole experience by changing the CSS variable `--wm-accent` in `globals.css` — currently `#e62429` (Spider-Man red). Try `#00d4aa` (Matrix green), `#ff8e3c` (sunset orange), `#7b2cbf` (royal purple).

---

## Need more?

- For deep technical changes → read the source. Every file is heavily commented.
- For env / deployment / troubleshooting → see [SETUP.md](./SETUP.md).
- For sharing with your guest via a free public URL → see [CLOUDFLARE_TUNNEL.md](./CLOUDFLARE_TUNNEL.md).
- For pushing your changes to your own GitHub repo → see [GITHUB_PUSH.md](./GITHUB_PUSH.md).
