/**
 * HexPattern - Subtle hexagonal grid pattern SVG overlay.
 * Very low opacity (0.04) for a texture feel on panels.
 * Can be used as a full-screen background or inside a panel.
 *
 * Props:
 *  - opacity: number (default 0.04)
 *  - className: string
 *  - style: object
 */

function HexPattern({ opacity = 0.04, className = '', style = {} }) {
  // Hexagon dimensions
  const hexWidth = 60;
  const hexHeight = 52; // approx hexWidth * sin(60deg) * 2
  const patternWidth = hexWidth * 1.5;
  const patternHeight = hexHeight;

  // Flat-top hexagon points centered at (0,0) with radius ~26
  const r = 26;
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = r * Math.cos(angle);
    const py = r * Math.sin(angle);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  const hexPoints = points.join(' ');

  return (
    <div
      className={className}
      style={{
        ...styles.wrapper,
        opacity,
        ...style,
      }}
    >
      <svg
        style={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="hex-pattern"
            x="0"
            y="0"
            width={patternWidth}
            height={patternHeight}
            patternUnits="userSpaceOnUse"
          >
            {/* First hex */}
            <polygon
              points={hexPoints}
              transform={`translate(${hexWidth / 2}, ${hexHeight / 2})`}
              fill="none"
              stroke="var(--arc-blue)"
              strokeWidth="0.6"
            />
            {/* Second hex offset to tile properly */}
            <polygon
              points={hexPoints}
              transform={`translate(${hexWidth * 1.25}, ${hexHeight})`}
              fill="none"
              stroke="var(--arc-blue)"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#hex-pattern)"
        />
      </svg>
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },

  svg: {
    width: '100%',
    height: '100%',
  },
};

export default HexPattern;
