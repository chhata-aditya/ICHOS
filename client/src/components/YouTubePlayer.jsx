import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import './YouTubePlayer.css';

let ytApiLoadingPromise = null;

function loadYouTubeIframeApi() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }

  if (ytApiLoadingPromise) {
    return ytApiLoadingPromise;
  }

  ytApiLoadingPromise = new Promise((resolve) => {
    const existingScript = document.getElementById('youtube-iframe-api-script');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback();
      resolve(window.YT);
    };
  });

  return ytApiLoadingPromise;
}

function YouTubePlayer({
  videoId,
  isPlaying,
  volume,
  seekTarget,
  onStateChange,
  onDuration,
  onTimeUpdate,
  onEnded,
  onError,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);
  const timePollIntervalRef = useRef(null);
  const lastVideoIdRef = useRef(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Keep latest callbacks in refs
  const callbacksRef = useRef({
    onStateChange,
    onDuration,
    onTimeUpdate,
    onEnded,
    onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStateChange,
      onDuration,
      onTimeUpdate,
      onEnded,
      onError,
    };
  }, [onStateChange, onDuration, onTimeUpdate, onEnded, onError]);

  // Initialize YouTube IFrame Player (with AUTOPLAY = 0 so it NEVER plays on site restart)
  useEffect(() => {
    let isMounted = true;

    loadYouTubeIframeApi().then((YT) => {
      if (!isMounted || !containerRef.current || playerRef.current) return;

      const playerDiv = document.createElement('div');
      containerRef.current.appendChild(playerDiv);

      playerRef.current = new YT.Player(playerDiv, {
        height: '200',
        width: '200',
        playerVars: {
          autoplay: 0, // Strict 0: Never autoplay on site refresh/restart
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (!isMounted) return;
            isReadyRef.current = true;
            try {
              event.target.setVolume(Math.round(volume * 100));
            } catch (e) {
              // ignore
            }

            // Only load/play if user explicitly started playing
            if (videoId && isPlaying) {
              lastVideoIdRef.current = videoId;
              try {
                event.target.loadVideoById({ videoId });
              } catch (e) {
                console.warn('Initial video load caught:', e);
              }
            } else if (videoId) {
              lastVideoIdRef.current = videoId;
              try {
                event.target.cueVideoById({ videoId });
              } catch (e) {
                // ignore
              }
            }
          },
          onStateChange: (event) => {
            if (!isMounted) return;
            const state = event.data;
            callbacksRef.current.onStateChange?.(state);

            // YT.PlayerState.PLAYING = 1
            if (state === 1) {
              setAutoplayBlocked(false);
              const dur = event.target.getDuration();
              if (dur && dur > 0) {
                callbacksRef.current.onDuration?.(dur);
              }
            }

            // YT.PlayerState.ENDED = 0
            if (state === 0) {
              callbacksRef.current.onEnded?.();
            }
          },
          onError: (event) => {
            if (!isMounted) return;
            console.warn('YouTube Player error code:', event.data);
            callbacksRef.current.onError?.(event.data);
          },
        },
      });
    });

    return () => {
      isMounted = false;
      if (timePollIntervalRef.current) {
        clearInterval(timePollIntervalRef.current);
      }
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore cleanup
        }
        playerRef.current = null;
      }
      isReadyRef.current = false;
    };
  }, []);

  // Handle Video ID changes
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current || !videoId) return;

    if (lastVideoIdRef.current !== videoId) {
      lastVideoIdRef.current = videoId;
      try {
        if (isPlaying) {
          playerRef.current.loadVideoById({ videoId });
        } else {
          playerRef.current.cueVideoById({ videoId });
        }
      } catch (err) {
        console.warn('Failed to load video on YouTube player:', err);
      }
    }
  }, [videoId, isPlaying]);

  // Handle Play/Pause
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current || !videoId) return;

    try {
      if (isPlaying) {
        const playPromise = playerRef.current.playVideo();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            setAutoplayBlocked(true);
          });
        }
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (err) {
      console.warn('Failed to change play state on YouTube player:', err);
    }
  }, [isPlaying, videoId]);

  // Handle Volume
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;
    try {
      playerRef.current.setVolume(Math.round(volume * 100));
    } catch (err) {
      // ignore
    }
  }, [volume]);

  // Handle Seek Target
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current || !seekTarget) return;
    try {
      playerRef.current.seekTo(seekTarget.time, true);
    } catch (err) {
      // ignore
    }
  }, [seekTarget]);

  // Time polling while playing
  useEffect(() => {
    if (timePollIntervalRef.current) {
      clearInterval(timePollIntervalRef.current);
      timePollIntervalRef.current = null;
    }

    if (isPlaying && videoId) {
      timePollIntervalRef.current = setInterval(() => {
        if (isReadyRef.current && playerRef.current) {
          try {
            const currentTime = playerRef.current.getCurrentTime();
            if (typeof currentTime === 'number' && !Number.isNaN(currentTime)) {
              callbacksRef.current.onTimeUpdate?.(currentTime);
            }
            const duration = playerRef.current.getDuration();
            if (typeof duration === 'number' && duration > 0) {
              callbacksRef.current.onDuration?.(duration);
            }
          } catch (e) {
            // ignore
          }
        }
      }, 250);
    }

    return () => {
      if (timePollIntervalRef.current) {
        clearInterval(timePollIntervalRef.current);
      }
    };
  }, [isPlaying, videoId]);

  const handleManualStart = () => {
    setAutoplayBlocked(false);
    if (playerRef.current) {
      try {
        playerRef.current.playVideo();
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <>
      <div
        className="youtube-audio-engine"
        ref={containerRef}
        aria-hidden="true"
      />

      {autoplayBlocked ? (
        <div className="youtube-autoplay-unblock-badge">
          <button
            type="button"
            className="youtube-autoplay-btn"
            onClick={handleManualStart}
          >
            <Play size={14} fill="currentColor" /> Start Audio
          </button>
        </div>
      ) : null}
    </>
  );
}

export default YouTubePlayer;
