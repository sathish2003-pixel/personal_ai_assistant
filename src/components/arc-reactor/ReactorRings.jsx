import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Per-state rotation speed multipliers ────────────────────────────────────
const STATE_CONFIG = {
  idle:       { speed: 1.0,  color: '#4FC3F7', emissiveIntensity: 0.5  },
  listening:  { speed: 2.5,  color: '#4FC3F7', emissiveIntensity: 1.0  },
  processing: { speed: 3.5,  color: '#FFD740', emissiveIntensity: 0.8  },
  speaking:   { speed: 1.8,  color: '#4FC3F7', emissiveIntensity: 0.9  },
  alert:      { speed: 4.0,  color: '#FFD740', emissiveIntensity: 1.0  },
};

// Number of segments per ring and gap fraction
const OUTER_SEGMENTS = 12;
const MIDDLE_SEGMENTS = 16;
const GAP_FRACTION = 0.25; // 25% of each segment is a gap

/**
 * Build an array of { startAngle, arcLength } for N segments around a circle,
 * each separated by a small gap.
 */
function buildSegmentArcs(count, gapFrac) {
  const segmentAngle = (Math.PI * 2) / count;
  const arcLength = segmentAngle * (1 - gapFrac);
  const arcs = [];
  for (let i = 0; i < count; i++) {
    arcs.push({
      startAngle: segmentAngle * i,
      arcLength,
    });
  }
  return arcs;
}

/**
 * A single torus arc segment.
 */
function TorusSegment({ radius, tube, startAngle, arcLength, materialRef }) {
  const geom = useMemo(() => {
    // TorusGeometry(radius, tube, radialSegments, tubularSegments, arc)
    const g = new THREE.TorusGeometry(radius, tube, 16, 32, arcLength);
    // Rotate so it starts at startAngle
    g.rotateZ(startAngle);
    return g;
  }, [radius, tube, startAngle, arcLength]);

  return (
    <mesh geometry={geom}>
      <meshStandardMaterial
        ref={materialRef}
        emissive="#4FC3F7"
        emissiveIntensity={0.5}
        color="#0d2137"
        transparent
        opacity={0.85}
        roughness={0.3}
        metalness={0.6}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * A full segmented ring – a group of TorusSegments that rotates as a unit.
 */
function SegmentedRing({ radius, tube, segmentCount, gapFraction, direction, speedFactor, config }) {
  const groupRef = useRef();
  const materialRefs = useRef([]);

  const arcs = useMemo(
    () => buildSegmentArcs(segmentCount, gapFraction),
    [segmentCount, gapFraction],
  );

  // Smoothly interpolated working color
  const animColor = useRef(new THREE.Color('#4FC3F7'));
  const targetColor = useRef(new THREE.Color('#4FC3F7'));
  const currentIntensity = useRef(0.5);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Rotation
    if (groupRef.current) {
      groupRef.current.rotation.z += direction * delta * 0.5 * speedFactor * config.speed;
      // Gentle wobble on X for depth effect
      groupRef.current.rotation.x = Math.sin(t * 0.3 * config.speed) * 0.05;
    }

    // Color interpolation
    targetColor.current.set(config.color);
    animColor.current.lerp(targetColor.current, delta * 4);
    currentIntensity.current = THREE.MathUtils.lerp(currentIntensity.current, config.emissiveIntensity, delta * 4);

    // Push to all segment materials
    materialRefs.current.forEach((mat) => {
      if (mat) {
        mat.emissive.copy(animColor.current);
        mat.emissiveIntensity = currentIntensity.current;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {arcs.map((arc, i) => (
        <TorusSegment
          key={i}
          radius={radius}
          tube={tube}
          startAngle={arc.startAngle}
          arcLength={arc.arcLength}
          materialRef={(el) => {
            materialRefs.current[i] = el;
          }}
        />
      ))}
    </group>
  );
}

export default function ReactorRings({ jarvisState = 'idle' }) {
  const config = STATE_CONFIG[jarvisState] || STATE_CONFIG.idle;

  return (
    <group>
      {/* Outer ring – slower, clockwise */}
      <SegmentedRing
        radius={1.5}
        tube={0.02}
        segmentCount={OUTER_SEGMENTS}
        gapFraction={GAP_FRACTION}
        direction={1}
        speedFactor={1.0}
        config={config}
      />

      {/* Middle ring – faster, counter-clockwise */}
      <SegmentedRing
        radius={1.0}
        tube={0.015}
        segmentCount={MIDDLE_SEGMENTS}
        gapFraction={GAP_FRACTION}
        direction={-1}
        speedFactor={1.6}
        config={config}
      />

      {/* Inner accent ring – very thin, fast */}
      <SegmentedRing
        radius={0.6}
        tube={0.008}
        segmentCount={24}
        gapFraction={0.35}
        direction={1}
        speedFactor={2.2}
        config={config}
      />
    </group>
  );
}
