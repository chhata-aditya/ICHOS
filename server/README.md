# ICHOS Backend Service

The Node.js/Express backend orchestration layer for the ICHOS ecosystem.

## Overview
This service acts as the central intelligence hub, bridging the frontend React application with external AI and music data providers. It is entirely stateless, keeping the architecture lightweight and highly scalable.

## Core Services

- **Vibe Service** (`services/vibeService.js`): Integrates with OpenAI (`gpt-4o-mini`) using strict JSON schemas to interpret natural language and images, mapping them to musical archetypes.
- **YouTube Service** (`services/youtubeService.js`): A hybrid search engine that utilizes both the official Google API (if configured) and a fallback live HTML scraper to source high-quality audio tracks in real-time.
- **Lyrics Service** (`services/lyricsService.js`): Connects to the open-source LRCLIB database to fetch time-synced `.lrc` lyrics for karaoke functionalities.
- **Ranking Service** (`services/rankingService.js`): A heuristic scoring engine that filters and deduplicates tracks before returning them to the client queue.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Environment Configuration:
   Copy `.env.example` to `.env` and provide your keys:
   ```env
   OPENAI_API_KEY=your_key_here
   YOUTUBE_API_KEY=your_key_here # Optional
   PORT=5000
   CLIENT_ORIGIN=http://localhost:5173
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`.
