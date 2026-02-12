import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

// Event type configuration
const eventTypeConfig = {
  completed: {
    color: 'var(--status-success)',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  created: {
    color: 'var(--arc-blue)',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  reminder: {
    color: 'var(--hud-gold)',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  updated: {
    color: 'var(--hud-cyan)',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  deleted: {
    color: 'var(--priority-high)',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
};

// Mock data fallback
const mockActivities = [
  { id: 1, type: 'completed', description: 'Mission "Deploy v2.1" completed', timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: 2, type: 'created', description: 'New task "Review PRs" created', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: 3, type: 'reminder', description: 'Reminder: Team standup in 15 min', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 4, type: 'completed', description: 'Task "Update docs" marked done', timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 5, type: 'updated', description: 'Priority changed on "DB Migration"', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 6, type: 'created', description: 'New task "Security audit" created', timestamp: new Date(Date.now() - 3600000).toISOString() },
];

const entryVariants = {
  initial: { opacity: 0, y: -10, height: 0 },
  animate: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: 10,
    height: 0,
    transition: { duration: 0.2 },
  },
};

function formatTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapEventType(eventType) {
  if (!eventType) return 'created';
  if (eventType.includes('completed') || eventType.includes('done')) return 'completed';
  if (eventType.includes('created') || eventType.includes('register')) return 'created';
  if (eventType.includes('reminder')) return 'reminder';
  if (eventType.includes('updated') || eventType.includes('changed') || eventType.includes('login')) return 'updated';
  if (eventType.includes('cancelled') || eventType.includes('deleted')) return 'deleted';
  return 'created';
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get('/api/system/activity', { params: { limit: 10 } });
        const raw = res.data ?? [];
        // Map backend event_type to frontend type
        const mapped = raw.map((a) => ({
          id: a.id,
          type: mapEventType(a.event_type),
          description: a.description,
          timestamp: a.created_at,
        }));
        setActivities(mapped);
      } catch {
        // Fallback to mock data if endpoint not available
        setActivities(mockActivities);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to newest
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        paddingRight: '4px',
        maxHeight: '200px',
      }}
    >
      <AnimatePresence mode="popLayout">
        {activities.map((activity) => {
          const config = eventTypeConfig[activity.type] || eventTypeConfig.created;

          return (
            <motion.div
              key={activity.id}
              variants={entryVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '6px 4px',
                borderBottom: '1px solid rgba(79, 195, 247, 0.06)',
              }}
            >
              {/* Icon */}
              <span
                style={{
                  color: config.color,
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {config.icon}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    color: 'var(--hud-white)',
                    margin: 0,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activity.description}
                </p>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--hud-white-dim)',
                    opacity: 0.5,
                  }}
                >
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {activities.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--hud-white-dim)',
            opacity: 0.4,
          }}
        >
          No recent activity.
        </div>
      )}
    </div>
  );
}
