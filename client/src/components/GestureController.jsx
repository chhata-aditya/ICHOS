import { useEffect, useRef, useState } from 'react';
import usePlayer from '../hooks/usePlayer';
import './GestureController.css';

const websocketUrl = import.meta.env.VITE_GESTURE_WS_URL
  || (import.meta.env.PROD ? 'wss://ichos-gesture.onrender.com/ws' : 'ws://127.0.0.1:8000/ws');
const FRAME_INTERVAL_MS = 100;

function GestureController() {
  const { gestureMode, handleGestureCommand } = usePlayer();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const commandHandlerRef = useRef(handleGestureCommand);
  const sessionRef = useRef(0);
  const badgeTimerRef = useRef(null);
  const [status, setStatus] = useState('Camera is off');
  const [lastCommand, setLastCommand] = useState('');
  const [activeBadge, setActiveBadge] = useState(null);

  // Updating this ref never restarts the camera lifecycle effect.
  useEffect(() => {
    commandHandlerRef.current = handleGestureCommand;
  }, [handleGestureCommand]);

  useEffect(() => {
    if (!gestureMode) {
      setStatus('Camera is off');
      setLastCommand('');
      setActiveBadge(null);
      if (badgeTimerRef.current) {
        clearTimeout(badgeTimerRef.current);
        badgeTimerRef.current = null;
      }
      return undefined;
    }

    const sessionId = ++sessionRef.current;
    let isActive = true;
    let stream = null;
    let socket = null;
    let frameTimer = null;

    const ownsSession = () => isActive && sessionRef.current === sessionId;

    const stopSession = () => {
      isActive = false;

      if (badgeTimerRef.current) {
        clearTimeout(badgeTimerRef.current);
        badgeTimerRef.current = null;
      }

      if (frameTimer !== null) {
        window.clearInterval(frameTimer);
        frameTimer = null;
      }

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1000, 'Gesture control disabled');
        }
        socket = null;
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };

    const sendFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!ownsSession() || !socket || socket.readyState !== WebSocket.OPEN) return;
      // Avoid building a queue of stale frames if inference/network slows down.
      if (socket.bufferedAmount > 500_000) return;
      if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

      canvas.width = 320;
      canvas.height = Math.round((video.videoHeight / video.videoWidth) * canvas.width) || 240;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Mirror the processed frame to match the displayed preview.
      context.save();
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.restore();
      canvas.toBlob((blob) => {
        if (!blob || !ownsSession() || !socket || socket.readyState !== WebSocket.OPEN) return;
        try {
          socket.send(blob);
        } catch (error) {
          console.warn('Gesture frame was not sent:', error);
        }
      }, 'image/jpeg', 0.65);
    };

    const start = async () => {
      try {
        setStatus('Requesting camera permission…');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });

        if (!ownsSession()) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) {
          stopSession();
          return;
        }

        video.srcObject = stream;
        await video.play();
        if (!ownsSession()) return;

        setStatus('Connecting to gesture service…');
        socket = new WebSocket(websocketUrl);

        socket.onopen = () => {
          if (!ownsSession()) return;
          setStatus('Gesture Control Active');
          frameTimer = window.setInterval(sendFrame, FRAME_INTERVAL_MS);
        };

        socket.onmessage = (event) => {
          if (!ownsSession() || typeof event.data !== 'string') return;
          try {
            const message = JSON.parse(event.data);
            if (message?.type !== 'PLAYER_COMMAND' || typeof message.command !== 'string') return;
            console.log(`Received gesture command: ${message.command}`);
            setLastCommand(message.command);

            if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
            setActiveBadge({ id: Date.now(), text: message.command });
            badgeTimerRef.current = setTimeout(() => {
              setActiveBadge(null);
            }, 1200);

            commandHandlerRef.current(message);
          } catch (error) {
            console.warn('Ignoring malformed gesture message:', error);
          }
        };

        socket.onerror = () => {
          if (ownsSession()) setStatus('Gesture service unavailable');
        };

        socket.onclose = () => {
          if (!ownsSession()) return;
          if (frameTimer !== null) {
            window.clearInterval(frameTimer);
            frameTimer = null;
          }
          setStatus('Gesture service disconnected');
        };
      } catch (error) {
        if (!ownsSession()) return;
        console.error('Gesture camera error:', error);
        if (error.name === 'NotAllowedError') setStatus('Camera permission was denied');
        else if (error.name === 'NotFoundError') setStatus('No camera found');
        else setStatus('Camera unavailable');
      }
    };

    start();
    return stopSession;
  }, [gestureMode]);

  return (
    <div className="gesture-controller" aria-live="polite">
      <div className="gesture-controller__video-wrap">
        <video ref={videoRef} className="gesture-controller__preview" muted playsInline />
        {activeBadge ? (
          <div key={activeBadge.id} className="gesture-controller__hud-badge">
            <span className="gesture-controller__hud-text">
              {activeBadge.text === 'NEXT'
                ? '⏭ NEXT'
                : activeBadge.text === 'PREVIOUS'
                ? '⏮ PREVIOUS'
                : activeBadge.text === 'PLAY_PAUSE'
                ? '⏯ PLAY / PAUSE'
                : activeBadge.text.replaceAll('_', ' ')}
            </span>
          </div>
        ) : null}
      </div>
      <canvas ref={canvasRef} hidden />
      <p className="gesture-controller__status">● {status}</p>
      {lastCommand ? <p className="gesture-controller__command">Detected: {lastCommand.replaceAll('_', ' ')}</p> : null}
    </div>
  );
}

export default GestureController;
