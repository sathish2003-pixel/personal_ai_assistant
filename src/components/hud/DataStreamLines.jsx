import { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * DataStreamLines - Animated vertical and horizontal lines with traveling dots.
 * Creates a "data flowing" visual across the HUD.
 * Uses SVG for clean rendering at any resolution.
 */

// Line definitions: paths that data travels along
const LINE_DEFS = [
  // Vertical lines
  { id: 'v1', x1: '12%', y1: '8%',  x2: '12%', y2: '92%', orientation: 'vertical' },
  { id: 'v2', x1: '88%', y1: '5%',  x2: '88%', y2: '95%', orientation: 'vertical' },
  { id: 'v3', x1: '50%', y1: '0%',  x2: '50%', y2: '100%', orientation: 'vertical' },
  // Horizontal lines
  { id: 'h1', x1: '5%',  y1: '25%', x2: '95%', y2: '25%', orientation: 'horizontal' },
  { id: 'h2', x1: '10%', y1: '75%', x2: '90%', y2: '75%', orientation: 'horizontal' },
  // Diagonal connectors
  { id: 'd1', x1: '12%', y1: '25%', x2: '30%', y2: '50%', orientation: 'diagonal' },
  { id: 'd2', x1: '88%', y1: '25%', x2: '70%', y2: '50%', orientation: 'diagonal' },
];

// Traveling dot definitions
const DOT_DEFS = [
  { id: 'dot1', lineId: 'v1', duration: 6, delay: 0 },
  { id: 'dot2', lineId: 'v2', duration: 8, delay: 2 },
  { id: 'dot3', lineId: 'v3', duration: 5, delay: 1 },
  { id: 'dot4', lineId: 'h1', duration: 7, delay: 0.5 },
  { id: 'dot5', lineId: 'h2', duration: 9, delay: 3 },
  { id: 'dot6', lineId: 'd1', duration: 4, delay: 1.5 },
  { id: 'dot7', lineId: 'd2', duration: 4, delay: 4 },
  { id: 'dot8', lineId: 'v1', duration: 6, delay: 3 },
  { id: 'dot9', lineId: 'h1', duration: 7, delay: 4 },
  { id: 'dot10', lineId: 'v2', duration: 8, delay: 5 },
];

function DataStreamLines() {
  const lineMap = useMemo(() => {
    const map = {};
    LINE_DEFS.forEach((l) => { map[l.id] = l; });
    return map;
  }, []);

  return (
    <div style={styles.wrapper}>
      <svg
        style={styles.svg}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow filter for dots */}
          <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Static lines */}
        {LINE_DEFS.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="var(--arc-blue)"
            strokeWidth="0.08"
            opacity="0.12"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Traveling dots */}
        {DOT_DEFS.map((dot) => {
          const line = lineMap[dot.lineId];
          if (!line) return null;

          // Parse percentage values to numbers
          const x1 = parseFloat(line.x1);
          const y1 = parseFloat(line.y1);
          const x2 = parseFloat(line.x2);
          const y2 = parseFloat(line.y2);

          return (
            <motion.circle
              key={dot.id}
              r="0.35"
              fill="var(--hud-cyan)"
              filter="url(#dot-glow)"
              animate={{
                cx: [x1, x2, x1],
                cy: [y1, y2, y1],
                opacity: [0, 0.8, 0.8, 0],
              }}
              transition={{
                duration: dot.duration,
                delay: dot.delay,
                repeat: Infinity,
                ease: 'linear',
                times: [0, 0.05, 0.95, 1],
              }}
            />
          );
        })}

        {/* Small junction dots at line intersections */}
        {LINE_DEFS.map((line) => (
          <circle
            key={`junction-${line.id}`}
            cx={line.x1}
            cy={line.y1}
            r="0.25"
            fill="var(--arc-blue)"
            opacity="0.2"
          />
        ))}
      </svg>
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'fixed',
    inset: 0,
    zIndex: 1,
    pointerEvents: 'none',
    overflow: 'hidden',
  },

  svg: {
    width: '100%',
    height: '100%',
  },
};

export default DataStreamLines;
