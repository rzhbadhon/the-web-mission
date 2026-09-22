# Changelog

All notable changes to **The Web Mission** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-09-22

### Added
- Open-source release of the original personal project.
- Single-file configuration (`src/lib/invitation/config.ts`) — every personalisation touchpoint in one place.
- Beautiful, commented template implementations for every `lib/invitation/*` file (`store`, `use-voice`, `audio-bus`, `sanitize`, `name-match`).
- Two API route templates (`/api/agent`, `/api/journey`) — both work with zero env vars set.
- Any-OpenAI-compatible-LLM support via `OPENAI_BASE_URL`.
- Admin log viewer at `/?admin=<ADMIN_KEY>`.
- Comprehensive `docs/` folder:
  - `CUSTOMIZATION.md` — deep personalisation guide
  - `SETUP.md` — environment, deployment, troubleshooting
  - `CLOUDFLARE_TUNNEL.md` — free public URL via Cloudflare
  - `VOICE_FREE_WINDOWS.md` — fully free, offline STT + TTS on Windows (Whisper, Vosk, Piper, eSpeak NG) with a copy-paste Python voice server
  - `GITHUB_PUSH.md` — pushing your fork to GitHub
- Spider-Man themed README with badges, ASCII art, and clean visual hierarchy.
- Procedural canvas textures (zero external image assets).
- Reduced-motion support: respects `prefers-reduced-motion` across the boot cinematic, particles, and scanline.
- Security: defensive `sanitize.ts` strips control chars (incl. RTL/LTR overrides), caps length, makes every AI reply HTML-safe.
- `LICENSE` (MIT) with trademark note.
- `.env.example`, `.gitignore`, `.eslintrc.json`, `components.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.js`.

### Anonymised
- Removed **all** hardcoded personal names from the source, docs, and config.
- All gender-specific pronouns in code comments and AI prompts have been replaced with gender-neutral language ("the guest" / "they").
- The hidden viewer's URL param is now `?admin=<key>` (was a personal-name key in the original).
- The env var is now `ADMIN_KEY` (was a personal-name key in the original).
- The reveal token is configurable via `HOST_REVEAL_TOKEN` (was a hardcoded personal token in the original).
- The matched-name canonical ids are configurable via `CANONICAL_IDS` (was hardcoded personal ids in the original).
- Example names in the customization docs use the popular, clearly-placeholder name "Emily" — no real personal data anywhere in the repo.

### Improved
- `next.config.js` enables `transpilePackages: ["three"]` and `optimizePackageImports` for `lucide-react` + `framer-motion` (smaller bundles).
- TypeScript `strict: true` enabled across the project.
- The `use-voice.ts` wrapper now does voice-picking with preference for voices matching the configured locale.
- The `name-match.ts` matcher now uses early-out Levenshtein (no per-cell computation when row minimum exceeds `max`).
- The `store.ts` now records `stageStartIdx` on every stage change for accurate per-stage turn counting.
- The `app/layout.tsx` sets `themeColor`, `viewport` (with `userScalable: false` for mobile), and prevents search-engine indexing (this is a personal invitation, not a public page).
- The `docs/` folder now includes a guide for running the whole mission with **fully free, open-source STT/TTS engines on Windows** — no API keys, no cloud, no cost.

### Removed
- All hardcoded references to the original author's name and the original recipient's name (the author's GitHub username remains only in README and `package.json` URLs).
- The original `.env` (replaced with `.env.example`).
- Unused shadcn/ui components (only `button` and `input` are referenced by the invitation components — the rest were trimmed to reduce bundle size and dependency footprint).

[1.0.0]: https://github.com/rzhbadhon/the-web-mission/releases/tag/v1.0.0
