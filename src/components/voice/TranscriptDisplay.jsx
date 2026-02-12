import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAssistantStore from '../../store/useAssistantStore';
import { PRIORITY_COLORS, STATUS_COLORS } from '../../utils/constants';

/* ---- Word-by-word reveal for JARVIS messages ---- */
function JarvisText({ text }) {
  const words = (text || '').split(' ');

  return (
    <span>
      {words.map((word, i) => (
        <motion.span
          key={`${i}-${word}`}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: i * 0.06, duration: 0.2, ease: 'easeOut' }}
          style={{ display: 'inline-block', marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ---- Status icons for task list ---- */
const miniStatusIcons = {
  pending: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  in_progress: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  done: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  overdue: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const PRIORITY_SHORT = { high: 'H', medium: 'M', low: 'L' };

/* ---- Action display for task data ---- */
function ActionDisplay({ action }) {
  if (!action) return null;

  const actionType = action.action;

  // Task listed / found — show the task list
  if ((actionType === 'tasks_listed' || actionType === 'tasks_found') && Array.isArray(action.tasks)) {
    if (action.tasks.length === 0) return null;
    return (
      <div
        style={{
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(0, 229, 255, 0.04)',
          border: '1px solid rgba(0, 229, 255, 0.12)',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '8px',
              letterSpacing: '0.1em',
              color: 'var(--hud-cyan)',
              textTransform: 'uppercase',
            }}
          >
            {action.filter ? `${action.filter} tasks` : 'Tasks'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              color: 'var(--hud-white-dim)',
              opacity: 0.5,
            }}
          >
            {action.count} found
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {action.tasks.map((task, i) => {
            const pColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low;
            const sColor = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
            return (
              <div
                key={task.id || i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 8px',
                  background: 'rgba(79, 195, 247, 0.04)',
                  border: '1px solid rgba(79, 195, 247, 0.08)',
                  borderLeft: `2px solid ${pColor}`,
                  borderRadius: '3px',
                }}
              >
                <span style={{ color: sColor, display: 'flex', flexShrink: 0 }}>
                  {miniStatusIcons[task.status] || miniStatusIcons.pending}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: task.status === 'done' ? 'var(--hud-white-dim)' : 'var(--hud-white)',
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    opacity: task.status === 'done' ? 0.5 : 1,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.title}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '7px',
                    color: pColor,
                    background: `${pColor}18`,
                    padding: '1px 4px',
                    borderRadius: '2px',
                    flexShrink: 0,
                  }}
                >
                  {PRIORITY_SHORT[task.priority] || 'M'}
                </span>
                {task.due_date && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '8px',
                      color: task.status === 'overdue' ? 'var(--priority-high)' : 'var(--hud-white-dim)',
                      opacity: 0.6,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.due_date}{task.due_time ? ` ${task.due_time}` : ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Task created — show confirmation
  if (actionType === 'task_created' && action.title) {
    return (
      <div
        style={{
          marginTop: '8px',
          padding: '6px 10px',
          background: 'rgba(0, 230, 118, 0.06)',
          border: '1px solid rgba(0, 230, 118, 0.2)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#00E676' }}>
          Task created: {action.title}
        </span>
      </div>
    );
  }

  // Task completed
  if (actionType === 'task_completed' && action.title) {
    return (
      <div
        style={{
          marginTop: '8px',
          padding: '6px 10px',
          background: 'rgba(0, 230, 118, 0.06)',
          border: '1px solid rgba(0, 230, 118, 0.2)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: '#00E676',
            textDecoration: 'line-through',
            opacity: 0.8,
          }}
        >
          {action.title}
        </span>
      </div>
    );
  }

  // Calendar events listed
  if (actionType === 'calendar_events' && Array.isArray(action.events)) {
    if (action.events.length === 0) return null;
    return (
      <div
        style={{
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(79, 195, 247, 0.04)',
          border: '1px solid rgba(79, 195, 247, 0.12)',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--arc-blue)" strokeWidth="2" style={{ marginRight: '6px' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '8px',
              letterSpacing: '0.1em',
              color: 'var(--arc-blue)',
              textTransform: 'uppercase',
            }}
          >
            Today's Calendar
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {action.events.map((event, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 8px',
                background: 'rgba(79, 195, 247, 0.04)',
                border: '1px solid rgba(79, 195, 247, 0.08)',
                borderLeft: '2px solid var(--arc-blue)',
                borderRadius: '3px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--hud-cyan)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {event.start_time}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: 'var(--hud-white)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.summary}
              </span>
              {event.location && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    color: 'var(--hud-white-dim)',
                    opacity: 0.6,
                    flexShrink: 0,
                  }}
                >
                  {event.location}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Web search results
  if (actionType === 'web_results' && Array.isArray(action.results)) {
    if (action.results.length === 0) return null;
    return (
      <div
        style={{
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(33, 150, 243, 0.04)',
          border: '1px solid rgba(33, 150, 243, 0.12)',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2" style={{ marginRight: '6px' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '8px',
              letterSpacing: '0.1em',
              color: '#2196F3',
              textTransform: 'uppercase',
            }}
          >
            Web Results — {action.query}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {action.results.map((result, i) => {
            let domain = '';
            try { domain = new URL(result.url).hostname.replace('www.', ''); } catch {}
            return (
              <a
                key={i}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '6px 8px',
                  background: 'rgba(33, 150, 243, 0.04)',
                  border: '1px solid rgba(33, 150, 243, 0.08)',
                  borderLeft: '2px solid #2196F3',
                  borderRadius: '3px',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(33, 150, 243, 0.10)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(33, 150, 243, 0.04)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: '#64B5F6',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {result.title}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '8px',
                      color: 'var(--hud-white-dim)',
                      opacity: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    {domain}
                  </span>
                </div>
                {result.snippet && (
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '10px',
                      color: 'var(--hud-white-dim)',
                      opacity: 0.7,
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {result.snippet}
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // Image search results
  if (actionType === 'image_results' && Array.isArray(action.images)) {
    if (action.images.length === 0) return null;
    return (
      <div
        style={{
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(171, 71, 188, 0.04)',
          border: '1px solid rgba(171, 71, 188, 0.12)',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#AB47BC" strokeWidth="2" style={{ marginRight: '6px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '8px',
              letterSpacing: '0.1em',
              color: '#AB47BC',
              textTransform: 'uppercase',
            }}
          >
            Images — {action.query}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px',
          }}
        >
          {action.images.map((img, i) => (
            <a
              key={i}
              href={img.image_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid rgba(171, 71, 188, 0.12)',
                background: 'rgba(0, 0, 0, 0.2)',
                textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(171, 71, 188, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(171, 71, 188, 0.12)'}
            >
              <img
                src={img.thumbnail || img.image_url}
                alt={img.title}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '70px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {img.title && (
                <div
                  style={{
                    padding: '3px 4px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '8px',
                    color: 'var(--hud-white-dim)',
                    opacity: 0.7,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {img.title}
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Task deleted
  if (actionType === 'task_deleted' && action.title) {
    return (
      <div
        style={{
          marginTop: '8px',
          padding: '6px 10px',
          background: 'rgba(255, 82, 82, 0.06)',
          border: '1px solid rgba(255, 82, 82, 0.2)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#FF5252' }}>
          Deleted: {action.title}
        </span>
      </div>
    );
  }

  return null;
}

/* ---- Chat bubble ---- */
function ChatBubble({ entry, isLatest }) {
  const isUser = entry.role === 'user';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
        padding: '0 4px',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isUser
            ? 'rgba(79, 195, 247, 0.12)'
            : 'rgba(0, 229, 255, 0.08)',
          border: `1px solid ${isUser ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 229, 255, 0.15)'}`,
          position: 'relative',
        }}
      >
        {/* Role label */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isUser ? 'var(--arc-blue)' : 'var(--hud-cyan)',
            textShadow: isUser ? 'none' : '0 0 8px rgba(0,229,255,0.3)',
            marginBottom: '4px',
          }}
        >
          {isUser ? 'YOU' : 'JARVIS'}
        </div>

        {/* Message body */}
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            lineHeight: '1.5',
            color: 'var(--hud-white)',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {isUser ? entry.content : (
            isLatest ? <JarvisText text={entry.content} /> : entry.content
          )}
        </div>

        {/* Action data (task lists, confirmations, etc.) */}
        {!isUser && entry.action && <ActionDisplay action={entry.action} />}

        {/* Timestamp */}
        {entry.timestamp && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--hud-white-dim)',
              opacity: 0.4,
              marginTop: '4px',
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {new Date(entry.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---- Blinking cursor ---- */
function BlinkingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
      style={{
        display: 'inline-block',
        width: '7px',
        height: '14px',
        backgroundColor: 'var(--hud-cyan)',
        marginLeft: '2px',
        verticalAlign: 'middle',
        boxShadow: '0 0 6px var(--hud-cyan)',
      }}
    />
  );
}

/* ---- Main Component ---- */
export default function TranscriptDisplay({ onSendMessage }) {
  const transcript = useAssistantStore((s) => s.transcript);
  const interimText = useAssistantStore((s) => s.interimText);
  const scrollRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Find last JARVIS message index for word-by-word animation
  const lastJarvisIdx = (() => {
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (transcript[i].role === 'assistant') return i;
    }
    return -1;
  })();

  // Smart auto-scroll: only scroll if user is near bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 80;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distFromBottom < threshold);
  }, []);

  useEffect(() => {
    if (isNearBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimText, isNearBottom]);

  // Handle text input submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !onSendMessage) return;
    onSendMessage(text);
    setInputText('');
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Prevent space from triggering voice
    e.stopPropagation();
  };

  return (
    <div
      className="glass-panel-chat"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid rgba(0, 229, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'var(--hud-cyan)',
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(0, 229, 255, 0.3)',
          }}
        >
          Communication Log
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--hud-white-dim)',
            opacity: 0.5,
          }}
        >
          {transcript.length} {transcript.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Scrollable messages area */}
      <div
        ref={scrollRef}
        className="chat-scroll-area"
        onScroll={handleScroll}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 8px',
        }}
      >
        {/* Empty state */}
        {transcript.length === 0 && !interimText && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '120px',
              gap: '8px',
              opacity: 0.4,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--hud-cyan)" strokeWidth="1.5">
              <rect x="9" y="1" width="6" height="12" rx="3" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--hud-white-dim)',
              }}
            >
              Press SPACE to speak or type below
            </span>
          </div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {transcript.map((entry, i) => (
            <ChatBubble
              key={entry.id ?? `${entry.role}-${entry.timestamp ?? i}`}
              entry={entry}
              isLatest={i === lastJarvisIdx}
            />
          ))}
        </AnimatePresence>

        {/* Interim (in-progress) text */}
        <AnimatePresence>
          {interimText && (
            <motion.div
              key="interim"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.6, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '0 4px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 4px 14px',
                  background: 'rgba(79, 195, 247, 0.06)',
                  border: '1px solid rgba(79, 195, 247, 0.12)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'var(--arc-blue)',
                    opacity: 0.6,
                    marginBottom: '4px',
                  }}
                >
                  YOU
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    color: 'var(--hud-white-dim)',
                    fontStyle: 'italic',
                  }}
                >
                  {interimText}
                  <BlinkingCursor />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Text input bar */}
      {onSendMessage && (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(0, 229, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="chat-input"
            style={{
              flex: 1,
              background: 'rgba(79, 195, 247, 0.04)',
              border: '1px solid var(--border-hud)',
              borderRadius: '6px',
              padding: '8px 14px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--hud-white)',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!inputText.trim()}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: inputText.trim() ? 'var(--hud-cyan)' : 'var(--hud-white-dim)',
              background: inputText.trim()
                ? 'rgba(0, 229, 255, 0.1)'
                : 'rgba(79, 195, 247, 0.04)',
              border: `1px solid ${inputText.trim() ? 'var(--hud-cyan)' : 'var(--border-hud)'}`,
              borderRadius: '6px',
              cursor: inputText.trim() ? 'pointer' : 'default',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            Send
          </motion.button>
        </form>
      )}
    </div>
  );
}
