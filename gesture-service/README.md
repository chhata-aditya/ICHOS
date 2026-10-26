# ICHOS Gesture Service

The service receives temporary webcam frames from the local React app over a WebSocket. It does not save frames.

## Setup

Use a standard CPython 3.11 or 3.12 installation, then:

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```

For local development, the React app connects to `ws://127.0.0.1:8000/ws`. The production frontend uses `wss://ichos-gesture.onrender.com/ws` unless `VITE_GESTURE_WS_URL` overrides it.

The Render Blueprint in the repository deploys this service as `ichos-gesture`. It accepts browser WebSocket connections only from the GitHub Pages site and the local Vite development origins. Render's free instance can sleep while idle, so the first connection can take a while to wake; an always-on plan is better for consistent real-time control. Webcam frames are processed in memory and are not saved by this service.
