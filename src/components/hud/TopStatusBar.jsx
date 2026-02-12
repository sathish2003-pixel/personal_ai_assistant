import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import useAssistantStore from '../../store/useAssistantStore';
import useTaskStore from '../../store/useTaskStore';

/**
 * TopStatusBar - Fixed top bar with system info.
 * Left: "J.A.R.V.I.S. v1.0" in Orbitron
 * Center: Current date
 * Right: Live clock + connection status dot
 */

const STATUS_COLORS = {
  connected: '#00E676',
  reconnecting: '#FFD740',
  disconnected: '#FF5252',
};

const STATUS_LABELS = {
  connected: 'ONLINE',
  reconnecting: 'RECONNECTING',
  disconnected: 'OFFLINE',
};

function formatDate() {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();
}

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function TopStatusBar({ onSettingsClick }) {
  const connectionStatus = useAssistantStore((s) => s.connectionStatus);
  const newSession = useAssistantStore((s) => s.newSession);
  const taskStats = useTaskStore((s) => s.stats);
  const todayCount = useTaskStore((s) => s.todayTasks.length);
  const [time, setTime] = useState(formatTime);
  const [date, setDate] = useState(formatDate);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTime());
      setDate(formatDate());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = STATUS_COLORS[connectionStatus] || STATUS_COLORS.disconnected;
  const statusLabel = STATUS_LABELS[connectionStatus] || STATUS_LABELS.disconnected;

  return (
    <div style={styles.bar}>
      {/* Left Section: JARVIS branding + actions */}
      <div style={{ ...styles.section, flex: 'none' }}>
        <span style={styles.brand}>J.A.R.V.I.S.</span>
        <span style={styles.version}>v1.0</span>
        <div style={styles.separator} />
        <motion.button
          onClick={() => {
            newSession();
            useAssistantStore.getState().addTranscriptEntry({
              role: 'assistant',
              content: 'New session initialized, sir. My memory has been cleared. How may I assist you?',
              timestamp: new Date().toISOString(),
            });
          }}
          whileHover={{
            scale: 1.05,
            backgroundColor: 'rgba(79, 195, 247, 0.15)',
            borderColor: 'rgba(79, 195, 247, 0.5)',
            boxShadow: '0 0 10px rgba(79, 195, 247, 0.2)',
          }}
          whileTap={{ scale: 0.95 }}
          style={styles.actionButton}
          title="Start a new conversation session"
        >
          NEW SESSION
        </motion.button>
        <motion.button
          onClick={async () => {
            if (!('Notification' in window)) {
              alert('Your browser does not support notifications');
              return;
            }
            if (Notification.permission !== 'granted') {
              const result = await Notification.requestPermission();
              if (result !== 'granted') {
                alert('Notification permission denied. Please enable it in browser settings:\n\n1. Click the lock icon in the address bar\n2. Set Notifications to "Allow"\n3. Refresh the page');
                return;
              }
            }
            new Notification('JARVIS - Test Notification', {
              body: 'Desktop notifications are working correctly, sir.',
              icon: '/favicon.svg',
              requireInteraction: false,
            });
          }}
          whileHover={{
            scale: 1.05,
            backgroundColor: 'rgba(79, 195, 247, 0.15)',
            borderColor: 'rgba(79, 195, 247, 0.5)',
            boxShadow: '0 0 10px rgba(79, 195, 247, 0.2)',
          }}
          whileTap={{ scale: 0.95 }}
          style={styles.actionButton}
          title="Test Windows desktop notification"
        >
          TEST NOTIF
        </motion.button>
        {onSettingsClick && (
          <motion.button
            onClick={onSettingsClick}
            whileHover={{
              scale: 1.05,
              backgroundColor: 'rgba(79, 195, 247, 0.15)',
              borderColor: 'rgba(79, 195, 247, 0.5)',
              boxShadow: '0 0 10px rgba(79, 195, 247, 0.2)',
            }}
            whileTap={{ scale: 0.95 }}
            style={styles.actionButton}
            title="Settings"
          >
            SETTINGS
          </motion.button>
        )}
        {/* Missions Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            background: 'rgba(0, 229, 255, 0.06)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '3px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '9px',
              letterSpacing: '0.8px',
              color: 'var(--hud-cyan)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            MISSIONS: {todayCount}
          </span>
          {(taskStats.overdue_count ?? 0) > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: '#FF5252',
                background: 'rgba(255, 82, 82, 0.15)',
                padding: '1px 5px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 82, 82, 0.3)',
              }}
            >
              {taskStats.overdue_count} LATE
            </span>
          )}
        </div>
      </div>

      {/* Separator */}
      <div style={styles.separator} />

      {/* Center Section: Date */}
      <div style={{ ...styles.section, ...styles.centerSection }}>
        <span style={styles.date}>{date}</span>
      </div>

      {/* Separator */}
      <div style={styles.separator} />

      {/* Right Section: Clock + Connection Status */}
      <div style={{ ...styles.section, justifyContent: 'flex-end' }}>
        <span style={styles.clock}>{time}</span>
        <div style={styles.statusGroup}>
          <div style={styles.separator} />
          <motion.div
            style={{
              ...styles.statusDot,
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}, 0 0 12px ${statusColor}40`,
            }}
            animate={{
              opacity: connectionStatus === 'reconnecting' ? [1, 0.4, 1] : 1,
              scale: connectionStatus === 'reconnecting' ? [1, 0.8, 1] : 1,
            }}
            transition={{
              duration: 1.2,
              repeat: connectionStatus === 'reconnecting' ? Infinity : 0,
              ease: 'easeInOut',
            }}
          />
          <span style={{
            ...styles.statusLabel,
            color: statusColor,
          }}>
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 46,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    background: 'var(--bg-panel)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-hud)',
    fontFamily: 'var(--font-mono)',
  },

  section: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
  },

  centerSection: {
    justifyContent: 'center',
  },

  brand: {
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--arc-blue-bright)',
    letterSpacing: '2px',
    textShadow: '0 0 10px rgba(79, 195, 247, 0.4)',
  },

  version: {
    fontSize: 10,
    color: 'var(--arc-blue-dim)',
    letterSpacing: '1px',
    marginLeft: 4,
    opacity: 0.7,
  },

  separator: {
    width: 1,
    height: 20,
    background: 'var(--border-hud)',
    flexShrink: 0,
    marginLeft: 8,
    marginRight: 8,
  },

  actionButton: {
    padding: '4px 10px',
    fontSize: 10,
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    letterSpacing: '1px',
    color: 'var(--arc-blue)',
    background: 'rgba(79, 195, 247, 0.08)',
    border: '1px solid var(--border-hud)',
    borderRadius: 3,
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'all 0.2s',
    outline: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  date: {
    fontSize: 12,
    color: 'var(--hud-white)',
    letterSpacing: '1.5px',
    opacity: 0.8,
  },

  clock: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--hud-cyan)',
    letterSpacing: '2px',
    fontFamily: 'var(--font-mono)',
    textShadow: '0 0 8px rgba(0, 229, 255, 0.3)',
  },

  statusGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },

  statusLabel: {
    fontSize: 10,
    letterSpacing: '1.5px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
  },
};

export default TopStatusBar;
