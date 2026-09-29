# 🏛️ ICHOS Architecture Overview

ICHOS is an advanced multimodal music player designed to interpret natural language and physical gestures, translating them into dynamic, real-time spatial audio experiences.

## System Components

### 1. Frontend (`client/`)
- **Tech Stack**: React 19, Vite, Three.js, CSS Modules.
- **Role**: Serves as the interactive user interface and WebGL rendering engine.
- **Key Features**:
  - `PlayerContext.jsx`: Global state manager for audio playback and queues.
  - `YouTubePlayer.jsx`: Persistent background audio engine that prevents audio dropout during navigation.
  - `ShaderAnimation.jsx`: 60 FPS WebGL audio-reactive visualizer.
  - `Search.jsx` & `Vibe.jsx`: Interfaces for real-time discovery and prompt-based queue generation.

### 2. Backend (`server/`)
- **Tech Stack**: Node.js, Express, OpenAI SDK.
- **Role**: Orchestrates intent extraction and content sourcing.
- **Key Features**:
  - `vibeService.js`: Uses OpenAI to extract structured intents (mood, genre, energy) from natural language prompts.
  - `youtubeService.js`: Real-time scraping and API querying of YouTube's video catalog to bypass traditional music licensing constraints.
  - `lyricsService.js`: Fetches and parses `.lrc` timestamped lyrics from LRCLIB.
  - `rankingService.js`: Deduplicates and scores potential tracks against the extracted user intent.

### 3. Gesture Vision Service (`gesture-service/`)
- **Tech Stack**: Python 3.10+, FastAPI, OpenCV, MediaPipe.
- **Role**: Translates physical user movements into system commands.
- **Key Features**:
  - Processes 30 FPS webcam feeds to extract 21 3D hand landmarks.
  - Emits real-time WebSocket events (e.g., `PLAY_PAUSE`, `NEXT`, `PREVIOUS`) based on specific velocity and landmark heuristics (e.g., 2-finger horizontal flicks).

## Communication Flow
1. **Client to Backend**: RESTful HTTP requests for music generation, searching, and lyrics.
2. **Client to Gesture Service**: WebSocket connection (`ws://localhost:8000/ws/gestures`) for zero-latency physical controls.
3. **Backend to External APIs**: HTTPS requests to OpenAI, YouTube, and LRCLIB.

## Technical Debt & Areas for Improvement
- **Validation**: The Express backend lacks strict payload validation middleware (e.g., Zod).
- **Testing**: Zero automated test coverage across all three services.
- **Persistence**: User histories, generated vibes, and custom queues are lost upon page reload due to the stateless architecture.
- **Security**: The backend requires `helmet`, strict CORS, and rate-limiting.
- **Deployment**: The system currently runs as three isolated local processes; containerization (Docker) is required for reliable deployment.
