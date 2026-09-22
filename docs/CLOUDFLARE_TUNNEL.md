# 🌩 Cloudflare Tunnel — share your local mission with anyone

Run The Web Mission on your own laptop, expose it via a free Cloudflare URL, and share that URL with your guest. When the night is over, kill the tunnel — the link dies. No deploy, no cost, no setup.

This is the **recommended** way to share the mission for a one-night event.

---

## What you'll get

After ~5 minutes of setup, you'll have:
```
https://<random-words>.trycloudflare.com
```
A public HTTPS URL that proxies to `http://localhost:3000` on your laptop. Anyone on the internet can open it; they're talking to your laptop; you can shut it down whenever.

---

## Step 1 · Install `cloudflared`

### Mac
```bash
brew install cloudflared
```
Or download the binary from https://github.com/cloudflare/cloudflared/releases and put it on your `$PATH`.

### Windows
Download `cloudflared.exe` from https://github.com/cloudflare/cloudflared/releases/latest and put it in your `PATH`. Or via winget:
```powershell
winget install --id Cloudflare.cloudflared
```

### Linux
```bash
# Debian/Ubuntu
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
# Arch
sudo pacman -S cloudflared
```

Verify:
```bash
cloudflared --version
```

---

## Step 2 · Run the mission locally

```bash
cd the-web-mission
npm install
npm run dev
# → http://localhost:3000 is now serving the mission
```

Leave that terminal open.

---

## Step 3 · Start the tunnel

In a new terminal:

```bash
npm run tunnel
# OR, equivalently:
cloudflared tunnel --url http://localhost:3000
```

You'll see output like:
```
+--------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take |
|  a few seconds to be reachable):                              |
|  https://random-words-xxxx.trycloudflare.com                 |
+--------------------------------------------------------------+
```

Copy that URL. **That's the link you send to your guest.**

### Test it
- Open the URL in an incognito window on your own machine — make sure the gate appears.
- Visit `https://<your-tunnel>.trycloudflare.com/?admin=<ADMIN_KEY>` to see the (empty) mission log.

---

## Step 4 · Customize (optional)

You can change the local port the mission listens on:
```bash
# In .env.local or by editing package.json:
PORT=4000
npm run dev

# Then tunnel to that port:
cloudflared tunnel --url http://localhost:4000
```

---

## Step 5 · Send the link

Send the link via your favourite channel:
- WhatsApp / Telegram / iMessage
- Email
- A printed QR code (free generators abound)

Tell your guest:
> "Open this link on Chrome (Android) or Safari (iOS 14.5+). Type your name. Allow the mic. Talk."

---

## Step 6 · Watch the mission log (optional)

Visit `https://<your-tunnel>.trycloudflare.com/?admin=<ADMIN_KEY>`. As your guest walks through the journey, you'll see:
- The name they typed (and whether it matched).
- The stage they reached.
- The full transcript (every voice turn).
- Whether the AI was LIVE or OFFLINE during each reply.
- Whether they said YES.

Refresh the page for the latest.

---

## Step 7 · End the night

When the night is over (or your guest is done), press `Ctrl+C` in the tunnel terminal. The URL stops working instantly — the link is gone forever.

If you want the journey log to persist, **before** killing the tunnel, open the mission log and screenshot it — the in-memory store dies with the dev server.

---

## Going further — named tunnels (optional)

The quick tunnel gives you a random URL every time. If you want a stable, named URL like `https://mission.your-domain.com`, set up a named tunnel:

```bash
# One-time setup (login + create tunnel):
cloudflared tunnel login
cloudflared tunnel create the-web-mission
# Note the tunnel ID + the cert.pem path.

# Add a route (requires your domain on Cloudflare):
cloudflared tunnel route dns the-web-mission mission.your-domain.com

# Run the tunnel:
cloudflared tunnel run --url http://localhost:3000 the-web-mission
```

See [Cloudflare's docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) for the full guide.

---

## Troubleshooting

### The tunnel URL loads but the gate doesn't appear
- Check `npm run dev` is still running in the other terminal.
- Open DevTools → Network — if `/api/agent` 500s, check the server logs.
- Hard-refresh (Cmd+Shift+R / Ctrl+Shift+R) — Cloudflare caches aggressively.

### The mic still doesn't work on the tunnel URL
- The tunnel URL is HTTPS — that's required for `getUserMedia` (mic access).
- Check `chrome://settings/content/microphone` — the tunnel URL should be allowed.
- Safari iOS: Settings → Safari → Microphone → "Allow".

### Cloudflare blocks something
Cloudflare's free tier applies bot protection to HTML pages but generally not to API calls. If you see a "Just a moment…" page, that's Cloudflare's bot challenge — refresh; it usually passes.

### I want HTTPS but my own domain
Use a named tunnel (above) — point a subdomain on your Cloudflare-managed domain at the tunnel.

### Can I have multiple tunnels?
Yes — but the in-memory journey store is per-process. If you run two laptops with the same code, each has its own mission log.

---

## Why Cloudflare Tunnel?

- **Free, forever, no credit card.**
- **No deploy** — your laptop is the server.
- **HTTPS by default** — required for `getUserMedia` (mic access) on every modern browser.
- **Ephemeral** — kill the tunnel, the link dies. Perfect for a one-night event.
- **No port forwarding** — works behind NAT, in coffee shops, on hotel Wi-Fi.

Alternatives:
- **ngrok** — similar free tier, similar UX. `ngrok http 3000` → `https://xxxx.ngrok.io`.
- **localtunnel** — npm package, completely free, no install. `npx localtunnel --port 3000`. Less reliable than Cloudflare but zero setup.
- **Tailscale Funnel** — exposes a local service to the public internet via Tailscale. Requires a Tailscale account.
