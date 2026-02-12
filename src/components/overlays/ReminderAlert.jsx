import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRIORITY_COLORS } from '../../utils/constants';
import useAssistantStore from '../../store/useAssistantStore';

/**
 * ReminderAlert
 * Holographic reminder notification card that slides in from the right.
 * - Amber border glow on screen edge
 * - Card: task title, due time, priority badge, reminder message
 * - Buttons: ACKNOWLEDGE (cyan) and SNOOZE (gold)
 * - Auto-dismiss after 30 seconds
 * - Glass panel styling with particle dissolve exit animation
 *
 * Props:
 *   reminder: { task_id, title, description, due_time, priority, message }
 *   onAcknowledge: () => void
 *   onSnooze: () => void
 *   onDismiss: () => void
 */

// No auto-dismiss — popup stays until user takes action

function PriorityBadge({ priority }) {
  const color = PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        fontSize: '9px',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: color,
        border: `1px solid ${color}`,
        borderRadius: '2px',
        background: `${color}15`,
      }}
    >
      {priority || 'normal'}
    </span>
  );
}

function formatDueTime(due_time) {
  if (!due_time) return '--:--';
  try {
    const d = new Date(due_time);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return due_time;
  }
}

/* Dissolve particles for exit animation */
const particleVariants = {
  exit: {
    opacity: 0,
    scale: 0.8,
    filter: 'blur(8px)',
    transition: { duration: 0.5, ease: 'easeIn' },
  },
};

const VOICE_LOOP_INTERVAL = 20000; // Repeat voice every 20 seconds
const NOTIF_LOOP_INTERVAL = 30000; // Repeat Windows notification every 30 seconds

// Request notification permission
async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  // Ask for permission
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Send a native Windows notification
async function sendWindowsNotification(reminder) {
  if (!('Notification' in window)) {
    console.warn('[Notif] Notification API not supported');
    return;
  }

  const permitted = await ensureNotificationPermission();
  if (!permitted) {
    console.warn('[Notif] Permission not granted. Current:', Notification.permission);
    return;
  }

  const timeStr = reminder.due_time || '';
  const priorityMap = { high: 'HIGH PRIORITY', medium: 'MEDIUM PRIORITY', low: 'LOW PRIORITY' };
  const priorityTag = priorityMap[reminder.priority] || '';

  const title = reminder.is_due_now
    ? 'JARVIS - Task Due Now!'
    : 'JARVIS - Reminder';

  const body = [
    reminder.title,
    timeStr ? `Due: ${timeStr}` : '',
    priorityTag,
    reminder.description || '',
  ].filter(Boolean).join('\n');

  try {
    // Use unique tag each time so Windows shows a fresh toast (not silent replace)
    const notif = new Notification(title, {
      body,
      icon: `${window.location.origin}/favicon.svg`,
      tag: `jarvis-${reminder.task_id}-${Date.now()}`,
      silent: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    // Auto-close after 10 seconds to avoid notification pile-up
    setTimeout(() => {
      try { notif.close(); } catch {}
    }, 10000);

    console.log('[Notif] Windows notification sent:', title);
  } catch (e) {
    console.warn('[Notif] Failed to send:', e);
  }
}

export default function ReminderAlert({
  reminder,
  onAcknowledge,
  onSnooze,
  onDismiss,
  onComplete,
}) {
  const voiceLoopRef = useRef(null);
  const notifLoopRef = useRef(null);

  // Voice + Windows notification loop
  useEffect(() => {
    if (!reminder) return;

    const speakReminder = () => {
      const synth = window.speechSynthesis;
      if (!synth) return;
      if (synth.speaking) return;

      const timeStr = reminder.due_time || '';
      const msg = reminder.is_due_now
        ? `Sir, attention please. It's time for your task: ${reminder.title}. Scheduled for ${timeStr}. Please begin now.`
        : `Reminder: ${reminder.title} is due at ${timeStr} today.`;

      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      useAssistantStore.getState().setJarvisState('speaking');
      utterance.onend = () => {
        useAssistantStore.getState().setJarvisState('alert');
      };
      utterance.onerror = () => {
        useAssistantStore.getState().setJarvisState('alert');
      };
      synth.speak(utterance);
    };

    // Fire immediately on mount
    speakReminder();
    sendWindowsNotification(reminder);

    // Voice repeats every 20s
    voiceLoopRef.current = setInterval(speakReminder, VOICE_LOOP_INTERVAL);
    // Windows notification repeats every 30s
    notifLoopRef.current = setInterval(() => sendWindowsNotification(reminder), NOTIF_LOOP_INTERVAL);

    return () => {
      if (voiceLoopRef.current) clearInterval(voiceLoopRef.current);
      if (notifLoopRef.current) clearInterval(notifLoopRef.current);
      window.speechSynthesis?.cancel();
      useAssistantStore.getState().setJarvisState('idle');
    };
  }, [reminder]);

  const stopVoiceLoop = useCallback(() => {
    if (voiceLoopRef.current) clearInterval(voiceLoopRef.current);
    if (notifLoopRef.current) clearInterval(notifLoopRef.current);
    window.speechSynthesis?.cancel();
    useAssistantStore.getState().setJarvisState('idle');
  }, []);

  const handleAcknowledge = useCallback(() => {
    stopVoiceLoop();
    onAcknowledge?.();
  }, [onAcknowledge]);

  const handleSnooze = useCallback(() => {
    stopVoiceLoop();
    onSnooze?.();
  }, [onSnooze]);

  return (
    <AnimatePresence>
      {reminder && (
        <>
          {/* Amber edge glow on right side of screen */}
          <motion.div
            key="edge-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '4px',
              height: '100vh',
              background: 'linear-gradient(to bottom, transparent, var(--hud-gold), transparent)',
              boxShadow: '0 0 30px rgba(255,215,64,0.4), 0 0 60px rgba(255,215,64,0.15)',
              zIndex: 44,
              pointerEvents: 'none',
            }}
          />

          {/* Card */}
          <motion.div
            key="reminder-card"
            initial={{ x: 400, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={particleVariants.exit}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 24,
              opacity: { duration: 0.3 },
            }}
            style={{
              position: 'fixed',
              top: '80px',
              right: '24px',
              width: '360px',
              zIndex: 45,
              background: 'var(--bg-panel)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-hud-gold)',
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow:
                '0 0 20px rgba(255,215,64,0.15), 0 4px 30px rgba(0,0,0,0.4)',
            }}
          >
            {/* Top accent bar */}
            <div
              style={{
                height: '2px',
                background:
                  'linear-gradient(to right, transparent, var(--hud-gold), transparent)',
              }}
            />

            {/* Header */}
            <div
              style={{
                padding: '14px 18px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {/* Bell icon */}
                <motion.svg
                  animate={{
                    rotate: [0, 15, -15, 10, -10, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3,
                    ease: 'easeInOut',
                  }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: 'var(--hud-gold)' }}
                >
                  <path
                    d="M12 2C10.343 2 9 3.343 9 5v1.17A6.002 6.002 0 006 12v4l-2 2v1h16v-1l-2-2v-4a6.002 6.002 0 00-3-5.83V5c0-1.657-1.343-3-3-3z"
                    fill="currentColor"
                    opacity="0.8"
                  />
                  <path
                    d="M14 21h-4a2 2 0 004 0z"
                    fill="currentColor"
                  />
                </motion.svg>

                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--hud-gold)',
                    textShadow: '0 0 8px rgba(255,215,64,0.3)',
                  }}
                >
                  REMINDER
                </span>
              </div>

              <PriorityBadge priority={reminder.priority} />
            </div>

            {/* Body */}
            <div style={{ padding: '0 18px 14px' }}>
              {/* Title */}
              <h3
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--hud-white)',
                  margin: '0 0 6px',
                  lineHeight: 1.3,
                }}
              >
                {reminder.title}
              </h3>

              {/* Due time */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: 'var(--arc-blue)' }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M12 6v6l4 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--arc-blue)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {formatDueTime(reminder.due_time)}
                </span>
              </div>

              {/* Message */}
              {reminder.message && (
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'var(--hud-white-dim)',
                    margin: '0 0 4px',
                    lineHeight: 1.5,
                  }}
                >
                  {reminder.message}
                </p>
              )}

              {/* Description */}
              {reminder.description && (
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'rgba(224,247,250,0.5)',
                    margin: '0 0 8px',
                    lineHeight: 1.4,
                    padding: '6px 8px',
                    background: 'rgba(79, 195, 247, 0.05)',
                    borderLeft: '2px solid var(--arc-blue-dim)',
                    borderRadius: '0 3px 3px 0',
                  }}
                >
                  {reminder.description}
                </p>
              )}

              {/* Tags */}
              {reminder.tags && reminder.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {reminder.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--hud-cyan)',
                        padding: '1px 6px',
                        border: '1px solid var(--border-hud)',
                        borderRadius: '2px',
                        background: 'rgba(0, 229, 255, 0.05)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Due now indicator */}
              {reminder.is_due_now && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    marginTop: '8px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: 'var(--status-error)',
                    textShadow: '0 0 8px rgba(255, 82, 82, 0.4)',
                  }}
                >
                  TASK TIME NOW — ACTION REQUIRED
                </motion.div>
              )}
            </div>

            {/* Divider */}
            <div
              style={{
                height: '1px',
                margin: '0 18px',
                background:
                  'linear-gradient(to right, transparent, var(--border-hud), transparent)',
              }}
            />

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '12px 18px',
              }}
            >
              {/* Complete Task button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  stopVoiceLoop();
                  onComplete?.(reminder.task_id);
                }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: '1px solid var(--status-success)',
                  borderRadius: '3px',
                  background: 'rgba(0,230,118,0.08)',
                  color: 'var(--status-success)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 8px rgba(0,230,118,0.15)',
                }}
              >
                Complete
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAcknowledge}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: '1px solid var(--hud-cyan)',
                  borderRadius: '3px',
                  background: 'rgba(0,229,255,0.08)',
                  color: 'var(--hud-cyan)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'background 0.2s, box-shadow 0.2s',
                  boxShadow: '0 0 8px rgba(0,229,255,0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,229,255,0.15)';
                  e.currentTarget.style.boxShadow = '0 0 14px rgba(0,229,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,229,255,0.08)';
                  e.currentTarget.style.boxShadow = '0 0 8px rgba(0,229,255,0.15)';
                }}
              >
                Acknowledge
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSnooze}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: '1px solid var(--hud-gold)',
                  borderRadius: '3px',
                  background: 'rgba(255,215,64,0.08)',
                  color: 'var(--hud-gold)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'background 0.2s, box-shadow 0.2s',
                  boxShadow: '0 0 8px rgba(255,215,64,0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,215,64,0.15)';
                  e.currentTarget.style.boxShadow = '0 0 14px rgba(255,215,64,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,215,64,0.08)';
                  e.currentTarget.style.boxShadow = '0 0 8px rgba(255,215,64,0.1)';
                }}
              >
                Snooze
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
