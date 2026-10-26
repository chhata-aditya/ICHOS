import { useEffect, useState, useRef } from 'react';
import { Search as SearchIcon, Play, Plus, Loader2, Sparkles, Disc3, X, Check, Flame } from 'lucide-react';
import usePlayer from '../hooks/usePlayer';
import { searchMusicTracks } from '../services/musicApi';
import './Search.css';

const TRENDING_CHIPS = [
  { label: '🔥 Top Hits', query: 'Top Hits' },
  { label: '💖 Barbie Soundtrack', query: 'Barbie soundtrack' },
  { label: '🕶️ Harvey Specter Blues', query: 'Harvey Specter Suits' },
  { label: '⚡ 80s Synthwave', query: 'The Weeknd Synthwave' },
  { label: '🌧️ Rainy Melancholy', query: 'Melancholic Indie Acoustic' },
  { label: '💪 Gym Workout', query: 'Workout Phonk Trap' },
  { label: '☕ Lo-Fi Coding', query: 'Lofi Girl' },
  { label: '🎸 Hard Rock', query: 'AC/DC Rock' },
  { label: '💃 Disco & Pop', query: 'Dua Lipa Dance Pop' },
];

function Search() {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('ichos_recent_searches');
      return saved ? JSON.parse(saved) : ['Barbie', 'The Weeknd', 'AC/DC', 'Lofi Girl'];
    } catch {
      return ['Barbie', 'The Weeknd', 'AC/DC', 'Lofi Girl'];
    }
  });
  const [notice, setNotice] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { playTrack, addToQueue, setQueueAndPlay, currentTrack, isPlaying } = usePlayer();
  const searchTimeoutRef = useRef(null);

  const saveRecentSearch = (term) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('ichos_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const performSearch = async (searchTerm) => {
    setIsSearching(true);
    try {
      const data = await searchMusicTracks(searchTerm);
      setResults(data.results || []);
      if (searchTerm.trim().length >= 3) {
        saveRecentSearch(searchTerm);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Initial load: fetch trending hits
  useEffect(() => {
    performSearch('Top Hits');
  }, []);

  // Debounced search on query change
  const handleQueryChange = (text) => {
    setQuery(text);
    setActiveChip('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 280);
  };

  const handleChipClick = (chip) => {
    setActiveChip(chip.label);
    setQuery(chip.query);
    performSearch(chip.query);
  };

  const handleClear = () => {
    setQuery('');
    setActiveChip('');
    performSearch('Top Hits');
  };

  const handlePlaySong = (track, index) => {
    if (results.length > 1) {
      setQueueAndPlay(results, index);
    } else {
      playTrack(track);
    }
    setNotice(`Now playing “${track.title}”`);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleAddToQueue = (track) => {
    addToQueue(track);
    setNotice(`Added “${track.title}” to queue`);
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <section className="search-page">
      <div className="search-header">
        <div className="search-badge">
          <Sparkles size={14} className="search-badge-icon" />
          <span>Universal Music Discovery Engine</span>
        </div>
        <h1 className="page-title">Refined Search & Explore</h1>
        <p className="page-subtitle">
          Search millions of verified songs, official tracks, soundtracks, and artists with instant playback.
        </p>
      </div>

      <div className="search-box-wrap glass-card">
        {/* Search Input Bar */}
        <div className="search-input-field">
          <SearchIcon size={20} className="search-input-icon" />
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search any song, artist, album (e.g. 'Barbie', 'The Weeknd', 'Taylor Swift')..."
            autoFocus
          />
          {isSearching ? (
            <Loader2 size={18} className="search-spinner spin-slow" />
          ) : query ? (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClear}
              title="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Trending Vibe & Genre Chips */}
        <div className="search-genre-chips">
          {TRENDING_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className={`genre-chip${activeChip === chip.label ? ' is-active' : ''}`}
              onClick={() => handleChipClick(chip)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Recent Searches Tag Row */}
        {recentSearches.length > 0 ? (
          <div className="recent-searches-row">
            <span className="recent-searches-label">Recent:</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="recent-search-tag"
                onClick={() => {
                  setQuery(term);
                  setActiveChip('');
                  performSearch(term);
                }}
              >
                {term}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {notice ? (
        <div className="search-page__notice" role="status">
          <Check size={14} /> {notice}
        </div>
      ) : null}

      <div className="search-page__results">
        <div className="results-header">
          <span className="results-count">
            {isSearching ? 'Searching global catalog...' : `${results.length} Verified Tracks Found`}
          </span>
        </div>

        {results.length === 0 && !isSearching ? (
          <div className="search-empty glass-card">
            <Disc3 size={36} className="search-empty-icon" />
            <p className="empty-state">No tracks matched “{query}”. Try another search term or click a trending chip above.</p>
          </div>
        ) : (
          <div className="search-grid">
            {results.map((track, index) => {
              const isCurrent = currentTrack && (currentTrack.id === track.id || currentTrack.videoId === track.videoId);
              return (
                <div
                  key={track.videoId || track.id || index}
                  className={`search-card glass-card${isCurrent ? ' is-playing' : ''}`}
                >
                  <div className="search-card__art-wrap">
                    <img
                      src={track.thumbnail || track.artwork}
                      alt=""
                      className="search-card__art"
                      loading="lazy"
                    />

                    {track.badge ? (
                      <span className="search-card__badge">{track.badge}</span>
                    ) : null}

                    {track.duration ? (
                      <span className="search-card__duration">{track.duration}</span>
                    ) : null}

                    <button
                      type="button"
                      className="search-card__play-overlay"
                      onClick={() => handlePlaySong(track, index)}
                      aria-label={`Play ${track.title}`}
                    >
                      <div className="search-card__play-icon-circle">
                        <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
                      </div>
                    </button>
                  </div>

                  <div className="search-card__info">
                    <h3 className="search-card__title" title={track.title}>
                      {track.title}
                    </h3>
                    <p className="search-card__artist">{track.artist || track.channelTitle}</p>
                  </div>

                  <div className="search-card__actions">
                    <button
                      type="button"
                      className="btn-action btn-action--play"
                      onClick={() => handlePlaySong(track, index)}
                      title="Play now"
                    >
                      <Play size={14} fill="currentColor" /> {isCurrent && isPlaying ? 'Playing' : 'Play'}
                    </button>
                    <button
                      type="button"
                      className="btn-action btn-action--queue"
                      onClick={() => handleAddToQueue(track)}
                      title="Add to queue"
                    >
                      <Plus size={15} /> Queue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Search;
