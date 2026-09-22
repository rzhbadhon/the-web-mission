# 🛠 Setup, Deployment & Troubleshooting

End-to-end notes on getting The Web Mission running locally, on a host, or behind a tunnel — and what to do when something doesn't work.

---

## Table of contents
1. [Local development](#1-local-development)
2. [Environment variables](#2-environment-variables)
3. [Production build](#3-production-build)
4. [One-click deploy](#4-one-click-deploy)
5. [Sharing with your guest](#5-sharing-with-your-guest)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Local development

### Prerequisites
- **Node.js 18.18+** (20 LTS recommended)
- **npm 9+** (or pnpm / yarn)
- A modern Chromium-based browser (Chrome, Edge, Brave, Arc) or Safari 14.5+. Firefox doesn't ship speech recognition — the journey falls back to typed input.

### Install
```bash
git clone https://github.com/<your-username>/the-web-mission.git
cd the-web-mission
npm install
```

### Run dev server
```bash
npm run dev
# → http://localhost:3000
```

Open in Chrome. Type the gate name (default `guest` or `superstar` — change in `config.ts`). Tap the orb, allow the mic, talk.

### Useful scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build → `.next/` |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript only (`tsc --noEmit`) |

---

## 2. Environment variables

The mission works with **zero env vars set** (offline mode — the guide speaks comfort lines, the journey never advances past the voice stage). To make the AI come alive, copy the template and fill in:

```bash
cp .env.example .env.local
```

| Variable | Required? | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | optional | — | If unset, the AI is offline. If set, calls OpenAI (or any compatible endpoint via `OPENAI_BASE_URL`). |
| `OPENAI_BASE_URL` | optional | `https://api.openai.com/v1` | Swap to use Anthropic, Together, Groq, Mistral, DeepSeek, or local Ollama. |
| `OPENAI_MODEL` | optional | `gpt-4o-mini` | Model name. Use `gpt-4o` for more personality, `gpt-4o-mini` for speed/cost. |
| `ADMIN_KEY` | optional | `spidey` | Passkey for the `/?admin=<key>` log viewer. **Change this.** |
| `NEXT_PUBLIC_SITE_URL` | optional | — | The public URL you'll share with your guest (informational only). |

### Swap the LLM provider

The agent endpoint uses the standard OpenAI chat-completions API. To use a different provider:

**Anthropic Claude** (requires code change — Anthropic's API differs):
```ts
// In src/app/api/agent/route.ts, replace the fetch call with the
// Messages API. See Anthropic docs: https://docs.anthropic.com
```

**Ollama (local model, no API key, no cost):**
```bash
# 1. Install Ollama: https://ollama.com
ollama pull llama3.1
ollama serve  # runs on :11434

# 2. Set env:
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=llama3.1
OPENAI_API_KEY=unused
```

**Together / Groq / Mistral / DeepSeek / OpenRouter** — all OpenAI-compatible:
```bash
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=gsk_...
```

---

## 3. Production build

```bash
npm run build
npm run start
# → http://localhost:3000
```

The build outputs to `.next/`. The app is a standard Next.js 14 App Router project — runs anywhere Node 18+ does.

### Memory note
The default `/api/journey` route uses an in-memory `Map`. That means:
- ✅ Works perfectly for local dev / one-user tunnels / single-instance deploys.
- ❌ Resets on every serverless cold start (Vercel, Cloudflare Pages Workers).
- ❌ Not shared across multiple instances.

For production persistence, swap the in-memory `Map` in `src/app/api/journey/route.ts` for:
- **SQLite** (`better-sqlite3`) — easiest for single-instance hosts (Railway, Fly.io, a VPS).
- **Postgres / MySQL** — managed, works on serverless.
- **Cloudflare D1 / Turso / Supabase** — serverless-friendly.
- **Vercel KV / Upstash Redis** — key-value, fits the simple schema.

The schema is tiny (one table, ~7 columns) — 15 minutes of work to migrate.

---

## 4. One-click deploy

### Vercel (recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/<your-username>/the-web-mission)

Or via CLI:
```bash
npm i -g vercel
vercel
# follow prompts; on first deploy set env vars:
#   OPENAI_API_KEY, ADMIN_KEY
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy
```
Set env vars in the Netlify dashboard.

### Cloudflare Pages
Works via the Next.js adapter. Use the Pages dashboard to import the GitHub repo and let it auto-detect Next.js.

### Self-hosted (VPS / Railway / Fly.io / Render)
Any Node-capable host works. Standard:
```bash
npm install --omit=dev
npm run build
npm run start  # listens on $PORT or 3000
```

---

## 5. Sharing with your guest

Three options, easiest first:

### A · Cloudflare Tunnel (free, no deploy) — see [CLOUDFLARE_TUNNEL.md](./CLOUDFLARE_TUNNEL.md)
Run the mission on your laptop, expose via a free Cloudflare URL. When the night is over, kill the tunnel — the link dies.

### B · Local network only
If your guest is on the same Wi-Fi:
```bash
npm run dev -- -H 0.0.0.0
# → http://<your-laptop-local-ip>:3000
```
Find your local IP:
- **Mac**: `System Settings → Network` or `ipconfig getifaddr en0`
- **Windows**: `ipconfig` → look for IPv4
- **Linux**: `ip addr show | grep inet`

### C · Public deploy
Push to Vercel/Netlify → share the URL. The journey is yours forever (or until you take it down).

---

## 6. Troubleshooting

### The mic doesn't work / Safari shows "denied"
- **Safari iOS**: Settings → Safari → Microphone → "Allow". iOS 14.5+ required.
- **Chrome**: `chrome://settings/content/microphone` → ensure the site is allowed.
- **Browsers**: Firefox doesn't ship `SpeechRecognition` — the journey falls back to typed input. Use Chrome/Edge/Safari.

### The guide speaks but the city doesn't react
The 3D scene reads voice levels from `audioBus.micLevel` and `audioBus.guideLevel`. If you've replaced `use-voice.ts` with a custom implementation, make sure you're writing to these fields. See `audio-bus.ts`.

### The AI replies "offline" even with a key set
- Check `.env.local` is loaded: `printenv OPENAI_API_KEY` from the project root after `npm run dev` started. If empty, restart the dev server (Next.js only reads `.env.local` at boot).
- Check the network: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`.
- Check the model name in `OPENAI_MODEL` — `gpt-4o-mini` is correct; `gpt-4-mini` is not.
- The endpoint has a 12s timeout. If your LLM is slow, the request aborts and falls back to offline.

### The gate rejects every name
- Check the spelling matches one of the `variants` in `GATE_NAMES` (in `config.ts`).
- The matcher forgives typos (Levenshtein ≤ 2) but won't forgive "John" when you configured "Emily". Add every spelling you can think of.
- Visit `/?admin=<ADMIN_KEY>` and look at the logged journeys — the `nameEntered` field shows exactly what your guest typed.

### The journey resets on refresh
- The journey state is saved to `localStorage` under `webmission-state-v1` and restored on load.
- If you cleared localStorage (or are using a private window), the journey starts fresh — that's expected.
- The session id is `webmission-id-v1` in the same `localStorage`. If you change `ADMIN_KEY` or the canonical ids between sessions, old saves fall back to the first canonical id.

### The 3D world is laggy
- Lower `dpr={[1, 1.8]}` in `Scene3D.tsx` → `dpr={[1, 1.2]}`.
- Reduce `BUILDINGS` in `City.tsx` (46 → 24).
- Reduce `COUNT` in `Fireworks.tsx` (240 → 120).
- Use a device with a dedicated GPU — the scene is GPU-heavy.

### Hydration mismatch errors in console
The boot cinematic and the 3D scene are loaded with `next/dynamic` and `{ ssr: false }` to avoid hydration mismatches. If you see them anyway, check that any component touching `window`, `document`, or `localStorage` is either:
- wrapped in `useEffect`, OR
- imported via `next/dynamic` with `ssr: false`.

### The book/chapter banner overlaps the chat
The banner is `fixed` and uses `z-30`. If you've added a new element with `z-30+`, that's the cause.

---

## Need more help?
- Open an issue: https://github.com/<your-username>/the-web-mission/issues
- Read the source — every file is heavily commented.
- For AI-agent-friendly file-by-file introspection, point your agent at the `docs/` folder and `src/lib/invitation/config.ts`.
