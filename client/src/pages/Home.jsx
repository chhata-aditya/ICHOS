import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ImagePlus, Search, Sparkles, Disc3, Loader2 } from 'lucide-react';
import VibeInput from '../components/VibeInput';
import usePlayer from '../hooks/usePlayer';
import { generateMusicQueue } from '../services/musicApi';
import './Home.css';

const QUICK_VIBES = [
  '⚡ High Energy',
  '🌙 Midnight Chill',
  '☕ Deep Focus',
  '🌧 Rainy Melancholy',
  '🚀 Cyberpunk Drive',
];

function Home() {
  const navigate = useNavigate();
  const { setQueueAndPlay } = usePlayer();
  const [prompt, setPrompt] = useState('');
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      setMessage('Describe a mood or moment first to synthesize your vibe.');
      return;
    }

    setIsGenerating(true);
    setMessage('Synthesizing your vibe queue...');

    try {
      const data = await generateMusicQueue(trimmed);
      if (data.queue && data.queue.length > 0) {
        setQueueAndPlay(data.queue, 0);
        navigate('/player', { state: { vibe: data.vibe, prompt: trimmed } });
      } else {
        setMessage('No music candidates found for this vibe. Try a different mood.');
      }
    } catch (err) {
      console.error('Music generation failed:', err);
      setMessage(err.message || 'Unable to generate queue right now. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickVibe = (vibeText) => {
    const clean = vibeText.replace(/^[^\w\s]+\s*/, '');
    setPrompt(clean);
    handleGenerate(clean);
  };

  return (
    <section className="home">
      <div className="home__hero">
        <div className="home__badge">
          <Sparkles size={14} className="home__badge-icon" />
          <span>Next-Gen Spatial Vibe & Gesture Music</span>
        </div>

        <h1 className="home__brand brand-wordmark">ICHOS</h1>
        <p className="home__tagline">Music curated for your exact moment.</p>

        <div className="home__vibe glass-card">
          <VibeInput
            value={prompt}
            onChange={setPrompt}
            onGenerate={handleGenerate}
            disabled={isGenerating}
            placeholder="Describe what you're feeling right now…"
          />

          <div className="home__quick-vibes">
            <span className="home__quick-label">Try vibes:</span>
            <div className="home__quick-list">
              {QUICK_VIBES.map((vibe) => (
                <button
                  key={vibe}
                  type="button"
                  className="quick-vibe-pill"
                  disabled={isGenerating}
                  onClick={() => handleQuickVibe(vibe)}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          {message ? (
            <p className="home__message">
              {isGenerating ? <Loader2 size={14} className="spin-slow inline-icon" /> : null} {message}
            </p>
          ) : null}
        </div>

        <div className="home__or" aria-hidden="true">
          <span>EXPLORE CHANNELS</span>
        </div>

        <div className="home__alt">
          <Link to="/player" className="btn btn-primary">
            <Disc3 size={18} />
            Open Player Chamber
          </Link>
          <Link to="/vibe" className="btn btn-ghost">
            <ImagePlus size={18} />
            Vibe by Image
          </Link>
          <Link to="/search" className="btn btn-ghost">
            <Search size={18} />
            Search Library
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Home;
