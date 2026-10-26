import { ListPlus, Play } from 'lucide-react';
import './SongCard.css';

function SongCard({ track, onPlay, onAddToQueue }) {
  return (
    <article className="song-card">
      <div className="song-card__art-wrap">
        <img
          src={track.artwork}
          alt=""
          className="song-card__art"
          width={64}
          height={64}
        />
      </div>
      <div className="song-card__info">
        <h3 className="song-card__title">{track.title}</h3>
        <p className="song-card__artist">{track.artist}</p>
        <p className="song-card__album">{track.album}</p>
      </div>
      <span className="song-card__duration">{track.duration}</span>
      <div className="song-card__actions">
        <button
          type="button"
          className="btn-icon"
          aria-label={`Play ${track.title}`}
          onClick={() => onPlay?.(track)}
        >
          <Play size={18} />
        </button>
        <button
          type="button"
          className="btn-icon"
          aria-label={`Add ${track.title} to queue`}
          onClick={() => onAddToQueue?.(track)}
        >
          <ListPlus size={18} />
        </button>
      </div>
    </article>
  );
}

export default SongCard;
