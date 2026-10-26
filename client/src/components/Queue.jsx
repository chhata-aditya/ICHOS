import usePlayer from '../hooks/usePlayer';
import './Queue.css';

function Queue() {
  const { queue, currentTrack, clearQueue, playTrack } = usePlayer();

  if (queue.length === 0) {
    return (
      <div className="stub-note" role="note">
        Queue is empty. Add tracks from Search — dynamic recommendations arrive later.
      </div>
    );
  }

  return (
    <div className="queue">
      <div className="queue__header">
        <p className="queue__count">{queue.length} upcoming</p>
        <button type="button" className="btn btn-ghost queue__clear" onClick={clearQueue}>
          Clear
        </button>
      </div>
      <ul className="queue__list">
        {queue.map((track, index) => (
          <li key={`${track.id}-${index}`} className="queue__item">
            <button
              type="button"
              className="queue__play"
              onClick={() => playTrack(track)}
            >
              <img src={track.artwork} alt="" width={40} height={40} />
              <span className="queue__meta">
                <span className="queue__title">{track.title}</span>
                <span className="queue__artist">{track.artist}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {currentTrack ? (
        <p className="queue__now">
          Playing now: {currentTrack.title}
        </p>
      ) : null}
    </div>
  );
}

export default Queue;
