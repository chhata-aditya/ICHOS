# ICHOS

An AI-powered multimodal adaptive music player — music for the moment.

## Project Status

ICHOS is a fully functional spatial audio ecosystem featuring AI natural-language vibe generation, contactless camera gesture controls, synchronized karaoke lyrics, and a 60 FPS WebGL audio-reactive cinema visualizer.

## Project structure

```text
ichos/
├── client/          # Vite + React 19 frontend & WebGL shaders
├── server/          # Express NLP & orchestration backend
├── gesture-service/ # Python/MediaPipe local webcam gesture WebSocket service
├── README.md
└── .gitignore
```

## Run the ecosystem

To experience the full system, you need to run all three services concurrently.

### 1. Run the frontend client

```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. Run the backend API

In a second terminal:

```bash
cd server
npm install
npm run dev
```

The app works in a fallback mode without keys, but for real AI capabilities, copy `server/.env.example` to `server/.env` and set your `OPENAI_API_KEY`.

### 3. Run the gesture vision service

Use a standard Python 3.10+ installation:

```bash
cd gesture-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```
*Alternatively on Windows, simply double-click `start-ichos-gesture.bat`.*

On the Player page, toggle **Camera Gestures** to control playback using 2-finger horizontal flicks.

## Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [UI/UX Review](UI_UX_REVIEW.md)
- [System Documentation](ICHOS_DOCUMENTATION.md)
