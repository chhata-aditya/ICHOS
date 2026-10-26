# ICHOS Deployment Guide

This document describes the current production setup for ICHOS, how the pieces connect, and how to update them safely.

## Live services

| Part | Host | URL |
| --- | --- | --- |
| React app | Render Static Site (`ichos-player-web`) | <https://ichos-player-web.onrender.com> |
| React app | GitHub Pages | <https://chhata-aditya.github.io/ICHOS/> |
| Node API | Render Web Service (`ichos-api`) | <https://ichos-api.onrender.com> |
| API health | Node API | <https://ichos-api.onrender.com/api/health> |
| Gesture service | Render Web Service (`ichos-gesture`) | <https://ichos-gesture.onrender.com> |
| Gesture health | Gesture service | <https://ichos-gesture.onrender.com/health> |
| Source repository | GitHub | <https://github.com/chhata-aditya/ICHOS> |

The Render resources are defined together in the repository-root `render.yaml` Blueprint:

- **`ichos-player-web`** builds the Vite/React app from `client/` and publishes `client/dist/`.
- **`ichos-api`** runs the Express API from `server/`.
- **`ichos-gesture`** runs the FastAPI/WebSocket service from `gesture-service/` on Python 3.12.8.

## Request flow

1. A visitor loads the React app from the Render static site.
2. The app calls the Node API at `https://ichos-api.onrender.com/api`.
3. When the visitor turns on Gesture Control and grants camera permission, the browser sends webcam frames over `wss://ichos-gesture.onrender.com/ws`.
4. The gesture service recognizes hand movements and returns player commands over that same WebSocket.

The browser captures and sends the frames only while Gesture Control is on. The gesture service processes them in memory and does not save them. Its allowed-origin list is configured by `GESTURE_ALLOWED_ORIGINS` in `render.yaml`.

## Environment variables and secrets

The frontend receives these public service addresses at build time through the `ichos-player-web` Blueprint configuration:

- `VITE_API_URL=https://ichos-api.onrender.com/api`
- `VITE_GESTURE_WS_URL=wss://ichos-gesture.onrender.com/ws`

Set API credentials in **Render Dashboard → `ichos-api` → Environment**. Never put their values in GitHub, `render.yaml`, frontend variables, or this document.

- `OPENAI_API_KEY` — OpenAI access for vibe analysis.
- `YOUTUBE_API_KEY` — YouTube Data API access.

The service's health endpoint returns whether these variables are configured, but does not expose their values. If a key is ever pasted into chat, a screenshot, or a public repository, revoke it at its provider and replace it in Render.

## Deploying updates

### App code

Push changes to the `main` branch of the GitHub repository. The linked Render services build and deploy from that branch. The GitHub Actions workflow at `.github/workflows/deploy.yml` also builds the client and publishes a GitHub Pages artifact.

The React app is available from both Render and GitHub Pages. The repository's Pages source publishes the root of `main`, so the production bundle (`index.html`, `assets/`, `audio/`, `images/`, and `.nojekyll`) is committed at the repository root. `404.html` is a copy of the app shell for client-side routes. The GitHub Actions workflow also builds and deploys the `client/dist/` artifact. Vite uses `/ICHOS/` as its base path for GitHub Pages and `/` for the Render static site.

When changing client code, rebuild the Pages bundle with `GITHUB_ACTIONS=true`, copy the contents of `client/dist/` to the repository root, copy `client/dist/index.html` to root `404.html`, and push those generated files with the code change. Render builds its frontend from `client/` automatically.

### Blueprint or service configuration

After editing `render.yaml`, open the `ichos` Blueprint in Render and choose **Manual sync**. Review the proposed resource and environment changes, then approve the sync. Blueprint changes to existing services, such as allowed web origins, are applied during this sync and may trigger service redeploys.

## Local development

Use `start-all.bat` on Windows to start the app, API, and local gesture service together. The local client uses the Vite development server, the API uses its local development URL, and gestures connect to `ws://127.0.0.1:8000/ws`. Local webcam frames remain on the development machine unless the production WebSocket URL is explicitly configured.

For separate terminals, follow the local setup instructions in the root `README.md` and `gesture-service/README.md`.

## Operations and troubleshooting

- **First request is slow:** the free Render web services sleep after inactivity. The first API request or gesture connection can take a while to wake them. An always-on plan avoids this cold-start delay.
- **Gesture service unavailable:** check <https://ichos-gesture.onrender.com/health>, confirm the app is served over HTTPS, and make sure its origin appears in `GESTURE_ALLOWED_ORIGINS`.
- **API unavailable:** check <https://ichos-api.onrender.com/api/health>. Confirm Render shows `aiConfigured` or `youtubeConfigured` as needed, and verify the frontend/API origins are listed in `CLIENT_ORIGINS`.
- **Direct route returns 404:** the Render static-site Blueprint rewrites `/player`, `/search`, `/vibe`, and `/visualizer` to `index.html` so React Router can load the route.
- **Webcam permission:** camera permission is granted by each visitor in their browser. Gesture Control stays off until the visitor enables it.
