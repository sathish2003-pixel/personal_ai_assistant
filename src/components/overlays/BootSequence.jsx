import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BootSequence
 * Full-screen startup animation (~4 seconds total).
 *
 * Timeline:
 *  0.0 - 0.5s  Black screen
 *  0.5 - 1.0s  Grid fades in
 *  1.0 - 2.0s  Arc reactor glow appears and spins up
 *  2.0 - 2.5s  Side panels slide in from edges
 *  2.5 - 3.0s  Status bars fade in (top + bottom)
 *  3.0 - 3.5s  "J.A.R.V.I.S." types out character by character
 *  3.5 - 4.0s  "Systems Online" subtitle fades in
 *  4.0s         Calls onComplete
 */

const TOTAL_DURATION = 4000;
const JARVIS_TEXT = 'J.A.R.V.I.S.';

/* Grid pattern rendered as SVG */
function GridPattern({ opacity }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="boot-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="var(--grid-line, rgba(79,195,247,0.06))"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#boot-grid)" />
      </svg>
    </motion.div>
  );
}

/* Arc reactor glow at center */
function ReactorGlow({ phase }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{
        opacity: phase >= 1 ? 1 : 0,
        scale: phase >= 1 ? 1 : 0.3,
        rotate: phase >= 1 ? 360 : 0,
      }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: '2px solid var(--arc-blue)',
          borderTopColor: 'transparent',
          boxShadow: '0 0 30px rgba(79,195,247,0.4), 0 0 60px rgba(79,195,247,0.15)',
        }}
      />
      {/* Middle ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '1.5px solid var(--hud-cyan)',
          borderBottomColor: 'transparent',
          boxShadow: '0 0 20px rgba(0,229,255,0.3)',
        }}
      />
      {/* Core */}
      <motion.div
        animate={{
          boxShadow: [
            '0 0 20px rgba(79,195,247,0.5), 0 0 40px rgba(79,195,247,0.2)',
            '0 0 40px rgba(79,195,247,0.8), 0 0 80px rgba(79,195,247,0.3)',
            '0 0 20px rgba(79,195,247,0.5), 0 0 40px rgba(79,195,247,0.2)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--hud-cyan) 0%, var(--arc-blue) 50%, transparent 100%)',
        }}
      />
    </motion.div>
  );
}

/* Side panels that slide in from edges */
function SidePanels({ visible }) {
  const panelStyle = {
    position: 'absolute',
    top: '20%',
    width: '3px',
    height: '60%',
    background: 'linear-gradient(to bottom, transparent, var(--arc-blue), transparent)',
    boxShadow: '0 0 12px rgba(79,195,247,0.3)',
  };

  return (
    <>
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={visible ? { x: 0, opacity: 1 } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ ...panelStyle, left: '40px' }}
      >
        {/* Left decorative lines */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`l-${i}`}
            initial={{ scaleX: 0 }}
            animate={visible ? { scaleX: 1 } : {}}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
            style={{
              position: 'absolute',
              left: '6px',
              top: `${25 + i * 25}%`,
              width: '50px',
              height: '1px',
              background: 'var(--arc-blue)',
              transformOrigin: 'left',
              opacity: 0.5,
            }}
          />
        ))}
      </motion.div>
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={visible ? { x: 0, opacity: 1 } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ ...panelStyle, right: '40px' }}
      >
        {/* Right decorative lines */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`r-${i}`}
            initial={{ scaleX: 0 }}
            animate={visible ? { scaleX: 1 } : {}}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
            style={{
              position: 'absolute',
              right: '6px',
              top: `${25 + i * 25}%`,
              width: '50px',
              height: '1px',
              background: 'var(--arc-blue)',
              transformOrigin: 'right',
              opacity: 0.5,
            }}
          />
        ))}
      </motion.div>
    </>
  );
}

/* Status bar (top or bottom) */
function StatusBar({ position, visible }) {
  const isTop = position === 'top';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={visible ? { opacity: 1 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: '80px',
        right: '80px',
        [isTop ? 'top' : 'bottom']: '30px',
        height: '1px',
        background: 'linear-gradient(to right, transparent, var(--border-hud-bright), transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isTop ? 'flex-start' : 'flex-end',
      }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 0.6 } : {}}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          position: 'absolute',
          [isTop ? 'left' : 'right']: '0',
          [isTop ? 'top' : 'bottom']: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: 'var(--arc-blue)',
          letterSpacing: '0.15em',
        }}
      >
        {isTop ? 'SYS.INIT // BOOT_SEQ_v3.2.1' : 'STARK INDUSTRIES // NEURAL INTERFACE'}
      </motion.span>
    </motion.div>
  );
}

/* Typewriter text for "J.A.R.V.I.S." */
function TypewriterTitle({ visible }) {
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!visible) {
      setCharCount(0);
      return;
    }
    if (charCount >= JARVIS_TEXT.length) return;

    const timer = setTimeout(() => {
      setCharCount((c) => c + 1);
    }, 35);
    return () => clearTimeout(timer);
  }, [visible, charCount]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, 60px)',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '0.3em',
          color: 'var(--hud-cyan)',
          textShadow: '0 0 20px rgba(0,229,255,0.5), 0 0 40px rgba(0,229,255,0.2)',
        }}
      >
        {JARVIS_TEXT.slice(0, charCount)}
      </span>
      {charCount < JARVIS_TEXT.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            display: 'inline-block',
            width: '2px',
            height: '24px',
            backgroundColor: 'var(--hud-cyan)',
            marginLeft: '2px',
            verticalAlign: 'middle',
            boxShadow: '0 0 6px var(--hud-cyan)',
          }}
        />
      )}
    </motion.div>
  );
}

/* "Systems Online" subtitle */
function SubtitleText({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, 100px)',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--arc-blue)',
              textShadow: '0 0 10px rgba(79,195,247,0.3)',
            }}
          >
            Systems Online
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- Main BootSequence Component ---- */
export default function BootSequence({ onComplete }) {
  const [phase, setPhase] = useState(0);
  // Phases:
  //   0 = black
  //   1 = grid
  //   2 = reactor
  //   3 = side panels
  //   4 = status bars
  //   5 = title typewriter
  //   6 = subtitle
  //   7 = complete (begin fade-out)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),    // Grid
      setTimeout(() => setPhase(2), 1000),   // Reactor
      setTimeout(() => setPhase(3), 2000),   // Side panels
      setTimeout(() => setPhase(4), 2500),   // Status bars
      setTimeout(() => setPhase(5), 3000),   // Title
      setTimeout(() => setPhase(6), 3500),   // Subtitle
      setTimeout(() => setPhase(7), TOTAL_DURATION), // Complete
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleFadeOutComplete = useCallback(() => {
    if (phase >= 7) {
      onComplete?.();
    }
  }, [phase, onComplete]);

  return (
    <AnimatePresence onExitComplete={handleFadeOutComplete}>
      {phase < 8 && (
        <motion.div
          key="boot-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase >= 7 ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          onAnimationComplete={() => {
            if (phase >= 7) {
              // Give a small extra delay for the fade to feel complete
              setTimeout(() => onComplete?.(), 100);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'var(--bg-void)',
            overflow: 'hidden',
          }}
        >
          {/* Phase 1: Grid */}
          {phase >= 1 && <GridPattern opacity={phase >= 1 ? 0.6 : 0} />}

          {/* Phase 2: Arc reactor glow */}
          {phase >= 2 && <ReactorGlow phase={phase} />}

          {/* Phase 3: Side panels */}
          <SidePanels visible={phase >= 3} />

          {/* Phase 4: Status bars */}
          <StatusBar position="top" visible={phase >= 4} />
          <StatusBar position="bottom" visible={phase >= 4} />

          {/* Phase 5: Typewriter title */}
          <TypewriterTitle visible={phase >= 5} />

          {/* Phase 6: Subtitle */}
          <SubtitleText visible={phase >= 6} />

          {/* Scan line effect */}
          {phase >= 1 && phase < 7 && (
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: '100vh' }}
              transition={{ duration: 2, delay: 0.5, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(to right, transparent, var(--arc-blue), transparent)',
                boxShadow: '0 0 20px rgba(79,195,247,0.3)',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
