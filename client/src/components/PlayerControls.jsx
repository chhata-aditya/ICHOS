import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';

function PlayerControls({ isPlaying, onPlayPause, onNext, onPrevious, size = 'md' }) {
  const iconSize = size === 'lg' ? 28 : 20;

  return (
    <div className={`player-controls player-controls--${size}`}>
      <button
        type="button"
        className="btn-icon"
        aria-label="Previous track"
        onClick={onPrevious}
      >
        <SkipBack size={iconSize} />
      </button>
      <button
        type="button"
        className="btn-icon player-controls__play"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={onPlayPause}
      >
        {isPlaying ? <Pause size={iconSize} /> : <Play size={iconSize} />}
      </button>
      <button
        type="button"
        className="btn-icon"
        aria-label="Next track"
        onClick={onNext}
      >
        <SkipForward size={iconSize} />
      </button>
    </div>
  );
}

export default PlayerControls;
