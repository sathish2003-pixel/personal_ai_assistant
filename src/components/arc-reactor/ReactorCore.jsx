import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Color & intensity presets per JARVIS state ──────────────────────────────
const STATE_CONFIG = {
  idle:       { color: '#4FC3F7', intensity: 0.6,  lightIntensity: 1.5,  pulseSpeed: 1.0,  pulseAmp: 0.04 },
  listening:  { color: '#4FC3F7', intensity: 1.0,  lightIntensity: 3.0,  pulseSpeed: 2.5,  pulseAmp: 0.07 },
  processing: { color: '#FFD740', intensity: 0.8,  lightIntensity: 2.5,  pulseSpeed: 3.0,  pulseAmp: 0.06 },
  speaking:   { color: '#4FC3F7', intensity: 1.0,  lightIntensity: 2.8,  pulseSpeed: 1.8,  pulseAmp: 0.05 },
  alert:      { color: '#FFD740', intensity: 1.0,  lightIntensity: 4.0,  pulseSpeed: 6.0,  pulseAmp: 0.10 },
};

export default function ReactorCore({ jarvisState = 'idle' }) {
  const meshRef = useRef();
  const lightRef = useRef();
  const materialRef = useRef();

  // Smoothly-interpolated working values
  const animState = useRef({
    currentColor: new THREE.Color('#4FC3F7'),
    targetColor: new THREE.Color('#4FC3F7'),
    currentIntensity: 0.6,
    currentLightIntensity: 1.5,
  });

  // Resolve target config each frame based on prop
  const config = STATE_CONFIG[jarvisState] || STATE_CONFIG.idle;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const anim = animState.current;

    // ── Smooth color transition ────────────────────────────────────────────
    anim.targetColor.set(config.color);
    anim.currentColor.lerp(anim.targetColor, delta * 4);
    anim.currentIntensity = THREE.MathUtils.lerp(anim.currentIntensity, config.intensity, delta * 4);
    anim.currentLightIntensity = THREE.MathUtils.lerp(anim.currentLightIntensity, config.lightIntensity, delta * 4);

    // ── Apply to material ──────────────────────────────────────────────────
    if (materialRef.current) {
      materialRef.current.emissive.copy(anim.currentColor);
      materialRef.current.emissiveIntensity = anim.currentIntensity;
      materialRef.current.color.copy(anim.currentColor).multiplyScalar(0.3);
    }

    // ── Pulse: gentle scale oscillation ────────────────────────────────────
    if (meshRef.current) {
      // For alert state, do a sharp on/off flash 3x per second
      let pulse;
      if (jarvisState === 'alert') {
        // Triangle wave that flashes 3 times per second
        const flashCycle = (t * 3) % 1;
        pulse = flashCycle < 0.5 ? 1 + config.pulseAmp : 1 - config.pulseAmp * 0.5;
      } else {
        pulse = 1 + Math.sin(t * config.pulseSpeed) * config.pulseAmp;
      }
      meshRef.current.scale.setScalar(pulse);
    }

    // ── Point light intensity follows pulse ────────────────────────────────
    if (lightRef.current) {
      const lightPulse = 1 + Math.sin(t * config.pulseSpeed * 1.2) * 0.3;
      lightRef.current.intensity = anim.currentLightIntensity * lightPulse;
      lightRef.current.color.copy(anim.currentColor);
    }
  });

  return (
    <group>
      {/* Central glowing sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 64, 64]} />
        <meshStandardMaterial
          ref={materialRef}
          emissive="#4FC3F7"
          emissiveIntensity={0.6}
          color="#1a3a4f"
          transparent
          opacity={0.95}
          roughness={0.2}
          metalness={0.4}
          toneMapped={false}
        />
      </mesh>

      {/* Inner glow halo – slightly larger, very transparent */}
      <mesh>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshBasicMaterial
          color="#4FC3F7"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {/* Central point light */}
      <pointLight
        ref={lightRef}
        color="#4FC3F7"
        intensity={1.5}
        distance={8}
        decay={2}
      />
    </group>
  );
}
