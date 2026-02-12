import { motion, AnimatePresence } from 'framer-motion';
import useAssistantStore from '../../store/useAssistantStore';
import { JARVIS_STATES } from '../../utils/constants';

/**
 * BottomVoiceBar - Fixed bottom bar with mic controls, shortcuts, and state indicator.
 *
 * Props:
 *  - isListening: boolean - whether the mic is actively capturing
 *  - jarvisState: string - current JARVIS state from constants
 *  - onMicToggle: () => void - callback when mic button is clicked
 */

const STATE_CONFIG = {
  [JARVIS_STATES.IDLE]: {
    label: 'STANDBY',
    color: 'var(--arc-blue-dim)',
    dotColor: 'var(--arc-blue)',
  },
  [JARVIS_STATES.LISTENING]: {
    label: 'LISTENING',
    color: 'var(--hud-cyan)',
    dotColor: '#00E5FF',
  },
  [JARVIS_STATES.PROCESSING]: {
    label: 'PROCESSING',
    color: 'var(--hud-gold)',
    dotColor: '#FFD740',
  },
  [JARVIS_STATES.SPEAKING]: {
    label: 'SPEAKING',
    color: 'var(--arc-blue-bright)',
    dotColor: '#81D4FA',
  },
  [JARVIS_STATES.ALERT]: {
    label: 'ALERT',
    color: 'var(--status-error)',
    dotColor: '#FF5252',
  },
};

const SHORTCUTS = [
  { key: 'SPACE', action: 'Talk' },
  { key: 'ESC', action: 'Cancel' },
  { key: 'M', action: 'Mute' },
];

function BottomVoiceBar({ isListening = false, jarvisState = JARVIS_STATES.IDLE, onMicToggle }) {
  const stateConfig = STATE_CONFIG[jarvisState] || STATE_CONFIG[JARVIS_STATES.IDLE];

  return (
    <div style={styles.bar}>
      {/* Left Section: Keyboard shortcuts */}
      <div style={styles.section}>
        <div style={styles.shortcutsRow}>
          {SHORTCUTS.map((shortcut, i) => (
            <div key={shortcut.key} style={styles.shortcutItem}>
              <kbd style={styles.kbd}>{shortcut.key}</kbd>
              <span style={styles.shortcutLabel}>{shortcut.action}</span>
              {i < SHORTCUTS.length - 1 && <div style={styles.shortcutDivider} />}
            </div>
          ))}
        </div>
      </div>

      {/* Center Section: Mic button + status */}
      <div style={{ ...styles.section, ...styles.centerSection }}>
        <div style={styles.micContainer}>
          {/* Sonar ring when listening */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                style={styles.sonarRing}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            )}
          </AnimatePresence>

          {/* Mic button */}
          <motion.button
            style={{
              ...styles.micButton,
              borderColor: isListening ? 'var(--hud-cyan)' : 'var(--border-hud-bright)',
              boxShadow: isListening
                ? '0 0 16px rgba(0, 229, 255, 0.4), inset 0 0 8px rgba(0, 229, 255, 0.1)'
                : '0 0 8px rgba(79, 195, 247, 0.15)',
              background: isListening
                ? 'rgba(0, 229, 255, 0.1)'
                : 'var(--bg-panel)',
            }}
            onClick={onMicToggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            animate={isListening ? {
              borderColor: ['rgba(0, 229, 255, 0.9)', 'rgba(0, 229, 255, 0.5)', 'rgba(0, 229, 255, 0.9)'],
            } : {}}
            transition={isListening ? {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            } : {}}
          >
            {/* Mic SVG icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isListening ? 'var(--hud-cyan)' : 'var(--arc-blue-bright)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="1" width="6" height="12" rx="3" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </motion.button>
        </div>

        {/* Voice status text */}
        <motion.span
          style={styles.voiceStatus}
          key={isListening ? 'listening' : 'idle'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isListening ? 'Listening...' : 'Say "Hey Jarvis" or press SPACE'}
        </motion.span>
      </div>

      {/* Right Section: JARVIS state indicator */}
      <div style={{ ...styles.section, justifyContent: 'flex-end' }}>
        <div style={styles.stateIndicator}>
          <span style={styles.statePrefix}>STATE:</span>
          <motion.div
            style={{
              ...styles.stateDot,
              background: stateConfig.dotColor,
              boxShadow: `0 0 6px ${stateConfig.dotColor}, 0 0 12px ${stateConfig.dotColor}40`,
            }}
            animate={
              jarvisState === JARVIS_STATES.PROCESSING
                ? { opacity: [1, 0.3, 1] }
                : jarvisState === JARVIS_STATES.LISTENING
                  ? { scale: [1, 1.3, 1] }
                  : {}
            }
            transition={{
              duration: jarvisState === JARVIS_STATES.PROCESSING ? 0.8 : 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span style={{
            ...styles.stateLabel,
            color: stateConfig.color,
            textShadow: `0 0 8px ${stateConfig.dotColor}40`,
          }}>
            {stateConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: 'var(--bg-panel)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderTop: '1px solid var(--border-hud)',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
  },

  section: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  centerSection: {
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 2,
  },

  /* Shortcuts */
  shortcutsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },

  shortcutItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },

  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 6px',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color: 'var(--arc-blue-bright)',
    background: 'rgba(79, 195, 247, 0.08)',
    border: '1px solid var(--border-hud)',
    borderRadius: 3,
    lineHeight: 1,
    letterSpacing: '0.5px',
    minWidth: 24,
    textAlign: 'center',
  },

  shortcutLabel: {
    fontSize: 10,
    color: 'var(--hud-white)',
    opacity: 0.5,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.5px',
    marginRight: 4,
  },

  shortcutDivider: {
    width: 1,
    height: 14,
    background: 'var(--border-hud)',
    marginLeft: 4,
    marginRight: 4,
  },

  /* Mic */
  micContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sonarRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '1px solid var(--hud-cyan)',
    pointerEvents: 'none',
  },

  micButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid var(--border-hud-bright)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'background 0.2s ease',
    outline: 'none',
    zIndex: 1,
  },

  voiceStatus: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: 'var(--hud-white)',
    opacity: 0.6,
    letterSpacing: '1px',
    textAlign: 'center',
  },

  /* State indicator */
  stateIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  statePrefix: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    color: 'var(--hud-white)',
    opacity: 0.4,
    letterSpacing: '1.5px',
  },

  stateDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },

  stateLabel: {
    fontSize: 13,
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    letterSpacing: '2px',
  },
};

export default BottomVoiceBar;
