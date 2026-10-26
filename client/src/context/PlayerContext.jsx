import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  mockTracks,
  mockNowPlaying,
} from '../data/mockTracks';
import YouTubePlayer from '../components/YouTubePlayer';

const PlayerContext = createContext(null);

/* ==================================================
   TIME HELPERS
================================================== */

export function parseDuration(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return Math.max(0, duration);
  }

  if (!duration || typeof duration !== 'string') {
    return 0;
  }

  const parts = duration.split(':').map(Number);

  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function normalizeTrack(track, fallbackId = 0) {
  if (!track) return null;
  const isYouTube = Boolean(track.videoId);
  const id = track.id || track.videoId || `track-${fallbackId}`;
  const title = track.title || 'Untitled Track';
  const artist = track.artist || track.channelTitle || 'Unknown Artist';
  const artwork = track.thumbnail || track.artwork || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80';

  return {
    ...track,
    id,
    videoId: track.videoId || null,
    title,
    artist,
    album: track.album || track.channelTitle || '',
    artwork,
    thumbnail: artwork,
    url: track.url || (isYouTube ? `https://www.youtube.com/watch?v=${track.videoId}` : ''),
    duration: typeof track.duration === 'number' ? track.duration : parseDuration(track.duration),
    audioUrl: track.audioUrl || null,
    type: isYouTube ? 'youtube' : 'local',
  };
}

/* ==================================================
   PLAYER PROVIDER
================================================== */

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const nextTrackRef = useRef(() => {});
  const gestureActionsRef = useRef(null);

  /* ==================================================
     PLAYER STATE
  ================================================== */

  const initialTrack = useMemo(() => normalizeTrack(mockNowPlaying), []);
  const [currentTrack, setCurrentTrack] = useState(initialTrack);
  const [queue, setQueue] = useState(mockTracks.map(normalizeTrack));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(parseDuration(mockNowPlaying.duration));
  const [volume, setVolumeState] = useState(0.8);
  const [repeat, setRepeat] = useState('off');
  const [shuffle, setShuffle] = useState(false);
  const [gestureMode, setGestureMode] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState([]);
  const [history, setHistory] = useState([]);
  const [seekTarget, setSeekTarget] = useState(null);

  /* ==================================================
     QUEUE MANAGEMENT
  ================================================== */

  const setQueueAndPlay = useCallback((newTracks, startIndex = 0) => {
    if (!Array.isArray(newTracks) || newTracks.length === 0) return;

    const normalized = newTracks.map(normalizeTrack);
    const startIdx = Math.max(0, Math.min(startIndex, normalized.length - 1));
    const firstTrack = normalized[startIdx];

    setQueue(normalized);
    setCurrentTrack(firstTrack);
    setCurrentTime(0);
    setDuration(firstTrack.duration || 0);
    setIsPlaying(true);
  }, []);

  const addToQueue = useCallback((track) => {
    if (!track) return;
    const normalized = normalizeTrack(track, Date.now());
    setQueue((previous) => [...previous, normalized]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  /* ==================================================
     PLAY / LOAD TRACK
  ================================================== */

  const loadTrack = useCallback((track, { autoplay = true } = {}) => {
    if (!track) return;
    const normalized = normalizeTrack(track);

    setCurrentTrack(normalized);
    setCurrentTime(0);
    setDuration(normalized.duration || 0);
    setIsPlaying(Boolean(autoplay));
  }, []);

  const playTrack = useCallback((track) => {
    if (!track) return;
    const normalized = normalizeTrack(track);

    setHistory((previous) => {
      if (currentTrack && currentTrack.id !== normalized.id) {
        return [...previous, currentTrack];
      }
      return previous;
    });

    // If track is in queue, update queue context if necessary
    setQueue((prevQueue) => {
      const exists = prevQueue.some((t) => t.id === normalized.id);
      if (!exists) {
        return [normalized, ...prevQueue];
      }
      return prevQueue;
    });

    loadTrack(normalized, { autoplay: true });
  }, [currentTrack, loadTrack]);

  /* ==================================================
     PLAY / PAUSE
  ================================================== */

  const pauseTrack = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resumeTrack = useCallback(() => {
    if (currentTrack) {
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const togglePlayPause = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying((previous) => !previous);
  }, [currentTrack]);

  /* ==================================================
     SEEK
  ================================================== */

  const seek = useCallback((time) => {
    const next = Math.min(Math.max(0, time), duration || 3600);

    if (currentTrack?.type === 'youtube' || currentTrack?.videoId) {
      setSeekTarget({ time: next, timestamp: Date.now() });
    } else if (audioRef.current && currentTrack?.audioUrl) {
      audioRef.current.currentTime = next;
    }

    setCurrentTime(next);
  }, [currentTrack, duration]);

  /* ==================================================
     NEXT TRACK
  ================================================== */

  const nextTrack = useCallback(() => {
    const trackList = queue.length > 0 ? queue : mockTracks.map(normalizeTrack);
    if (trackList.length === 0) return;

    if (currentTrack) {
      setHistory((previous) => [...previous, currentTrack]);
    }

    const currentIdx = trackList.findIndex((t) => t.id === currentTrack?.id);
    let nextIndex = currentIdx + 1;

    if (nextIndex >= trackList.length) {
      nextIndex = 0; // Loop to start of queue
    }

    const next = trackList[nextIndex];
    loadTrack(next, { autoplay: true });
  }, [currentTrack, queue, loadTrack]);

  /* ==================================================
     PREVIOUS TRACK
  ================================================== */

  const previousTrack = useCallback(() => {
    const trackList = queue.length > 0 ? queue : mockTracks.map(normalizeTrack);
    if (trackList.length === 0) return;

    // If played > 3s, restart track
    if (currentTime > 3) {
      seek(0);
      return;
    }

    const currentIdx = trackList.findIndex((t) => t.id === currentTrack?.id);
    let prevIndex = currentIdx - 1;

    if (prevIndex < 0) {
      prevIndex = trackList.length - 1; // Loop to end of queue
    }

    const prev = trackList[prevIndex];
    loadTrack(prev, { autoplay: true });
  }, [currentTrack, currentTime, queue, loadTrack, seek]);

  /* ==================================================
     VOLUME
  ================================================== */

  const setVolume = useCallback((value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const next = Math.min(1, Math.max(0, numeric));
    setVolumeState(next);
  }, []);

  /* ==================================================
     GESTURE MODE & TOGGLES
  ================================================== */

  const toggleGestureMode = useCallback(() => {
    setGestureMode((previous) => !previous);
  }, []);

  const toggleLikeCurrentTrack = useCallback(() => {
    if (!currentTrack) return;
    setLikedTrackIds((ids) =>
      ids.includes(currentTrack.id)
        ? ids.filter((id) => id !== currentTrack.id)
        : [...ids, currentTrack.id]
    );
  }, [currentTrack]);

  const toggleShuffle = useCallback(() => {
    setShuffle((previous) => !previous);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((previous) => {
      if (previous === 'off') return 'all';
      if (previous === 'all') return 'one';
      return 'off';
    });
  }, []);

  /* ==================================================
     GESTURE COMMAND HANDLER
  ================================================== */

  useEffect(() => {
    gestureActionsRef.current = {
      togglePlayPause,
      nextTrack,
      previousTrack,
      toggleLikeCurrentTrack,
      setVolume,
    };
  }, [nextTrack, previousTrack, setVolume, toggleLikeCurrentTrack, togglePlayPause]);

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  const handleGestureCommand = useCallback((message) => {
    const command = typeof message === 'string' ? message : message?.command;
    const actions = gestureActionsRef.current;
    if (!actions) return;

    switch (command) {
      case 'PLAY_PAUSE':
        actions.togglePlayPause();
        break;
      case 'NEXT':
        actions.nextTrack();
        break;
      case 'PREVIOUS':
        actions.previousTrack();
        break;
      case 'LIKE':
        actions.toggleLikeCurrentTrack();
        break;
      case 'DISABLE_GESTURE_MODE':
        setGestureMode(false);
        break;
      case 'SET_VOLUME':
        actions.setVolume(message?.value);
        break;
      default:
        break;
    }
  }, []);

  /* ==================================================
     HTML5 AUDIO (for local sample files)
  ================================================== */

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const handleEnded = () => {
      nextTrackRef.current();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack?.audioUrl) {
      audio.pause();
      audio.removeAttribute('src');
      return;
    }

    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audioUrl) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  /* ==================================================
     YOUTUBE PLAYER EVENT HANDLERS
  ================================================== */

  const handleYouTubeDuration = useCallback((dur) => {
    if (typeof dur === 'number' && dur > 0) {
      setDuration(dur);
    }
  }, []);

  const handleYouTubeTimeUpdate = useCallback((time) => {
    if (typeof time === 'number') {
      setCurrentTime(time);
    }
  }, []);

  const handleYouTubeEnded = useCallback(() => {
    nextTrackRef.current();
  }, []);

  const handleYouTubeError = useCallback((code) => {
    console.warn('YouTube playback error code:', code, 'Skipping to next track.');
    setTimeout(() => {
      nextTrackRef.current();
    }, 800);
  }, []);

  /* ==================================================
     CONTEXT VALUE
  ================================================== */

  const value = useMemo(
    () => ({
      currentTrack,
      isPlaying,
      history,
      currentTime,
      duration,
      volume,
      repeat,
      shuffle,
      gestureMode,
      likedTrackIds,
      queue,

      playTrack,
      pauseTrack,
      resumeTrack,
      togglePlayPause,

      nextTrack,
      previousTrack,

      setQueueAndPlay,
      addToQueue,
      clearQueue,

      seek,
      setVolume,

      toggleGestureMode,
      toggleLikeCurrentTrack,
      handleGestureCommand,
      toggleShuffle,
      cycleRepeat,
    }),
    [
      currentTrack,
      isPlaying,
      history,
      currentTime,
      duration,
      volume,
      repeat,
      shuffle,
      gestureMode,
      likedTrackIds,
      queue,

      playTrack,
      pauseTrack,
      resumeTrack,
      togglePlayPause,

      nextTrack,
      previousTrack,

      setQueueAndPlay,
      addToQueue,
      clearQueue,

      seek,
      setVolume,

      toggleGestureMode,
      toggleLikeCurrentTrack,
      handleGestureCommand,
      toggleShuffle,
      cycleRepeat,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <YouTubePlayer
        videoId={currentTrack?.videoId}
        title={currentTrack?.title}
        isPlaying={isPlaying && Boolean(currentTrack?.videoId)}
        volume={volume}
        seekTarget={seekTarget}
        onDuration={handleYouTubeDuration}
        onTimeUpdate={handleYouTubeTimeUpdate}
        onEnded={handleYouTubeEnded}
        onError={handleYouTubeError}
      />
    </PlayerContext.Provider>
  );
}

export default PlayerContext;
