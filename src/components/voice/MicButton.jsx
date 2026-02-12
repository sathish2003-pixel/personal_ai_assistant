import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MicButton
 * Circular microphone toggle button with animated glow rings,
 * ripple click feedback, and hover effects.
 */

const SIZE = 56;
const RING_COUNT = 3;

/* Simple SVG microphone icon */
function MicIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mic body */}
      <rect
        x="9"
        y="2"
        width="6"
        height="12"
        rx="3"
        fill={color}
      />
      {/* Cradle */}
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Stand */}
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="22"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Base */}
      <line
        x1="9"
        y1="22"
        x2="15"
        y2="22"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MicButton({ isListening = false, onClick }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = useCallback(
    (e) => {
      // Spawn ripple
      const id = Date.now();
      setRipples((prev) => [...prev, id]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r !== id));
      }, 600);

      onClick?.(e);
    },
    [onClick]
  );

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      style={{
        position: 'relative',
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        borderRadius: '50%',
        border: `2px solid ${
          isListening
            ? 'var(--hud-cyan)'
            : 'var(--border-hud-bright)'
        }`,
        background: isListening
          ? 'rgba(0, 229, 255, 0.08)'
          : 'var(--bg-panel)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        padding: 0,
        overflow: 'visible',
        transition: 'border-color 0.25s ease, background 0.25s ease',
        boxShadow: isListening
          ? '0 0 16px rgba(0,229,255,0.35), 0 0 4px rgba(0,229,255,0.2) inset'
          : '0 0 8px rgba(79,195,247,0.1)',
      }}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      {/* Pulsing glow rings when listening */}
      <AnimatePresence>
        {isListening &&
          Array.from({ length: RING_COUNT }).map((_, i) => (
            <motion.span
              key={`ring-${i}`}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.8,
                delay: i * 0.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '1.5px solid var(--hud-cyan)',
                pointerEvents: 'none',
              }}
            />
          ))}
      </AnimatePresence>

      {/* Ripple effects on click */}
      <AnimatePresence>
        {ripples.map((id) => (
          <motion.span
            key={id}
            initial={{ scale: 0.3, opacity: 0.6 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,229,255,0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Mic icon */}
      <motion.div
        animate={{
          filter: isListening
            ? [
                'drop-shadow(0 0 4px rgba(0,229,255,0.6))',
                'drop-shadow(0 0 8px rgba(0,229,255,0.9))',
                'drop-shadow(0 0 4px rgba(0,229,255,0.6))',
              ]
            : 'drop-shadow(0 0 2px rgba(79,195,247,0.3))',
        }}
        transition={
          isListening
            ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
        style={{ position: 'relative', zIndex: 2 }}
      >
        <MicIcon
          color={isListening ? 'var(--hud-cyan)' : 'var(--arc-blue)'}
        />
      </motion.div>
    </motion.button>
  );
}
