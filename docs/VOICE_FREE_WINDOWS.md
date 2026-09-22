# 🎙 Free STT & TTS on Windows — run the whole mission for free

The Web Mission works out-of-the-box using the **Web Speech API** built into Chrome and Safari — that's free, no install, no API key. But:

- **Chrome's STT** sends audio to Google's cloud for transcription (privacy concern + needs internet).
- **System TTS voices** on Windows are limited and robotic.

If you want **fully local, fully free, no-cloud, offline** speech recognition and synthesis on Windows, this guide walks you through setting up three excellent open-source engines:

| Engine | Role | Quality | Speed | Size |
|---|---|---|---|---|
| **Whisper** (OpenAI) | STT | Excellent | Medium (CPU) / Fast (GPU) | ~150 MB per model |
| **Vosk** (Alphacep) | STT | Very good | Very fast (CPU) | ~50 MB per model |
| **Piper** (Rhasspy) | TTS | Excellent (neural) | Real-time on CPU | ~60 MB per voice |
| **eSpeak NG** | TTS | Robotic but tiny | Instant | ~5 MB |

You only need one STT and one TTS. The recommended combo for quality: **Whisper + Piper**. For speed: **Vosk + Piper**. For absolute minimum install: **eSpeak NG** alone.

---

## Table of contents

1. [Architecture — how this fits the mission](#1-architecture--how-this-fits-the-mission)
2. [Install Piper (TTS)](#2-install-piper-tts)
3. [Install Whisper (STT)](#3-install-whisper-stt)
4. [Install Vosk (STT)](#4-install-vosk-stt)
5. [Install eSpeak NG (TTS)](#5-install-espeak-ng-tts)
6. [Wire it up — a tiny local voice server](#6-wire-it-up--a-tiny-local-voice-server)
7. [Switch the mission to use it](#7-switch-the-mission-to-use-it)
8. [Alternative — use Chrome's built-in only](#8-alternative--use-chromes-built-in-only)

---

## 1. Architecture — how this fits the mission

```
┌─────────────────────────────┐         ┌──────────────────────────────────┐
│  The Web Mission (browser)  │         │  Your Windows PC (localhost)     │
│                              │         │                                   │
│  use-voice.ts (TTS + STT)  │  HTTP   │  ┌─────────────────────────────┐ │
│           │                  │ ──────> │  │  tiny local voice server    │ │
│           │                  │ <────── │  │  (Node or Python, ~60 LOC)  │ │
│           ▼                  │  JSON  │  │                              │ │
│   POST /api/voice           │         │  │  POST /stt → Whisper/Vosk   │ │
│   (audio chunk + text)      │         │  │  POST /tts → Piper/eSpeak    │ │
│                              │         │  └─────────────────────────────┘ │
└─────────────────────────────┘         └──────────────────────────────────┘
```

The browser captures mic audio and sends it to a tiny **local voice server** (running on your PC). The server calls the local STT engine, returns the text. The mission calls the same server's TTS endpoint, gets an audio stream back, plays it. Nothing leaves your machine.

This is the **alternative to** the Web Speech API. You can run **either** approach — not both.

---

## 2. Install Piper (TTS)

> **Piper** is a fast, local, neural TTS engine. Quality is on par with Google's cloud TTS. Runs in real-time on a 2015-era CPU.

### Step 2.1 · Download

1. Go to https://github.com/rhasspy/piper/releases/latest
2. Download `piper_winamd64.zip` (the Windows AMD64 build)
3. Extract anywhere — e.g. `C:\piper\`

### Step 2.2 · Download a voice

1. Go to https://huggingface.co/rhasspy/piper-voices/tree/main/en
2. Pick a voice — e.g. `en_US-amy-medium.onnx` (recommended — natural female US English)
3. Place the `.onnx` file in `C:\piper\voices\`

### Step 2.3 · Test

Open PowerShell:
```powershell
echo "Hello from the web mission." | C:\piper\piper.exe `
  --model C:\piper\voices\en_US-amy-medium.onnx `
  --output_file C:\piper\test.wav

# Play it
Start-Process C:\piper\test.wav
```

You should hear "Hello from the web mission" in Amy's voice. ✅

### Available voices (free, all on HuggingFace)

- `en_US-amy-medium` — natural female US English (recommended default)
- `en_US-ryan-high` — natural male US English
- `en_GB-northern_english_male-medium` — male British
- `en_GB-jenny_dioco-medium` — female British
- `bn_BD-sadhin-medium` — female Bangladeshi Bengali
- `hi_IN-sadhin-medium` — female Hindi
- … and dozens more (Spanish, French, German, Arabic, Mandarin, Japanese, …)

Browse all: https://huggingface.co/rhasspy/piper-voices/tree/main

---

## 3. Install Whisper (STT)

> **Whisper** is OpenAI's open-source speech recognition model. The model itself is fully open — runs locally, no API key, no cloud. The most popular local wrapper is **whisper.cpp** (C++ port, super fast, single executable).

### Step 3.1 · Download whisper.cpp

1. Go to https://github.com/ggerganov/whisper.cpp/releases/latest
2. Download `whisper-bin-x64.zip` (Windows x64)
3. Extract to `C:\whisper\`

### Step 3.2 · Download a model

1. Go to https://huggingface.co/ggerganov/whisper.cpp/tree/main
2. Download `ggml-base.en.bin` (English-only, 75 MB — fastest) **or** `ggml-base.bin` (multilingual, 145 MB)
3. Place in `C:\whisper\models\`

### Step 3.3 · Test

```powershell
# record a 5-second clip
# (use Windows' built-in Sound Recorder, save as C:\whisper\test.wav — 16kHz mono)

C:\whisper\main.exe -m C:\whisper\models\ggml-base.en.bin -f C:\whisper\test.wav
```

You should see the transcribed text. ✅

### Model size guide

| Model | Size | Speed | Accuracy | Use case |
|---|---|---|---|---|
| `tiny.en` | 75 MB | ⚡ Fastest | OK | Real-time, mid-range CPUs |
| `base.en` | 145 MB | ⚡ Fast | Good | **Recommended default** |
| `small.en` | 480 MB | Medium | Very good | Quiet environments |
| `medium.en` | 1.5 GB | Slow | Excellent | Background-noise tolerance |
| `large-v3` | 3 GB | Slow | State-of-art | When accuracy is everything |

---

## 4. Install Vosk (STT)

> **Vosk** is a smaller, faster offline STT engine. Lower accuracy than Whisper but tiny and instant — great for real-time chat.

### Step 4.1 · Download Vosk CLI

1. Go to https://alphacephei.com/vosk/install
2. Download `vosk-win64-0.3.45.zip` (or latest)
3. Extract to `C:\vosk\`

### Step 4.2 · Download a model

1. Go to https://alphacephei.com/vosk/models
2. Download `vosk-model-small-en-us-0.15.zip` (50 MB — fast) **or** `vosk-model-en-us-0.22.zip` (1.3 GB — more accurate)
3. Extract to `C:\vosk\models\en-us\`

### Step 4.3 · Test

Vosk doesn't ship a CLI out of the box — use the Python wrapper:

```powershell
pip install vosk soundfile

python -c "from vosk import Model; print('Vosk model loaded:', Model(r'C:\\vosk\\models\\en-us').dosini())"
```

(See step 6 for a complete Python voice server that uses Vosk.)

---

## 5. Install eSpeak NG (TTS)

> **eSpeak NG** is the lightest TTS engine in existence — 5 MB install, instant speech, robotic voice. Perfect fallback if you can't run Piper.

### Step 5.1 · Download

1. Go to https://github.com/espeak-ng/espeak-ng/releases/latest
2. Download `espeak-ng-x64.msi` (Windows installer)
3. Run installer — installs to `C:\Program Files\eSpeak NG\`

### Step 5.2 · Test

```powershell
& "C:\Program Files\eSpeak NG\espeak-ng.exe" "The web mission is online."
```

You'll hear it. ✅

### Voices

```powershell
# list all voices
& "C:\Program Files\eSpeak NG\espeak-ng.exe" --voices

# pick one
& "C:\Program Files\eSpeak NG\espeak-ng.exe" -v en-us "Hello."
& "C:\Program Files\eSpeak NG\espeak-ng.exe" -v en-gb "Hello."
& "C:\Program Files\eSpeak NG\espeak-ng.exe" -v bn "নমস্কার।"
```

---

## 6. Wire it up — a tiny local voice server

This is a single Python file (`voice_server.py`) that exposes two HTTP endpoints:

- `POST /stt` — accepts an audio file, returns `{"text": "..."}`
- `POST /tts` — accepts `{"text": "..."}`, returns an audio WAV stream

Save it anywhere (e.g. `C:\web-mission-voice\voice_server.py`).

```python
# voice_server.py — local STT + TTS HTTP server for The Web Mission
# Free, offline, Windows-compatible. Requires Python 3.10+.
#
# Install deps:
#   pip install fastapi uvicorn python-multipart vosk soundfile
#
# (Assumes Piper is at C:\piper\piper.exe and a voice model at
#  C:\piper\voices\en_US-amy-medium.onnx. Change paths below.)
#
# Run:
#   python voice_server.py
# → serves on http://localhost:8765

from fastapi import FastAPI, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
import subprocess, tempfile, os, json, shutil
from pathlib import Path

# ─── Paths — edit to match your install ─────────────────────────────────
PIPER_EXE = r"C:\piper\piper.exe"
PIPER_VOICE = r"C:\piper\voices\en_US-amy-medium.onnx"

WHISPER_EXE = r"C:\whisper\main.exe"
WHISPER_MODEL = r"C:\whisper\models\ggml-base.en.bin"

VOSK_MODEL = r"C:\vosk\models\en-us"  # set to None to skip Vosk

# ─── App ──────────────────────────────────────────────────────────────
app = FastAPI(title="The Web Mission — local voice server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # the dev server lives on :3000
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "tts": "piper" if Path(PIPER_EXE).exists() else "missing",
        "stt": "whisper" if Path(WHISPER_EXE).exists() else (
            "vosk" if VOSK_MODEL and Path(VOSK_MODEL).exists() else "missing"
        ),
    }

@app.post("/tts")
async def tts(text: str = ""):
    if not text:
        return Response(status_code=400, content="empty text")
    # Piper writes WAV to stdout when called with --output-raw or to a file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        out_path = f.name
    try:
        subprocess.run(
            [PIPER_EXE, "--model", PIPER_VOICE, "--output_file", out_path],
            input=text.encode("utf-8"),
            check=True,
            capture_output=True,
        )
        audio = Path(out_path).read_bytes()
        return Response(content=audio, media_type="audio/wav")
    finally:
        if os.path.exists(out_path):
            os.remove(out_path)

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    # Save the uploaded audio to a temp file
    suffix = os.path.splitext(file.filename or "")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(await file.read())
        in_path = f.name

    try:
        # ── Try Whisper first ──────────────────────────────────────────
        if Path(WHISPER_EXE).exists():
            # Whisper requires 16kHz mono WAV. If your client sends 48kHz,
            # use ffmpeg to convert: ffmpeg -i in.wav -ar 16000 -ac 1 out.wav
            out = subprocess.run(
                [WHISPER_EXE, "-m", WHISPER_MODEL, "-f", in_path, "-nt"],
                capture_output=True, text=True,
            )
            # Whisper prints "[0:00:00.000 --> 0:00:05.000]  Hello world."
            text = " ".join(
                line.split("]", 1)[1].strip()
                for line in out.stdout.splitlines()
                if "]" in line and line.strip()
            ).strip()
            return {"text": text, "engine": "whisper"}

        # ── Fall back to Vosk ──────────────────────────────────────────
        if VOSK_MODEL and Path(VOSK_MODEL).exists():
            from vosk import Model, KaldiRecognizer
            import wave
            wf = wave.open(in_path, "rb")
            model = Model(VOSK_MODEL)
            rec = KaldiRecognizer(model, wf.getframerate())
            rec.SetWords(True)
            text = ""
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    part = json.loads(rec.Result())
                    text += " " + part.get("text", "")
            final = json.loads(rec.FinalResult())
            text += " " + final.get("text", "")
            return {"text": text.strip(), "engine": "vosk"}

        return Response(status_code=503, content="no STT engine configured")
    finally:
        if os.path.exists(in_path):
            os.remove(in_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)
```

### Run it

```powershell
cd C:\web-mission-voice
pip install fastapi uvicorn python-multipart vosk soundfile
python voice_server.py
# → serving on http://127.0.0.1:8765
```

### Test it

```powershell
# TTS
curl -X POST "http://127.0.0.1:8765/tts?text=Hello%20world" --output test.wav
Start-Process test.wav

# STT (record a 5-sec WAV at 16kHz mono first)
curl -X POST -F "file=@test.wav" http://127.0.0.1:8765/stt
# → {"text": "Hello world", "engine": "whisper"}
```

---

## 7. Switch the mission to use it

Open `src/lib/invitation/use-voice.ts`. Replace the Web Speech API calls with fetch calls to your local server. The shape stays the same — `speak(text)`, `startListening()`, `stopListening()`.

Here's a minimal patch:

```typescript
// === REPLACE the speak() function body with this ===
const speak = useCallback(
  (text: string, onDone?: () => void) =>
    new Promise<void>(async (resolve) => {
      try {
        audioBus.guideLevel = 0.6;
        const res = await fetch("http://127.0.0.1:8765/tts?text=" + encodeURIComponent(text));
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          audioBus.guideLevel = 0;
          URL.revokeObjectURL(url);
          onDone?.();
          resolve();
        };
        audio.play();
      } catch {
        audioBus.guideLevel = 0;
        onDone?.();
        resolve();
      }
    }),
  []
);

// === REPLACE the startListening() function body with this ===
// (Records 6 seconds of mic audio and posts it to the local STT endpoint.)
const startListening = useCallback(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const fd = new FormData();
      fd.append("file", blob, "voice.webm");
      const res = await fetch("http://127.0.0.1:8765/stt", { method: "POST", body: fd });
      const data = await res.json();
      if (data.text) userListenerRef.current(data.text);
      stream.getTracks().forEach((t) => t.stop());
    };
    recorder.start();
    setTimeout(() => recorder.stop(), 6000);  // 6s capture window
    return true;
  } catch {
    return false;
  }
}, []);
```

**Note**: This is a minimal example. For production polish:
- Convert the WebM chunk to WAV (16kHz mono) before sending to Whisper — use `ffmpeg.wasm` in the browser or send to a server endpoint that does the conversion with `ffmpeg`.
- Stream the TTS audio (Piper supports stdout streaming — pipe it directly to the response).
- For real-time Vosk, keep a WebSocket open to the local server instead of fixed 6-second windows.

### Set the new endpoint in `.env.local`
Add a env var so you can swap easily:
```
VOICE_SERVER=http://127.0.0.1:8765
```
Then read it via `process.env.VOICE_SERVER` in the Next.js API route, or via `NEXT_PUBLIC_VOICE_SERVER` if used client-side.

---

## 8. Alternative — use Chrome's built-in only

You don't have to install anything. The default `use-voice.ts` implementation uses:

- **TTS**: `speechSynthesis` — uses Windows' built-in voices (Microsoft David Desktop, Microsoft Zira Desktop, etc.). Free, no install. Quality is mediocre but functional.
- **STT**: `SpeechRecognition` — in Chrome, this sends audio to Google's cloud. Free for the user (no API key needed) but requires internet and isn't private. In Edge, it uses Microsoft's cloud. In Safari, Apple's.

For most one-night events, this is **fine**. The local-server route is for users who want:
- Privacy (no cloud audio upload)
- Better voice quality (Piper's neural voices)
- Offline capability (Whisper on a laptop with no internet)
- Custom Bengali / Hindi / Spanish voice models

---

## Troubleshooting

### Piper crashes with "model not found"
Check the `.onnx` file path. Piper also needs the matching `.json` config next to the `.onnx` (e.g. `en_US-amy-medium.onnx.json`). Download both from HuggingFace.

### Whisper returns empty text
Whisper requires 16kHz mono WAV. If you uploaded 48kHz stereo:
```powershell
# Convert with ffmpeg (install from https://ffmpeg.org)
ffmpeg -i input.wav -ar 16000 -ac 1 -c:a pcm_s16le output.wav
```

### Vosk says "Model not loaded"
The model folder must contain `AM`, `conf`, `graph`, `ivector`, `mfcc` subfolders. If you downloaded a `.zip`, extract it and use the inner folder path.

### The browser says "mic permission denied"
- Chrome: `chrome://settings/content/microphone` — allow `http://localhost:3000`.
- Edge: `edge://settings/content/microphone`.
- The page MUST be served over HTTPS or `http://localhost` — `http://192.168.x.x:3000` will not work without a tunnel.

### CORS errors
The voice server already has `CORSMiddleware` with `allow_origins=["*"]`. For production, restrict to your actual mission URL.

### The voice server is slow
Whisper on CPU runs at ~1-2x real-time (so 6s of audio takes 3-6s to transcribe). For real-time, switch to Vosk (instant) or use Whisper `tiny.en` (faster).

---

## Summary — what to install, in priority order

1. **Piper** (TTS) — best quality, free, ~5 min install. → [Section 2](#2-install-piper-tts)
2. **Whisper.cpp** (STT) — best accuracy, free, ~5 min install. → [Section 3](#3-install-whisper-stt)
3. The **local voice server** — copy the Python file, install pip deps. → [Section 6](#6-wire-it-up--a-tiny-local-voice-server)
4. Patch **use-voice.ts** to call the local server. → [Section 7](#7-switch-the-mission-to-use-it)

Total install time: ~20 minutes. Total cost: $0. Runs entirely on your Windows PC.
