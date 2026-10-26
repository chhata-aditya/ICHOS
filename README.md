# ICHOS

An AI-powered multimodal adaptive music player — music for the moment.

## Phase 1 status

React foundation with a local-audio demo player and text/image Vibe Profile analysis. Music-provider integration, licensed lyrics, and gesture control are still pending.

## Project structure

```text
ichos/
├── client/     # Vite + React frontend
├── server/     # Express NLP / image-analysis API
├── gesture-service/ # Webcam gesture-recognition WebSocket service (local + Render)
├── README.md
└── .gitignore
```

## Run the client

```bash
cd client
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Run the vibe-analysis API

In a second terminal:

```bash
cd server
npm install
npm run dev
```

The app works in a labelled development-fallback mode with no API key. For real NLP and image analysis, copy `server/.env.example` to `server/.env`, then set `OPENAI_API_KEY`. Keep this key private: it is used only by the server and never by React.

## Run gesture control

Use a standard CPython 3.11 or 3.12 installation, then:

```bash
cd gesture-service
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```

On the Player page, switch **Gesture Control** on and allow camera permission. The camera stream closes immediately when the switch turns off. The hosted GitHub Pages client connects to the `ichos-gesture` Render service using secure WebSockets. The service processes webcam frames in memory and does not save them. Render's free instance may sleep while idle, delaying the first connection; an always-on plan gives more consistent real-time response.

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/search` | Search |
| `/vibe` | Vibe |
| `/player` | Player |


