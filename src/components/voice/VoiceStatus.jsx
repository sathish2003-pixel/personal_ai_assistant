import { motion, AnimatePresence } from 'framer-motion';
import { JARVIS_STATES } from '../../utils/constants';

/**
 * VoiceStatus
 * Text indicator showing current voice state with animated transitions.
 * Uses Orbitron font, small-caps, letter-spacing.
 */

const STATE_CONFIG = {
  [JARVIS_STATES.IDLE]: {
    label: 'READY',
    color: 'var(--hud-cyan-dim)',
    glow: 'none',
    animation: null,
  },
  [JARVIS_STATES.LISTENING]: {
    label: 'LISTENING...',
    color: 'var(--hud-cyan)',
    glow: '0 0 10px rgba(0,229,255,0.5)',
    animation: 'blink',
  },
  [JARVIS_STATES.PROCESSING]: {
    label: 'PROCESSING',
    color: 'var(--hud-gold)',
    glow: '0 0 10px rgba(255,215,64,0.4)',
    animation: 'dots',
  },
  [JARVIS_STATES.SPEAKING]: {
    label: 'RESPONDING...',
    color: 'var(--arc-blue-bright)',
    glow: '0 0 10px rgba(129,212,250,0.4)',
    animation: null,
  },
  [JARVIS_STATES.ALERT]: {
    label: 'ALERT',
    color: 'var(--hud-gold)',
    glow: '0 0 14px rgba(255,215,64,0.6)',
    animation: 'flash',
  },
};

/* Spinning dots indicator for processing state */
function SpinningDots({ color }) {
  return (
    <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '6px', verticalAlign: 'middle' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1,
            delay: i * 0.25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            display: 'inline-block',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
      ))}
    </span>
  );
}

export default function VoiceStatus({ jarvisState = JARVIS_STATES.IDLE }) {
  const config = STATE_CONFIG[jarvisState] || STATE_CONFIG[JARVIS_STATES.IDLE];

  // Determine animation variants
  let textAnimate = { opacity: 1 };
  let textTransition = { duration: 0.3 };

  if (config.animation === 'blink') {
    textAnimate = { opacity: [1, 0.3, 1] };
    textTransition = { duration: 1.5, repeat: Infinity, ease: 'easeInOut' };
  } else if (config.animation === 'flash') {
    textAnimate = { opacity: [1, 0.2, 1] };
    textTransition = { duration: 0.6, repeat: Infinity, ease: 'easeInOut' };
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '24px',
        userSelect: 'none',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={jarvisState}
          initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <motion.span
            animate={textAnimate}
            transition={textTransition}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 700,
              fontVariant: 'small-caps',
              letterSpacing: '0.2em',
              color: config.color,
              textShadow: config.glow,
            }}
          >
            {config.label}
          </motion.span>

          {config.animation === 'dots' && (
            <SpinningDots color={config.color} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
