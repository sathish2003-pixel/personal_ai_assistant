import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RING_RADIUS = 1.8;
const NODE_COUNT = 64; // number of spheres around the ring
const NODE_RADIUS = 0.02;
const MAX_DISPLACEMENT = 0.35; // max Y offset from frequency data
const LERP_SPEED = 12; // interpolation speed (higher = snappier)

export default function VoiceWaveformRing({ audioData }) {
  const groupRef = useRef();
  const meshRefs = useRef([]);

  // Current interpolated heights for smooth animation
  const currentHeights = useRef(new Float32Array(NODE_COUNT).fill(0));

  // Pre-compute the angle for each node
  const nodeAngles = useMemo(() => {
    const angles = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      angles.push((i / NODE_COUNT) * Math.PI * 2);
    }
    return angles;
  }, []);

  // Shared geometry and material (instanced manually via refs)
  const sharedGeometry = useMemo(() => new THREE.SphereGeometry(NODE_RADIUS, 8, 8), []);
  const sharedMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        emissive: new THREE.Color('#4FC3F7'),
        emissiveIntensity: 1.2,
        color: '#0d2137',
        transparent: true,
        opacity: 0.9,
        roughness: 0.3,
        metalness: 0.5,
        toneMapped: false,
      }),
    [],
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Slow overall rotation for visual interest
    groupRef.current.rotation.z += delta * 0.15;

    // Sample audio frequency data
    let freqData = null;
    if (typeof audioData === 'function') {
      try {
        freqData = audioData();
      } catch {
        freqData = null;
      }
    }

    const heights = currentHeights.current;

    for (let i = 0; i < NODE_COUNT; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      // Determine target height from frequency data
      let targetHeight = 0;
      if (freqData && freqData.length > 0) {
        // Map node index to a frequency bin
        const binIndex = Math.floor((i / NODE_COUNT) * freqData.length);
        const value = freqData[binIndex] || 0; // 0-255 for Uint8Array
        targetHeight = (value / 255) * MAX_DISPLACEMENT;
      }

      // Smooth interpolation (lerp)
      heights[i] = THREE.MathUtils.lerp(heights[i], targetHeight, Math.min(1, delta * LERP_SPEED));

      // Position the node on the ring
      const angle = nodeAngles[i];
      const x = RING_RADIUS * Math.cos(angle);
      const z = RING_RADIUS * Math.sin(angle);
      const y = heights[i];

      mesh.position.set(x, y, z);

      // Scale nodes slightly by amplitude for visual pop
      const scaleFactor = 1 + heights[i] * 3;
      mesh.scale.setScalar(scaleFactor);
    }
  });

  return (
    <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
      {nodeAngles.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          geometry={sharedGeometry}
          material={sharedMaterial}
        />
      ))}
    </group>
  );
}
