import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Upload, Loader2, Sparkles, Disc3 } from 'lucide-react';
import VibeInput from '../components/VibeInput';
import ImageUploader from '../components/ImageUploader';
import usePlayer from '../hooks/usePlayer';
import { mockNowPlaying } from '../data/mockTracks';
import { analyzeImageVibe } from '../services/vibeApi';
import { generateMusicQueue } from '../services/musicApi';
import './Vibe.css';

function Vibe() {
  const location = useLocation();
  const initial = location.state?.prompt ?? '';
  const [prompt, setPrompt] = useState(initial);
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { setQueueAndPlay, playTrack, currentTrack } = usePlayer();

  const handleGenerate = async (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return setError('Enter a feeling or moment to continue.');
    setIsAnalyzing(true);
    setError('');

    try {
      const data = await generateMusicQueue(trimmed);
      setResult({
        profile: data.vibe,
        source: data.source,
        queue: data.queue,
      });

      if (data.queue && data.queue.length > 0) {
        setQueueAndPlay(data.queue, 0);
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to analyze vibe.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageAnalysis = async () => {
    if (!selectedImage) return setError('Choose an image to analyze.');
    setIsAnalyzing(true);
    setError('');

    try {
      const response = await analyzeImageVibe(selectedImage);
      setResult(response);
      playTrack(mockNowPlaying);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (initial) {
      handleGenerate(initial);
    }
  }, []);

  return (
    <section className="vibe-page">
      <h1 className="page-title">Vibe</h1>
      <p className="page-subtitle">
        Tell ICHOS the moment or show it an image. The AI analyzes your intent and immediately starts playing your custom queue.
      </p>

      <div className="vibe-page__block glass-card">
        <h2 className="vibe-page__heading">Natural language</h2>
        <VibeInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={handleGenerate}
          disabled={isAnalyzing}
          placeholder="Describe your moment (e.g., 'I feel like Iron Man today' or 'Late night coding')..."
        />
      </div>

      <div className="vibe-page__or" aria-hidden="true"><span>OR</span></div>

      <div className="vibe-page__block glass-card">
        <h2 className="vibe-page__heading">Upload an image</h2>
        <ImageUploader onImageChange={setSelectedImage} disabled={isAnalyzing} />
        <button
          type="button"
          className="btn btn-primary vibe-page__image-button"
          onClick={handleImageAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? <Loader2 size={18} className="spin-slow" /> : <Upload size={18} />}
          {isAnalyzing ? 'Analyzing…' : 'Analyze image'}
        </button>
      </div>

      {error ? <p className="vibe-page__error">{error}</p> : null}
      {result ? <VibeProfile profile={result.profile} source={result.source} currentTrack={currentTrack} /> : null}
    </section>
  );
}

function VibeProfile({ profile, source, currentTrack }) {
  if (!profile) return null;

  return (
    <section className="vibe-profile glass-card" aria-live="polite">
      <p className="vibe-profile__eyebrow">
        <Sparkles size={14} className="inline-icon" /> Vibe detected {source === 'fallback' ? '(curated fallback)' : '(AI analysis)'}
      </p>
      <h2>{profile.context}</h2>
      <p>{(profile.mood || []).join(' • ')} · {(profile.atmosphere || []).join(' • ')}</p>
      <div className="vibe-profile__details">
        <span>Energy {Math.round((profile.energy || 0.5) * 100)}%</span>
        <span>Danceability {Math.round((profile.danceability || 0.5) * 100)}%</span>
        <span>{profile.tempo} tempo</span>
        <span>{(profile.genres || []).join(', ')}</span>
      </div>
      {currentTrack ? (
        <p className="vibe-profile__playing">
          <Disc3 size={16} className="inline-icon spin-slow" /> Now playing: <strong>{currentTrack.title}</strong> — {currentTrack.artist}
        </p>
      ) : null}
    </section>
  );
}

export default Vibe;
