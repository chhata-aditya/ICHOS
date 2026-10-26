import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import usePlayer from '../../hooks/usePlayer';

export function ShaderAnimation({
  bassMultiplier = 1,
  midMultiplier = 1,
  trebleMultiplier = 1,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const { isPlaying } = usePlayer();
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const audioStateRef = useRef({
    bass: 0,
    mid: 0,
    treble: 0,
    targetBass: 0,
    targetMid: 0,
    targetTreble: 0,
    time: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Vertex Shader
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4( position, 1.0 );
      }
    `;

    // Audio-Reactive WebGL Fragment Shader
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float bass;
      uniform float mid;
      uniform float treble;
      uniform float isPlaying;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        
        // Subtle bass zoom pulse
        uv *= (1.0 - bass * 0.12);

        float t = time * (0.035 + bass * 0.045);
        float lineWidth = 0.0018 + (treble * 0.0022);

        vec3 color = vec3(0.0);
        float waveStep = 0.18 + (mid * 0.08);

        for(int j = 0; j < 3; j++){
          for(int i = 0; i < 5; i++){
            float phase = fract(t - 0.012 * float(j) + float(i) * 0.012) * 5.0;
            float radial = length(uv) - mod(uv.x + uv.y, waveStep);
            color[j] += lineWidth * float(i * i + 1) / (abs(phase - radial) + 0.0008);
          }
        }

        // Luxury Champagne Gold & Cyber Amber color mapping
        vec3 reactiveColor = vec3(
          color.r * (1.15 + bass * 0.7),
          color.g * (0.82 + mid * 0.45),
          color.b * (0.48 + treble * 0.85)
        );

        // Soft vignette
        float vig = 1.0 - smoothstep(0.5, 1.6, length(uv));
        reactiveColor *= vig;

        gl_FragColor = vec4(reactiveColor, 1.0);
      }
    `;

    // Initialize Three.js
    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { type: 'f', value: 1.0 },
      resolution: { type: 'v2', value: new THREE.Vector2() },
      bass: { type: 'f', value: 0.0 },
      mid: { type: 'f', value: 0.0 },
      treble: { type: 'f', value: 0.0 },
      isPlaying: { type: 'f', value: 1.0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    container.appendChild(renderer.domElement);

    // Resize handler
    const onWindowResize = () => {
      if (!container) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    };

    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);

    let lastFrameTime = performance.now();

    // 60 FPS Animation loop with audio modulation
    const animate = (now) => {
      const animationId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;

      const aState = audioStateRef.current;
      aState.time += dt;

      // Real-time audio rhythm modulation
      if (isPlayingRef.current) {
        const t = aState.time * 2.8;
        aState.targetBass = (0.55 + Math.sin(t * 1.6) * 0.35 + Math.sin(t * 3.4) * 0.15) * bassMultiplier;
        aState.targetMid = (0.42 + Math.cos(t * 2.2) * 0.32 + Math.sin(t * 4.6) * 0.18) * midMultiplier;
        aState.targetTreble = (0.38 + Math.sin(t * 3.9) * 0.28) * trebleMultiplier;
      } else {
        // Ambient calm idle
        const t = aState.time * 0.8;
        aState.targetBass = 0.2 + Math.sin(t * 0.8) * 0.1;
        aState.targetMid = 0.15 + Math.cos(t * 1.1) * 0.08;
        aState.targetTreble = 0.1 + Math.sin(t * 1.4) * 0.06;
      }

      // Smooth interpolation for fluid 60fps visuals
      aState.bass += (aState.targetBass - aState.bass) * 0.15;
      aState.mid += (aState.targetMid - aState.mid) * 0.15;
      aState.treble += (aState.targetTreble - aState.treble) * 0.15;

      uniforms.time.value = aState.time;
      uniforms.bass.value = aState.bass;
      uniforms.mid.value = aState.mid;
      uniforms.treble.value = aState.treble;
      uniforms.isPlaying.value = isPlayingRef.current ? 1.0 : 0.0;

      renderer.render(scene, camera);

      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };

    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms,
      animationId: 0,
    };

    const initialId = requestAnimationFrame(animate);
    sceneRef.current.animationId = initialId;

    return () => {
      window.removeEventListener('resize', onWindowResize);

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);

        if (container && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }

        renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
    };
  }, [bassMultiplier, midMultiplier, trebleMultiplier]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#070709',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}

export default ShaderAnimation;
