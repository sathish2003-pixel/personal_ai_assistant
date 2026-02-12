/**
 * ScanLine - A thin horizontal cyan line that sweeps top to bottom.
 * Repeats every 12 seconds. Very subtle at 0.15 opacity.
 */
function ScanLine() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.line} />

      <style>{`
        @keyframes scan-sweep {
          0% {
            top: -2px;
            opacity: 0;
          }
          3% {
            opacity: 1;
          }
          97% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
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
    zIndex: 1,
    pointerEvents: 'none',
    overflow: 'hidden',
    opacity: 0.15,
  },

  line: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: '2px',
    background: `linear-gradient(
      90deg,
      transparent 0%,
      var(--hud-cyan) 15%,
      var(--hud-cyan) 85%,
      transparent 100%
    )`,
    boxShadow: `
      0 0 8px var(--hud-cyan),
      0 0 20px rgba(0, 229, 255, 0.3),
      0 -4px 12px rgba(0, 229, 255, 0.1),
      0 4px 12px rgba(0, 229, 255, 0.1)
    `,
    animation: 'scan-sweep 12s linear infinite',
  },
};

export default ScanLine;
