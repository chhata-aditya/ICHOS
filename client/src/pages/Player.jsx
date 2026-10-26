import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  ListMusic,
  Radio,
  Hand,
  Disc3,
  Activity,
  Mic2,
  Loader2,
} from 'lucide-react';
import usePlayer from '../hooks/usePlayer';
import GestureToggle from '../components/GestureToggle';
import { mockTracks } from '../data/mockTracks';
import { fetchTrackLyrics } from '../services/musicApi';
import './Player.css';

function formatTime(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function Player() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeat,
    shuffle,
    gestureMode,
    likedTrackIds,
    queue,

    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleGestureMode,
    toggleLikeCurrentTrack,
    toggleShuffle,
    cycleRepeat,
    playTrack,
  } = usePlayer();

  const [prevVolume, setPrevVolume] = useState(1);
  const [activeTab, setActiveTab] = useState('queue');
  const [lyricsData, setLyricsData] = useState({ lines: [], isSynced: false, loading: false });
  const activeLineRef = useRef(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack) return;

    let isMounted = true;
    setLyricsData((prev) => ({ ...prev, loading: true }));

    fetchTrackLyrics(currentTrack.title, currentTrack.artist, duration)
      .then((data) => {
        if (!isMounted) return;
        setLyricsData({
          lines: data.lines || [],
          isSynced: Boolean(data.isSynced),
          loading: false,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setLyricsData({
          lines: [],
          isSynced: false,
          loading: false,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.title, currentTrack?.artist]);

  // Compute active lyric line
  const currentLineIndex = useMemo(() => {
    if (!lyricsData.lines || lyricsData.lines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (currentTime >= lyricsData.lines[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyricsData.lines, currentTime]);

  // Auto-scroll active lyric line in lyrics tab
  useEffect(() => {
    if (activeTab === 'lyrics' && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLineIndex, activeTab]);

  const handleToggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.7);
    }
  };

  if (!currentTrack) {
    return (
      <section className="player-page player-empty">
        <Disc3 size={48} className="player-empty__icon" />
        <h1>Nothing playing yet</h1>
        <p className="player-empty__subtitle">Select a track from the library or search to begin.</p>
      </section>
    );
  }

  const displayQueue = queue && queue.length > 0 ? queue : mockTracks;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const currentIndex = Math.max(0, displayQueue.findIndex((track) => track.id === currentTrack.id || track.videoId === currentTrack.videoId));
  const isLiked = likedTrackIds.includes(currentTrack.id);

  return (
    <section className="player-page">
      <div className="player-content">
        {/* Top Header */}
        <header className="player-header">
          <div className="player-badge">
            <Radio size={14} className={isPlaying ? 'pulse-icon' : ''} />
            <span>ICHOS Hi-Fi Engine</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/visualizer" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
              <Activity size={14} className={isPlaying ? 'spin-slow' : ''} />
              <span>Cinema Visualizer</span>
            </Link>
            <p className="player-context">Adaptive Spatial Audio · 48kHz / 24-bit</p>
          </div>
        </header>

        {/* Main 2-Column Luxury Player Card */}
        <section className="player-main glass-card" aria-label="Now playing">
          {/* Left Column: Music Video / Artwork Frame (plays directly above album name) */}
          <div className="player-artwork-wrap">
            <div
              className={`player-artwork-glow${isPlaying ? ' is-active' : ''}`}
              style={{ backgroundImage: `url(${currentTrack.artwork || currentTrack.thumbnail})` }}
            />
            <div className={`player-artwork-frame${isPlaying ? ' is-playing' : ''}`}>
              <img
                className="player-artwork"
                src={currentTrack.artwork || currentTrack.thumbnail}
                alt={`${currentTrack.title} artwork`}
              />
              <div className="player-artwork-sheen" />
            </div>
          </div>

          {/* Right Column: Track Details & Transport Controls */}
          <div className="player-details">
            <div className="player-meta-top">
              <span className="player-kicker">
                NOW PLAYING · {currentIndex + 1} OF {displayQueue.length}
              </span>
              <div className={`player-equalizer${isPlaying ? ' is-playing' : ''}`} aria-hidden="true">
                <span /><span /><span /><span /><span />
              </div>
            </div>

            <div className="player-title-row">
              <div className="player-titles">
                <h1 title={currentTrack.title}>{currentTrack.title}</h1>
                <p className="player-artist">{currentTrack.artist || currentTrack.channelTitle}</p>
                <p className="player-album">{currentTrack.album || 'Spatial Master'}</p>
              </div>
              <button
                className={`like-button${isLiked ? ' is-liked' : ''}`}
                type="button"
                onClick={toggleLikeCurrentTrack}
                aria-label={isLiked ? 'Unlike track' : 'Like track'}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Scrubber & Progress Bar */}
            <div className="progress-section">
              <div className="progress-times">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                className="player-progress"
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(event) => seek(Number(event.target.value))}
                style={{ '--progress': `${progress}%` }}
                aria-label="Song progress"
              />
            </div>

            {/* Main Controls */}
            <div className="main-controls">
              <button
                className={`control-btn${shuffle ? ' is-active' : ''}`}
                type="button"
                onClick={toggleShuffle}
                aria-label="Shuffle"
                title="Shuffle"
              >
                <Shuffle size={18} />
              </button>

              <button
                className="control-btn control-btn--nav"
                type="button"
                onClick={previousTrack}
                aria-label="Previous Track"
                title="Previous"
              >
                <SkipBack size={22} />
              </button>

              <button
                className="play-button"
                type="button"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="play-icon-offset" />
                )}
              </button>

              <button
                className="control-btn control-btn--nav"
                type="button"
                onClick={nextTrack}
                aria-label="Next Track"
                title="Next"
              >
                <SkipForward size={22} />
              </button>

              <button
                className={`control-btn${repeat !== 'off' ? ' is-active' : ''}`}
                type="button"
                onClick={cycleRepeat}
                aria-label={`Repeat mode: ${repeat}`}
                title={`Repeat: ${repeat}`}
              >
                {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </div>

            {/* Secondary Controls (Volume & Gesture Hint) */}
            <div className="secondary-controls">
              <div className="volume-control">
                <button
                  type="button"
                  className="volume-icon-btn"
                  onClick={handleToggleMute}
                  aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                >
                  {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
                <input
                  className="volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) => setVolume(event.target.value)}
                  style={{ '--progress': `${volume * 100}%` }}
                  aria-label="Volume slider"
                />
              </div>

              <div className="gesture-hint-badge">
                <Hand size={13} className="gesture-hint-icon" />
                <span>Flick right: <strong>Next</strong> · Flick left: <strong>Prev</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* Ambient Vibe Deck */}
        <section className="player-section glass-card">
          <div className="section-header">
            <Sparkles size={16} className="section-header-icon" />
            <h2>VIBE & ATMOSPHERE</h2>
          </div>
          <p className="player-message">
            Audio synthesized with dynamic spatial reverberation. Move freely using touch, keyboard, or contactless camera gestures.
          </p>
        </section>

        {/* Dual Tab Deck: Track Queue & Synchronized Lyrics */}
        <section className="player-section glass-card">
          <div className="player-tab-bar">
            <button
              type="button"
              className={`player-tab-btn${activeTab === 'queue' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('queue')}
            >
              <ListMusic size={16} />
              <span>Track Queue ({displayQueue.length})</span>
            </button>
            <button
              type="button"
              className={`player-tab-btn${activeTab === 'lyrics' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('lyrics')}
            >
              <Mic2 size={16} />
              <span>Synchronized Lyrics {lyricsData.isSynced ? '✦' : ''}</span>
            </button>
          </div>

          {activeTab === 'queue' ? (
            <div className="track-queue">
              {displayQueue.map((track, index) => {
                const isCurrent = track.id === currentTrack.id || track.videoId === currentTrack.videoId;
                return (
                  <button
                    key={track.id || track.videoId || index}
                    className={`queue-track${isCurrent ? ' is-current' : ''}`}
                    type="button"
                    onClick={() => playTrack(track)}
                  >
                    <span className="queue-track__index">
                      {isCurrent && isPlaying ? (
                        <div className="queue-equalizer">
                          <span /><span /><span />
                        </div>
                      ) : (
                        String(index + 1).padStart(2, '0')
                      )}
                    </span>
                    <img
                      src={track.artwork || track.thumbnail}
                      alt=""
                      className="queue-track__thumb"
                      width={40}
                      height={40}
                    />
                    <div className="queue-track__details">
                      <strong>{track.title}</strong>
                      <small>{track.artist || track.channelTitle} {track.album ? `· ${track.album}` : ''}</small>
                    </div>
                    <span className="queue-track__status">
                      {isCurrent ? (isPlaying ? 'Playing' : 'Paused') : 'Play'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="lyrics-panel">
              {lyricsData.loading ? (
                <div className="lyrics-loading">
                  <Loader2 size={24} className="spin-slow" />
                  <span>Loading lyrics for {currentTrack.title}...</span>
                </div>
              ) : lyricsData.lines && lyricsData.lines.length > 0 ? (
                <div className="lyrics-container">
                  {lyricsData.lines.map((line, idx) => {
                    const isActive = idx === currentLineIndex;
                    return (
                      <button
                        key={`${line.time}-${idx}`}
                        ref={isActive ? activeLineRef : null}
                        type="button"
                        className={`lyric-line${isActive ? ' is-active' : ''}`}
                        onClick={() => {
                          if (line.time > 0) seek(line.time);
                        }}
                      >
                        {line.text}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="lyrics-empty">
                  <Disc3 size={32} className="spin-slow" />
                  <p>Instrumental track or lyrics unavailable.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Camera Gesture Controls */}
        <section className="gesture-section glass-card">
          <div className="section-header">
            <Hand size={16} className="section-header-icon" />
            <h2>CAMERA GESTURE CONTROLS</h2>
          </div>
          <GestureToggle />
        </section>
      </div>
    </section>
  );
}

export default Player;
