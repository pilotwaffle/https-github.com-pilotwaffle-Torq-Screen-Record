<div align="center">
<img width="1200" height="475" alt="Kite Screen Recorder" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Kite Screen Recorder

A browser-based screen recorder and demo video stylizer, powered by Google Gemini.

Record your screen, drop the footage onto a polished Studio Canvas with realistic device mockups and gradient backgrounds, and enrich your demo with AI-generated video clips, voice-overs, and background music — all in a single web app.

View your app in AI Studio: https://ai.studio/apps/2775f8cd-fbc4-4c91-9873-594b4ae36f0b

---

## Features

### Screen Recording
- High-quality screen capture via the browser `getDisplayMedia` API (VP8 + Opus, with graceful fallback).
- Optional system / microphone audio capture.
- Detects the browser's native "Stop sharing" button and ends the recording cleanly.
- One-click WebM download of the raw recording.
- Friendly error messages for blocked embed contexts and permission denials.

### Demo Video Stylizer (Studio Canvas)
- **Device mockups:** macOS, Windows, generic browser, glass, Surface Pro, Surface Studio (and `none`).
- **Backgrounds:** transparent, three curated gradients, solid dark, solid light.
- **Adjustable padding** around the recording.
- **Effects toggles:** drop shadow, tilt, lens blur, auto-zoom.

### AI Features (server-side Gemini)
- **Animate Images / Text-to-Video** — `veo-3.1-lite-generate-preview` at 720p, 16:9. Accepts a text prompt and/or a starting image.
- **Voice-overs (Text-to-Speech)** — `gemini-3.1-flash-tts-preview` with selectable prebuilt voices (default `Kore`).
- **Background Music (Text-to-Audio)** — `lyria-3-clip-preview`, streamed and concatenated server-side.
- All Gemini calls are proxied through the Express server so your `GEMINI_API_KEY` never reaches the browser.

### Timeline
- A dedicated timeline panel under the Studio Canvas surfaces recorded clips and generated audio/voice assets for review.

---

## Tech Stack

- **Frontend:** React + TypeScript, Vite, Tailwind-style utility classes, `lucide-react` icons.
- **Backend:** Node.js + Express (`server.ts`), Vite middleware in dev, static SPA in production.
- **AI:** `@google/genai` SDK (Veo, Gemini TTS, Lyria).
- **Browser APIs:** `getDisplayMedia`, `MediaRecorder`, `URL.createObjectURL`.

---

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` and set your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
   See [`.env.example`](.env.example) for the full list of supported variables.
3. Start the dev server (Express + Vite middleware):
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000.

> **Tip:** Screen recording is blocked inside some embedded preview iframes. If you see a permissions-policy error, click **Share → Open App in New Tab** or run the app locally.

---

## Production Build

```bash
npm run build
NODE_ENV=production npm start
```

The Express server serves the built SPA from `dist/` and exposes the `/api/*` routes.

---

## API Routes

All routes are POST and consume JSON bodies.

| Route | Purpose | Model |
|---|---|---|
| `/api/generate-video` | Start a Veo video generation (text and/or image input). Returns an `operationName`. | `veo-3.1-lite-generate-preview` |
| `/api/video-status` | Poll a video operation. Returns `{ done: boolean }`. | — |
| `/api/video-download` | Stream the finished MP4 back to the client. | — |
| `/api/generate-speech` | Generate a TTS clip from `text` (+ optional `voice`). Returns base64 audio. | `gemini-3.1-flash-tts-preview` |
| `/api/generate-music` | Generate a music clip from a prompt. Returns base64 audio + mimeType. | `lyria-3-clip-preview` |

---

## Project Structure

```
src/
  App.tsx                  # Top-level state, recording lifecycle, modal orchestration
  components/
    Sidebar.tsx            # Mockup, background, effects controls + AI launchers
    Canvas.tsx             # Studio Canvas preview and timeline
    AIVideoModal.tsx       # Veo text/image-to-video UI
    AIAudioModal.tsx       # Gemini TTS voice-over UI
    AIMusicModal.tsx       # Lyria music generation UI
  types.ts                 # EditorState, MockupType, BackgroundType, Scene
  utils.ts
  index.css
  main.tsx
server.ts                  # Express + Vite + Gemini API proxy
metadata.json              # AI Studio app metadata & permissions
```

---

## Permissions

Declared in `metadata.json`:

- `display-capture` — required for screen recording.
- `microphone` — narration capture during recording.
- `camera` — reserved for a future webcam-overlay feature.

---

## License

Unlicensed / internal preview project. See the AI Studio app link above for the live version.
