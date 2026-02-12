import { Suspense, useMemo, Component } from 'react';
import { Canvas } from '@react-three/fiber';

import ReactorCore from './ReactorCore';
import ReactorRings from './ReactorRings';
import ReactorParticles from './ReactorParticles';
import VoiceWaveformRing from './VoiceWaveformRing';
import HolographicPlate from './HolographicPlate';

/**
 * Simple fallback rendered inside the R3F Canvas while children load.
 */
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#4FC3F7" transparent opacity={0.5} />
    </mesh>
  );
}

/**
 * All reactor scene objects grouped here so Suspense can wrap them.
 */
function ReactorScene({ jarvisState, audioData }) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <ReactorCore jarvisState={jarvisState} />
      <ReactorRings jarvisState={jarvisState} />
      <ReactorParticles jarvisState={jarvisState} />

      {jarvisState === 'listening' && (
        <VoiceWaveformRing audioData={audioData} />
      )}

      <HolographicPlate />
    </>
  );
}

/**
 * Bloom wrapper — loaded separately so it can fail without crashing the scene.
 */
function BloomEffect() {
  try {
    const { EffectComposer, Bloom } = require('@react-three/postprocessing');
    return (
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    );
  } catch {
    return null;
  }
}

/**
 * Error boundary — catches WebGL crashes and shows a CSS fallback.
 */
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('[ArcReactor] WebGL error, showing fallback:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

/**
 * CSS-only fallback arc reactor when WebGL fails.
 */
function CSSFallbackReactor({ size }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,195,247,0.3) 0%, rgba(0,229,255,0.1) 40%, transparent 70%)',
        border: '2px solid rgba(0,229,255,0.3)',
        boxShadow: '0 0 40px rgba(0,229,255,0.2), inset 0 0 30px rgba(79,195,247,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,195,247,0.8) 0%, rgba(0,229,255,0.4) 60%, transparent 100%)',
          boxShadow: '0 0 20px rgba(0,229,255,0.6)',
        }}
      />
    </div>
  );
}

/**
 * ArcReactor – top-level component.
 */
export default function ArcReactor({ jarvisState = 'idle', audioData = null, size = 280 }) {
  const containerStyle = useMemo(
    () => ({
      width: `${size}px`,
      height: `${size}px`,
      margin: '0 auto',
      position: 'relative',
      pointerEvents: 'none',
    }),
    [size],
  );

  return (
    <div style={containerStyle}>
      <WebGLErrorBoundary fallback={<CSSFallbackReactor size={size} />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            pointerEvents: 'auto',
          }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <ReactorScene jarvisState={jarvisState} audioData={audioData} />
            <BloomEffect />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
