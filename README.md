# ICHOS

**An AI-powered multimodal adaptive music player — music for the moment.**

## Live links

- **[Open ICHOS on GitHub Pages](https://chhata-aditya.github.io/ICHOS/)** — static frontend
- **[Open the player directly](https://chhata-aditya.github.io/ICHOS/player)**
- **[Open ICHOS on Render](https://ichos-player-web.onrender.com/)** — alternate frontend hosting
- [Node API health](https://ichos-api.onrender.com/api/health) · [Gesture service health](https://ichos-gesture.onrender.com/health)
- [GitHub repository](https://github.com/chhata-aditya/ICHOS) · [Deployment guide](DEPLOYMENT.md)

> The frontend is hosted on GitHub Pages and Render. The API and real-time gesture service run on Render. Free Render services can sleep when idle, so the first API request or gesture connection may take longer while a service wakes.

## What is ICHOS?

ICHOS is a music player prototype that brings together local audio playback, mood and image based vibe analysis, music discovery, lyrics support, and optional webcam gesture controls. Its frontend is a React single-page app. Supporting services provide vibe analysis and music-related API routes, plus a separate WebSocket service for hand gesture recognition.

The project is under active development. Some capabilities depend on configured provider credentials, and music-provider integration and licensed lyrics availability may be limited by provider access and rights.

## Features

- Browse the Home, Search, Vibe, Player, and Visualizer experiences.
- Play the included demo tracks and manage playback and queue state.
- Describe a mood or upload an image for vibe analysis through the API.
- Search and retrieve music-related data through the Node API and YouTube Data API configuration.
- Optionally enable webcam-based gesture controls. The browser asks for camera permission; frames are sent to the gesture service only while the control is enabled.
- View the app on GitHub Pages or Render.

## Project layout

```text
ICHOS/
├── client/                  # Vite + React single-page app
│   ├── public/audio/        # Demo audio bundled with the frontend
│   ├── public/images/       # Demo artwork
│   └── src/                 # Pages, components, player state, API clients
├── server/                  # Express API: vibe analysis and music routes
├── gesture-service/         # FastAPI WebSocket hand gesture service
├── .github/workflows/       # GitHub Pages build and deploy workflow
├── render.yaml              # Render Blueprint for the three hosted services
├── start-all.bat            # Starts local frontend, API, and gesture service
├── DEPLOYMENT.md            # Hosting and deployment operations
└── README.md
```

## Technology

- **Frontend:** React, React Router, Vite, Three.js, Lucide
- **API:** Node.js, Express, OpenAI client, YouTube Data API integration
- **Gesture service:** Python, FastAPI, WebSockets, MediaPipe-based hand detection
- **Hosting:** GitHub Pages for the static frontend; Render for the frontend, Node API, and gesture service

## Run locally

### Prerequisites

- Node.js 20 or later and npm
- Python 3.11 or 3.12 for gesture control
- A modern browser; camera access requires permission and a secure context (localhost is permitted for local development)

### Start all services on Windows

From the repository root, double-click `start-all.bat` or run it from a terminal. It opens the frontend, API, and gesture service in separate windows. Install each service's dependencies first if this is the first run.

### Start the frontend

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, typically <http://localhost:5173>.

### Start the API

In another terminal:

```bash
cd server
npm install
npm run dev
```

The API's local development URL and route prefix are defined by `server/server.js`. The client uses its local development configuration unless a `VITE_API_URL` is supplied.

### Configure API keys locally

Copy `server/.env.example` to `server/.env` and fill in the values needed for provider-backed functionality:

```dotenv
OPENAI_API_KEY=your-openai-key
YOUTUBE_API_KEY=your-youtube-data-api-key
```

Keep `server/.env` private. It is ignored by Git; never put real keys in frontend variables, source files, README text, screenshots, or commits. The app can use its development fallback when provider credentials are absent, but provider-backed analysis and lookup will not be available.

### Start the gesture service

In another terminal (Windows PowerShell):

```powershell
cd gesture-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```

If PowerShell blocks activation, use Command Prompt and run `.venv\Scripts\activate.bat` instead. The local browser connects to `ws://127.0.0.1:8000/ws`. In the Player page, turn on **Gesture Control** and approve camera access. Turning the control off stops capture and sending.

### Useful development commands

```bash
# Frontend production build
cd client
npm run build

# Frontend lint
npm run lint

# API production start
cd server
npm start
```

## How the hosted app is wired

```text
Browser
  ├── GitHub Pages or Render static frontend
  ├── HTTPS requests ──> https://ichos-api.onrender.com/api
  └── Secure WebSocket ──> wss://ichos-gesture.onrender.com/ws
```

The Render Blueprint in `render.yaml` defines three resources:

| Service | Runtime | Purpose |
| --- | --- | --- |
| `ichos-player-web` | Static site | Builds `client/` and publishes Vite's `dist/` output |
| `ichos-api` | Node | Express API for vibe and music routes |
| `ichos-gesture` | Python | FastAPI health endpoint and real-time gesture WebSocket |

Render frontend build settings provide `VITE_API_URL=https://ichos-api.onrender.com/api` and `VITE_GESTURE_WS_URL=wss://ichos-gesture.onrender.com/ws`. GitHub Pages uses the `/ICHOS/` project-site base path; Render serves the app from `/`.

## Environment variables

| Variable | Where it belongs | What it does |
| --- | --- | --- |
| `OPENAI_API_KEY` | Node API environment | Enables OpenAI-backed vibe analysis |
| `YOUTUBE_API_KEY` | Node API environment | Enables YouTube Data API requests |
| `CLIENT_ORIGIN` / `CLIENT_ORIGINS` | Node API environment | Controls allowed browser origins for API requests |
| `GESTURE_ALLOWED_ORIGINS` | Gesture service environment | Restricts accepted browser origins for gesture WebSockets |
| `VITE_API_URL` | Frontend build environment | Sets the API base URL at build time |
| `VITE_GESTURE_WS_URL` | Frontend build environment | Sets the gesture WebSocket URL at build time |

For production, set provider secrets in **Render Dashboard → `ichos-api` → Environment**. The frontend variables contain public service addresses only; do not place provider secrets in any `VITE_` variable, because frontend values are shipped to every visitor. The repository's health endpoint can report whether credentials are configured without showing their contents.

## Routes

| Route | Experience |
| --- | --- |
| `/` | Home |
| `/search` | Search |
| `/vibe` | Vibe profile and analysis |
| `/player` | Music player and optional gesture controls |
| `/visualizer` | Reactive visualizer |

The GitHub Pages workflow builds the client and publishes it to Pages. It also creates a `404.html` app-shell fallback so direct visits to client-side routes can load the React app. Render uses rewrite rules from `render.yaml` for the same routes.

## Deploying changes

1. Commit and push changes to `main` in [the GitHub repository](https://github.com/chhata-aditya/ICHOS).
2. GitHub Actions builds and publishes the frontend to GitHub Pages.
3. Render detects the repository update and deploys the configured frontend and backend services.
4. If `render.yaml` changes, sync the ICHOS Blueprint in the Render dashboard and review the proposed changes.

The workflow is in `.github/workflows/deploy.yml`; Render service settings are in `render.yaml`. More detailed hosting notes and troubleshooting are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Privacy and service availability

- Camera access is optional and controlled by the visitor in the browser.
- The frontend sends webcam frames only while Gesture Control is enabled. The gesture service processes frames in memory and does not save them.
- Use the app over HTTPS for camera access outside localhost.
- Render free services may sleep while idle. This can cause a cold start on the first API request or gesture connection and can affect real-time responsiveness until the service is awake.

## Troubleshooting

- **GitHub Pages does not load:** check the latest `Deploy Client to GitHub Pages` run in the repository's Actions tab and confirm Pages is enabled for the repository.
- **A direct Pages route does not open:** return to the app root and navigate in-app, or check that the latest Pages workflow completed and deployed the `404.html` fallback.
- **Vibe analysis or music lookup is unavailable:** check [API health](https://ichos-api.onrender.com/api/health), confirm the required key is configured on the Render API service, and inspect that service's logs.
- **Gesture controls do not connect:** check [gesture health](https://ichos-gesture.onrender.com/health), allow camera access, use HTTPS, enable Gesture Control, and allow the service time to wake if it was idle.
- **The first request is slow:** this is usually a Render cold start on the free plan. Retry after the service finishes starting.
- **A key was exposed:** revoke it with its provider and replace it in the Render environment. Do not commit the replacement.

## Further reading

- [Deployment guide](DEPLOYMENT.md)
- [Gesture service setup](gesture-service/README.md)
- [GitHub Actions workflow](.github/workflows/deploy.yml)
- [Render Blueprint](render.yaml)
