import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatDateTime } from '../../utils/dateUtils';
import { PRIORITY_COLORS, STATUS_COLORS } from '../../utils/constants';

const statusIcons = {
  pending: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  in_progress: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  done: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  overdue: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const priorityLabels = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

const STATUS_LABELS = {
  pending: 'PENDING',
  in_progress: 'ACTIVE',
  done: 'DONE',
  overdue: 'LATE',
};

const RECURRENCE_SHORT = {
  daily: 'DAI',
  weekly: 'WEK',
  monthly: 'MON',
};

const cardVariants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16, transition: { duration: 0.2 } },
};

function getRelativeTime(due_date, due_time) {
  if (!due_date) return null;
  const now = new Date();
  const dueStr = due_time ? `${due_date}T${due_time}` : `${due_date}T23:59:59`;
  const due = new Date(dueStr);
  const diffMs = due - now;
  const diffH = diffMs / (1000 * 60 * 60);
  const diffD = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs < 0) {
    const absDays = Math.abs(Math.ceil(diffD));
    if (absDays === 0) return { text: 'overdue', color: '#FF5252' };
    return { text: `${absDays}d overdue`, color: '#FF5252' };
  }
  if (diffH < 1) return { text: 'soon', color: '#FF5252' };
  if (diffH < 24) return { text: `in ${Math.round(diffH)}h`, color: '#FFD740' };
  if (diffD < 2) return { text: 'tomorrow', color: '#FFD740' };
  if (diffD < 7) return { text: `in ${Math.round(diffD)}d`, color: '#4FC3F7' };
  return { text: `in ${Math.round(diffD)}d`, color: 'var(--hud-white-dim)' };
}

export default function TaskCard({ task, onComplete, onEdit }) {
  const [completing, setCompleting] = useState(false);
  const {
    id,
    title,
    description,
    due_date,
    due_time,
    priority = 'low',
    status = 'pending',
    tags = [],
    recurrence,
  } = task;

  const borderColor = PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const isDone = status === 'done';
  const isOverdue = status === 'overdue';

  const relativeTime = useMemo(
    () => getRelativeTime(due_date, due_time),
    [due_date, due_time]
  );

  const handleCheckClick = async (e) => {
    e.stopPropagation();
    if (isDone || completing) return;
    setCompleting(true);
    try {
      await onComplete?.(id);
    } catch {
      setCompleting(false);
    }
  };

  const handleCardClick = () => {
    onEdit?.(task);
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      whileHover={{
        y: -2,
        boxShadow: `0 0 16px ${borderColor}40`,
        background: 'var(--bg-glass-hover)',
      }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      style={{
        position: 'relative',
        background: isDone ? 'rgba(0, 230, 118, 0.04)' : 'var(--bg-glass)',
        border: '1px solid var(--border-hud)',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: '3px',
        padding: '12px 16px',
        cursor: 'pointer',
        transition: 'background 0.2s, box-shadow 0.2s',
        ...(isOverdue
          ? { animation: 'overdue-pulse 2s ease-in-out infinite' }
          : {}),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Checkbox */}
        <motion.button
          onClick={handleCheckClick}
          whileTap={{ scale: 0.85 }}
          style={{
            flexShrink: 0,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: `2px solid ${isDone || completing ? 'var(--status-success)' : borderColor}`,
            background: isDone || completing ? 'var(--status-success)' : 'transparent',
            cursor: isDone ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '2px',
            transition: 'background 0.3s, border-color 0.3s',
            padding: 0,
          }}
        >
          {(isDone || completing) && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0a0a0f"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </motion.button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span
              style={{
                color: isOverdue ? 'var(--priority-high)' : statusColor,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {statusIcons[status] || statusIcons.pending}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '7px',
                letterSpacing: '0.06em',
                color: statusColor,
                background: `${statusColor}15`,
                padding: '1px 4px',
                borderRadius: '2px',
                flexShrink: 0,
              }}
            >
              {STATUS_LABELS[status] || 'PENDING'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 600,
                color: isDone ? 'var(--hud-white-dim)' : 'var(--hud-white)',
                textDecoration: isDone ? 'line-through' : 'none',
                opacity: isDone ? 0.5 : 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </span>
          </div>

          {/* Description */}
          {description && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'var(--hud-white-dim)',
                opacity: 0.6,
                margin: '0 0 6px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {description}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Date & time */}
            {(due_date || due_time) && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: isOverdue ? 'var(--priority-high)' : 'var(--hud-white-dim)',
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatDateTime(due_date, due_time)}
              </span>
            )}

            {/* Relative time badge */}
            {relativeTime && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8px',
                  color: relativeTime.color,
                  background: `${relativeTime.color}15`,
                  padding: '1px 5px',
                  borderRadius: '2px',
                  border: `1px solid ${relativeTime.color}30`,
                }}
              >
                {relativeTime.text}
              </span>
            )}

            {/* Priority badge */}
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '8px',
                letterSpacing: '0.08em',
                color: borderColor,
                background: `${borderColor}18`,
                border: `1px solid ${borderColor}40`,
                padding: '1px 6px',
                borderRadius: '2px',
                textTransform: 'uppercase',
              }}
            >
              {priorityLabels[priority] || priority}
            </span>

            {/* Recurring badge */}
            {recurrence && recurrence !== 'none' && recurrence !== '' && (
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '8px',
                  letterSpacing: '0.06em',
                  color: 'var(--hud-gold)',
                  background: 'rgba(255, 215, 64, 0.1)',
                  border: '1px solid rgba(255, 215, 64, 0.25)',
                  padding: '1px 5px',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {RECURRENCE_SHORT[recurrence] || recurrence.slice(0, 3).toUpperCase()}
              </span>
            )}

            {/* Tags */}
            {Array.isArray(tags) &&
              tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    color: 'var(--hud-cyan)',
                    background: 'rgba(0, 229, 255, 0.08)',
                    border: '1px solid rgba(0, 229, 255, 0.2)',
                    padding: '1px 5px',
                    borderRadius: '2px',
                  }}
                >
                  #{tag}
                </span>
              ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
