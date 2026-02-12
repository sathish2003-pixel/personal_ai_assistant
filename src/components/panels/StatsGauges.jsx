import { motion } from 'framer-motion';

const GAUGE_SIZE = 100;
const STROKE_WIDTH = 6;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function StatsGauges({ stats = {} }) {
  const {
    completed_today = 0,
    total_today = 0,
    overdue_count = 0,
    completion_rate = 0,
  } = stats;

  const rate = Math.min(Math.max(completion_rate, 0), 100);
  const strokeDashoffset = CIRCUMFERENCE - (rate / 100) * CIRCUMFERENCE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* Circular gauge */}
      <div style={{ position: 'relative', width: GAUGE_SIZE, height: GAUGE_SIZE }}>
        <svg
          width={GAUGE_SIZE}
          height={GAUGE_SIZE}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background track */}
          <circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(79, 195, 247, 0.1)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Animated arc */}
          <motion.circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--arc-blue)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(79, 195, 247, 0.5))',
            }}
          />
        </svg>

        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--arc-blue)',
              lineHeight: 1,
              textShadow: '0 0 10px rgba(79, 195, 247, 0.4)',
            }}
          >
            {Math.round(rate)}
          </motion.span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '8px',
              color: 'var(--hud-white-dim)',
              letterSpacing: '0.1em',
              marginTop: '2px',
            }}
          >
            %
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <StatItem
          label="Done"
          value={completed_today}
          color="var(--status-success)"
          delay={0.4}
        />
        <StatItem
          label="Total"
          value={total_today}
          color="var(--arc-blue)"
          delay={0.5}
        />
        <StatItem
          label="Overdue"
          value={overdue_count}
          color="var(--priority-high)"
          delay={0.6}
        />
      </div>
    </div>
  );
}

function StatItem({ label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          fontWeight: 700,
          color,
          lineHeight: 1,
          textShadow: `0 0 8px ${color}40`,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '8px',
          color: 'var(--hud-white-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          opacity: 0.6,
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}
