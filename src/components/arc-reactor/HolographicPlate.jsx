import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PLATE_RADIUS = 2.2;
const PLATE_SEGMENTS = 64;
const GRID_SIZE = 512; // texture resolution
const GRID_CELLS = 24; // number of grid lines

/**
 * Procedurally generate a circuit-grid pattern on a Canvas, then return a THREE.CanvasTexture.
 * The pattern is a subtle grid with small node dots at intersections.
 */
function createCircuitTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = GRID_SIZE;
  canvas.height = GRID_SIZE;
  const ctx = canvas.getContext('2d');

  // Transparent base
  ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

  const cellSize = GRID_SIZE / GRID_CELLS;

  // Draw grid lines
  ctx.strokeStyle = 'rgba(79, 195, 247, 0.35)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID_CELLS; i++) {
    const pos = i * cellSize;

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(GRID_SIZE, pos);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, GRID_SIZE);
    ctx.stroke();
  }

  // Draw small circuit nodes at some intersections
  ctx.fillStyle = 'rgba(79, 195, 247, 0.5)';
  for (let i = 0; i <= GRID_CELLS; i++) {
    for (let j = 0; j <= GRID_CELLS; j++) {
      // Only draw a node ~30% of the time for a sparse look
      if (Math.random() < 0.3) {
        const x = i * cellSize;
        const y = j * cellSize;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw a few random "traces" (short horizontal/vertical line segments)
  ctx.strokeStyle = 'rgba(79, 195, 247, 0.25)';
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 40; k++) {
    const startX = Math.floor(Math.random() * GRID_CELLS) * cellSize;
    const startY = Math.floor(Math.random() * GRID_CELLS) * cellSize;
    const horizontal = Math.random() > 0.5;
    const length = (1 + Math.floor(Math.random() * 3)) * cellSize;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    if (horizontal) {
      ctx.lineTo(Math.min(startX + length, GRID_SIZE), startY);
    } else {
      ctx.lineTo(startX, Math.min(startY + length, GRID_SIZE));
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export default function HolographicPlate() {
  const meshRef = useRef();

  const circuitMap = useMemo(() => createCircuitTexture(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    // Slow rotation
    meshRef.current.rotation.z += delta * 0.08;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -0.5]} rotation={[0, 0, 0]}>
      <circleGeometry args={[PLATE_RADIUS, PLATE_SEGMENTS]} />
      <meshStandardMaterial
        map={circuitMap}
        emissive="#4FC3F7"
        emissiveIntensity={0.15}
        emissiveMap={circuitMap}
        color="#0a1929"
        transparent
        opacity={0.1}
        roughness={0.5}
        metalness={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
