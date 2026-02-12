import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── State configuration ─────────────────────────────────────────────────────
const STATE_CONFIG = {
  idle:       { color: '#4FC3F7', count: 100, orbitSpeed: 0.3, spread: 2.5, sizeBase: 0.015 },
  listening:  { color: '#4FC3F7', count: 200, orbitSpeed: 0.8, spread: 3.0, sizeBase: 0.018 },
  processing: { color: '#FFD740', count: 200, orbitSpeed: 1.0, spread: 3.2, sizeBase: 0.020 },
  speaking:   { color: '#4FC3F7', count: 150, orbitSpeed: 0.6, spread: 2.8, sizeBase: 0.016 },
  alert:      { color: '#FFD740', count: 180, orbitSpeed: 1.5, spread: 3.5, sizeBase: 0.022 },
};

const MAX_PARTICLES = 200; // allocate for the max we'll ever need

/**
 * Generate random positions on a sphere shell with some radial variation.
 */
function generatePositions(count, spread) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = spread * (0.4 + Math.random() * 0.6); // between 40%-100% of spread
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.4; // flatten Z a bit for disc-like shape
  }
  return positions;
}

/**
 * Generate per-particle random data for animation offsets.
 * Stores: [orbitOffset, floatPhase, twinklePhase] per particle.
 */
function generateParticleData(count) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      orbitOffset: Math.random() * Math.PI * 2,
      floatPhase: Math.random() * Math.PI * 2,
      twinklePhase: Math.random() * Math.PI * 2,
      radius: 0.4 + Math.random() * 0.6,
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
    });
  }
  return data;
}

export default function ReactorParticles({ jarvisState = 'idle' }) {
  const pointsRef = useRef();
  const config = STATE_CONFIG[jarvisState] || STATE_CONFIG.idle;

  // Pre-generate max-sized buffers and per-particle animation data
  const { positions, sizes, particleData } = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const sz = new Float32Array(MAX_PARTICLES);
    const pd = generateParticleData(MAX_PARTICLES);

    // Initial positions
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const d = pd[i];
      const r = 2.5 * d.radius;
      pos[i * 3]     = r * Math.sin(d.phi) * Math.cos(d.theta);
      pos[i * 3 + 1] = r * Math.sin(d.phi) * Math.sin(d.theta);
      pos[i * 3 + 2] = r * Math.cos(d.phi) * 0.4;
      sz[i] = 0.015;
    }

    return { positions: pos, sizes: sz, particleData: pd };
  }, []);

  // Animated color ref
  const animColor = useRef(new THREE.Color('#4FC3F7'));
  const targetColor = useRef(new THREE.Color('#4FC3F7'));

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const t = state.clock.getElapsedTime();
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const sizeAttr = geom.attributes.size;

    const activeCount = config.count;
    const spread = config.spread;
    const orbitSpeed = config.orbitSpeed;
    const sizeBase = config.sizeBase;

    // Color lerp
    targetColor.current.set(config.color);
    animColor.current.lerp(targetColor.current, delta * 4);
    if (pointsRef.current.material) {
      pointsRef.current.material.color.copy(animColor.current);
    }

    // Update each particle
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const d = particleData[i];

      if (i < activeCount) {
        // Orbit: rotate theta over time
        const theta = d.theta + t * orbitSpeed * (0.5 + d.radius * 0.5) + d.orbitOffset;
        const r = spread * d.radius;

        posAttr.array[i * 3]     = r * Math.sin(d.phi) * Math.cos(theta);
        posAttr.array[i * 3 + 1] = r * Math.sin(d.phi) * Math.sin(theta)
                                    + Math.sin(t * 0.5 + d.floatPhase) * 0.1; // float
        posAttr.array[i * 3 + 2] = r * Math.cos(d.phi) * 0.4;

        // Twinkle: oscillate size
        const twinkle = 0.6 + 0.4 * Math.sin(t * 2.5 + d.twinklePhase);
        sizeAttr.array[i] = sizeBase * twinkle * (0.5 + d.radius);
      } else {
        // Hide inactive particles by scaling to zero
        sizeAttr.array[i] = 0;
      }
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_PARTICLES}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={MAX_PARTICLES}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#4FC3F7"
        size={0.015}
        sizeAttenuation
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
