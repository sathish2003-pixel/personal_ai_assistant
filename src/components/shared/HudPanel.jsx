import { motion } from 'framer-motion';

const cornerStyle = {
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderColor: 'var(--arc-blue)',
  opacity: 0.6,
};

const corners = {
  topLeft: {
    ...cornerStyle,
    top: -1,
    left: -1,
    borderTop: '2px solid',
    borderLeft: '2px solid',
    borderTopLeftRadius: '2px',
  },
  topRight: {
    ...cornerStyle,
    top: -1,
    right: -1,
    borderTop: '2px solid',
    borderRight: '2px solid',
    borderTopRightRadius: '2px',
  },
  bottomLeft: {
    ...cornerStyle,
    bottom: -1,
    left: -1,
    borderBottom: '2px solid',
    borderLeft: '2px solid',
    borderBottomLeftRadius: '2px',
  },
  bottomRight: {
    ...cornerStyle,
    bottom: -1,
    right: -1,
    borderBottom: '2px solid',
    borderRight: '2px solid',
    borderBottomRightRadius: '2px',
  },
};

const panelVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export default function HudPanel({
  title,
  children,
  className = '',
  cornerDecorations = true,
  style = {},
}) {
  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      className={`hud-panel ${className}`}
      style={{
        position: 'relative',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-hud)',
        borderRadius: '6px',
        padding: '18px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(79, 195, 247, 0.06)',
        ...style,
      }}
    >
      {/* Corner decorations */}
      {cornerDecorations && (
        <>
          <span style={corners.topLeft} />
          <span style={corners.topRight} />
          <span style={corners.bottomLeft} />
          <span style={corners.bottomRight} />
        </>
      )}

      {/* Title bar */}
      {title && (
        <div
          style={{
            marginBottom: '14px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontVariant: 'small-caps',
              letterSpacing: '0.15em',
              color: 'var(--hud-cyan)',
              textTransform: 'uppercase',
              margin: 0,
              textShadow: '0 0 8px rgba(0, 229, 255, 0.3)',
            }}
          >
            {title}
          </h2>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
