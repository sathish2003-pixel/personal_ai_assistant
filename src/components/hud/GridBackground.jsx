import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * GridBackground - Full-screen CSS perspective grid with vignette and particles.
 * Creates the classic Iron Man HUD depth effect.
 */
const PARTICLE_COUNT = 40;

function GridBackground() {
  const containerRef = useRef(null);

  // Generate stable particle data once
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 8,
      duration: Math.random() * 4 + 3,
      driftX: (Math.random() - 0.5) * 60,
      driftY: (Math.random() - 0.5) * 60,
    }));
  }, []);

  return (
    <div ref={containerRef} style={styles.wrapper}>
      {/* Perspective Grid */}
      <div style={styles.gridContainer}>
        <div style={styles.grid} />
      </div>

      {/* Radial Vignette Overlay */}
      <div style={styles.vignette} />

      {/* Sparkling Particles */}
      <div style={styles.particleLayer}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            style={{
              ...styles.particle,
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              x: [0, p.driftX, p.driftX * 1.2],
              y: [0, p.driftY, p.driftY * 1.2],
              scale: [0.5, 1.2, 0.3],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Inline keyframes for grid drift animation */}
      <style>{`
        @keyframes grid-drift {
          0% {
            transform: perspective(600px) rotateX(55deg) translateY(0px) scale(2.2);
          }
          50% {
            transform: perspective(600px) rotateX(57deg) translateY(-15px) scale(2.25);
          }
          100% {
            transform: perspective(600px) rotateX(55deg) translateY(0px) scale(2.2);
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },

  gridContainer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  grid: {
    position: 'absolute',
    bottom: '-40%',
    left: '-50%',
    width: '200%',
    height: '160%',
    backgroundImage: `
      linear-gradient(var(--grid-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    animation: 'grid-drift 20s ease-in-out infinite',
    transformOrigin: 'center bottom',
    opacity: 0.6,
  },

  vignette: {
    position: 'absolute',
    inset: 0,
    background: `
      radial-gradient(ellipse at center, transparent 30%, var(--bg-void) 100%)
    `,
    pointerEvents: 'none',
  },

  particleLayer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
  },

  particle: {
    position: 'absolute',
    borderRadius: '50%',
    background: 'var(--arc-blue-bright)',
    boxShadow: '0 0 6px var(--arc-blue), 0 0 12px rgba(79, 195, 247, 0.2)',
    pointerEvents: 'none',
  },
};

export default GridBackground;
