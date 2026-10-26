import { Link } from 'react-router-dom';
import usePlayer from '../hooks/usePlayer';
import { formatTime } from '../context/PlayerContext';
import PlayerControls from './PlayerControls';
import './PlayerBar.css';

function PlayerBar() {
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

  if (!currentTrack) {
    return (
      <aside className="player-bar player-bar--empty" aria-label="Now playing">
        <div className="player-bar__inner">
          <p className="player-bar__empty-text">Nothing playing yet — choose a track above</p>
        </div>
      </aside>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekClick = (event) => {
    if (duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  return (
    <aside className="player-bar" aria-label="Now playing">
      <div className="player-bar__inner">
        <Link to="/player" className="player-bar__track">
          <div className="player-bar__art-wrap">
            <img
              src={currentTrack.artwork}
              alt=""
              className="player-bar__art"
              width={46}
              height={46}
            />
            {isPlaying ? (
              <div className="player-bar__art-pulse" />
            ) : null}
          </div>
          <div className="player-bar__meta">
            <div className="player-bar__title-row">
              <span className="player-bar__title">{currentTrack.title}</span>
              {isPlaying ? (
                <div className="player-bar__mini-eq" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
            </div>
            <span className="player-bar__artist">{currentTrack.artist}</span>
          </div>
        </Link>

        <PlayerControls
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onNext={nextTrack}
          onPrevious={previousTrack}
        />

        <div className="player-bar__progress">
          <span className="player-bar__time player-bar__time--elapsed">
            {formatTime(currentTime)}
          </span>
          <button
            type="button"
            className="player-bar__progress-track"
            aria-label="Seek"
            onClick={handleSeekClick}
          >
            <div
              className="player-bar__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </button>
          <span className="player-bar__time">{formatTime(duration)}</span>
        </div>
      </div>
    </aside>
  );
}

export default PlayerBar;
