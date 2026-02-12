import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import ReactorCore from './ReactorCore';
import ReactorRings from './ReactorRings';
import ReactorParticles from './ReactorParticles';
import VoiceWaveformRing from './VoiceWaveformRing';
import HolographicPlate from './HolographicPlate';

/**
 * Simple fallback rendered inside the R3F Canvas while children load.
 * This is a plain mesh, not an HTML element, because it sits inside <Canvas>.
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
      {/* Ambient fill so geometry isn't pure black on non-emissive faces */}
      <ambientLight intensity={0.15} />

      {/* Core glowing sphere */}
      <ReactorCore jarvisState={jarvisState} />

      {/* Concentric segmented rings */}
      <ReactorRings jarvisState={jarvisState} />

      {/* Floating orbital particles */}
      <ReactorParticles jarvisState={jarvisState} />

      {/* Audio-reactive waveform ring – only rendered while listening */}
      {jarvisState === 'listening' && (
        <VoiceWaveformRing audioData={audioData} />
      )}

      {/* Background holographic circuit plate */}
      <HolographicPlate />

      {/* Post-processing: bloom gives the neon-glow look */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

/**
 * ArcReactor – top-level component.
 *
 * Props:
 *   jarvisState  – 'idle' | 'listening' | 'processing' | 'speaking' | 'alert'
 *   audioData    – () => Uint8Array  (frequency data from an AnalyserNode)
 */
export default function ArcReactor({ jarvisState = 'idle', audioData = null, size = 280 }) {
  // Container style: centered block, dynamic size, no background
  const containerStyle = useMemo(
    () => ({
      width: `${size}px`,
      height: `${size}px`,
      margin: '0 auto',
      position: 'relative',
      // Prevent the canvas from capturing pointer events on transparent areas
      pointerEvents: 'none',
    }),
    [size],
  );

  return (
    <div style={containerStyle}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          alpha: true,              // transparent background
          antialias: true,
          powerPreference: 'high-performance',
          toneMappingExposure: 1.5,
        }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          pointerEvents: 'auto',
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ReactorScene jarvisState={jarvisState} audioData={audioData} />
        </Suspense>
      </Canvas>
    </div>
  );
}
