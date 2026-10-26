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

The React app connects to `ws://127.0.0.1:8000/ws` by default.
