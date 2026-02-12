import { motion } from 'framer-motion';

/**
 * CornerBrackets - Angular L-shaped bracket decorations at all 4 corners.
 * Features a subtle pulse animation on the border color.
 */

const BRACKET_SIZE = 40;
const BRACKET_THICKNESS = 2;
const BRACKET_OFFSET = 16;

const corners = [
  { id: 'top-left', top: BRACKET_OFFSET, left: BRACKET_OFFSET, borderDirs: ['Top', 'Left'] },
  { id: 'top-right', top: BRACKET_OFFSET, right: BRACKET_OFFSET, borderDirs: ['Top', 'Right'] },
  { id: 'bottom-left', bottom: BRACKET_OFFSET, left: BRACKET_OFFSET, borderDirs: ['Bottom', 'Left'] },
  { id: 'bottom-right', bottom: BRACKET_OFFSET, right: BRACKET_OFFSET, borderDirs: ['Bottom', 'Right'] },
];

function CornerBrackets() {
  return (
    <div style={styles.wrapper}>
      {corners.map((corner) => {
        const position = {};
        if (corner.top !== undefined) position.top = corner.top;
        if (corner.bottom !== undefined) position.bottom = corner.bottom;
        if (corner.left !== undefined) position.left = corner.left;
        if (corner.right !== undefined) position.right = corner.right;

        const borderStyle = {};
        corner.borderDirs.forEach((dir) => {
          borderStyle[`border${dir}Width`] = BRACKET_THICKNESS;
          borderStyle[`border${dir}Style`] = 'solid';
        });

        return (
          <motion.div
            key={corner.id}
            style={{
              ...styles.bracket,
              ...position,
              ...borderStyle,
            }}
            animate={{
              borderColor: [
                'rgba(79, 195, 247, 0.5)',
                'rgba(79, 195, 247, 0.9)',
                'rgba(79, 195, 247, 0.5)',
              ],
              boxShadow: [
                '0 0 4px rgba(79, 195, 247, 0.1)',
                '0 0 10px rgba(79, 195, 247, 0.25)',
                '0 0 4px rgba(79, 195, 247, 0.1)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'fixed',
    inset: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },

  bracket: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderColor: 'var(--border-hud-bright)',
  },
};

export default CornerBrackets;
