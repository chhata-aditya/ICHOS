import MusicReactiveHeroSection from '../components/ui/music-reactive-hero-section';

function ReactiveVisualizer() {
  return (
    <div className="reactive-visualizer-page">
      <MusicReactiveHeroSection
        bassIntensity={1.2}
        midIntensity={1.0}
        trebleIntensity={1.0}
        hue={0}
        saturation={0}
        lightness={0}
      />
    </div>
  );
}

export default ReactiveVisualizer;
