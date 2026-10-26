import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft, Radio, Disc3, Mic2 } from 'lucide-react';
import usePlayer from '../../hooks/usePlayer';
import { formatTime } from '../../context/PlayerContext';
import { fetchTrackLyrics } from '../../services/musicApi';
import ShaderAnimation from './shader-animation';
import './music-reactive-hero-section.css';

export const MusicReactiveHeroSection = ({
  bassIntensity = 1,
  midIntensity = 1,
  trebleIntensity = 1,
} = {}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
  } = usePlayer();

  const [fps, setFps] = useState(60);
  const [lyricsData, setLyricsData] = useState({ lines: [] });
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack) return;
    let isMounted = true;
    fetchTrackLyrics(currentTrack.title, currentTrack.artist, duration)
      .then((data) => {
        if (isMounted) setLyricsData(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentTrack?.title, currentTrack?.artist]);

  // FPS tracking loop
  useEffect(() => {
    let animId;
    const trackFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      animId = requestAnimationFrame(trackFps);
    };
    animId = requestAnimationFrame(trackFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Active lyric line calculation
  const activeLyric = useMemo(() => {
    if (!lyricsData.lines || lyricsData.lines.length === 0) return null;
    let current = null;
    for (const line of lyricsData.lines) {
      if (currentTime >= line.time) {
        current = line;
      } else {
        break;
      }
    }
    return current;
  }, [lyricsData.lines, currentTime]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekClick = (event) => {
    if (duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  return (
    <div className="music-reactive-hero">
      {/* 60 FPS WebGL Audio Reactive Shader Background */}
      <ShaderAnimation
        bassMultiplier={bassIntensity}
        midMultiplier={midIntensity}
        trebleMultiplier={trebleIntensity}
      />

      {/* Ambient Artwork Glow */}
      <div
        className={`hero-artwork-backdrop${isPlaying ? ' is-playing' : ''}`}
        style={{ backgroundImage: `url(${currentTrack?.artwork || currentTrack?.thumbnail})` }}
      />

      {/* Top Bar Navigation */}
      <header className="hero-top-nav">
        <Link to="/player" className="hero-nav-btn">
          <ArrowLeft size={16} /> Back to Theater Player
        </Link>
        <div className="hero-engine-badge">
          <Radio size={13} className={isPlaying ? 'spin-slow' : ''} />
          <span>ICHOS 60 FPS Spatial Shader Cinema</span>
        </div>
      </header>

      {/* Centerpiece Hero */}
      <main className="hero-content">
        <img
          src={currentTrack?.artwork || currentTrack?.thumbnail}
          alt=""
          className={`hero-album-art${isPlaying ? ' is-playing' : ''}`}
        />
        <p className="hero-tagline">Spatial Audio Waveform Experience</p>
        <h1 className="hero-title">{currentTrack?.title || 'Nothing Playing'}</h1>
        <p className="hero-subtitle">{currentTrack?.artist || currentTrack?.channelTitle || 'Unknown Artist'}</p>
        <p className="hero-credit">{currentTrack?.album ? `Album · ${currentTrack.album}` : 'Spatial Stream'}</p>

        {/* Transport Controls */}
        <div className="hero-controls">
          <button
            type="button"
            className="hero-btn"
            onClick={previousTrack}
            aria-label="Previous Track"
            title="Previous"
          >
            <SkipBack size={20} />
          </button>

          <button
            type="button"
            className="hero-play-btn"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>

          <button
            type="button"
            className="hero-btn"
            onClick={nextTrack}
            aria-label="Next Track"
            title="Next"
          >
            <SkipForward size={20} />
          </button>
        </div>
      </main>

      {/* Synchronized Floating Lyric Subtitle & Scrubber */}
      <div>
        {activeLyric && activeLyric.text ? (
          <div className="hero-floating-lyric" key={activeLyric.time}>
            <p className="hero-lyric-text">
              <Mic2 size={13} className="inline-icon" /> {activeLyric.text}
            </p>
          </div>
        ) : null}

        <div className="audio-progress-wrap">
          <span className="audio-progress-time">{formatTime(currentTime)}</span>
          <div
            className="audio-progress"
            onClick={handleSeekClick}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="audio-progress-time">{formatTime(duration)}</span>
        </div>

        <footer className="hero-bottom-bar">
          <div className="bottom-info">
            <div className="artist-avatar">
              <Disc3 size={16} className={isPlaying ? 'spin-slow' : ''} />
            </div>
            <div>
              <span className="artist-name">{currentTrack?.artist || 'ICHOS'}</span>
              <span className="social-handle"> · 48kHz Hi-Fi Audio</span>
            </div>
          </div>

          <div className="corner-info">
            <span className="fps-counter">FPS: {fps}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MusicReactiveHeroSection;
