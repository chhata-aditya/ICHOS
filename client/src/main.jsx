import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext.jsx';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Player from './pages/Player.jsx';
import Vibe from './pages/Vibe.jsx';
import ReactiveVisualizer from './pages/ReactiveVisualizer.jsx';
import './index.css';

const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <PlayerProvider>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="vibe" element={<Vibe />} />
            <Route path="player" element={<Player />} />
          </Route>
          <Route path="/visualizer" element={<ReactiveVisualizer />} />
        </Routes>
      </PlayerProvider>
    </BrowserRouter>
  </StrictMode>
);
