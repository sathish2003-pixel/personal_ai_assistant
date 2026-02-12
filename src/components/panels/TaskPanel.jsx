import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HudPanel from '../shared/HudPanel';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import taskApi from '../../services/taskApi';
import useTaskStore from '../../store/useTaskStore';
import useAssistantStore from '../../store/useAssistantStore';

const REFRESH_INTERVAL = 60_000;

const TABS = [
  { key: 'today', label: 'TODAY', color: '#4FC3F7' },
  { key: 'upcoming', label: 'UPCOMING', color: '#FFD740' },
  { key: 'overdue', label: 'OVERDUE', color: '#FF5252' },
  { key: 'all', label: 'ALL', color: '#00E5FF' },
];

const EMPTY_STATES = {
  today: {
    message: 'All clear for today, sir. No active missions.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="1.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    glowColor: 'rgba(79, 195, 247, 0.2)',
  },
  upcoming: {
    message: 'No upcoming missions scheduled.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD740" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    glowColor: 'rgba(255, 215, 64, 0.2)',
  },
  overdue: {
    message: 'No overdue tasks. Excellent discipline, sir.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    glowColor: 'rgba(0, 230, 118, 0.2)',
  },
  all: {
    message: 'No tasks found. Create your first mission.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    glowColor: 'rgba(0, 229, 255, 0.2)',
  },
};

function ProgressRing({ rate, size = 28, strokeWidth = 2.5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(79, 195, 247, 0.12)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#4FC3F7"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderRadius: '10px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '7px',
          letterSpacing: '0.08em',
          color: 'var(--hud-white-dim)',
          opacity: 0.6,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function TaskPanel({ onNewTask }) {
  const {
    todayTasks,
    upcomingTasks,
    overdueTasks,
    allTasks,
    stats,
    activeTab,
    searchQuery,
    setTodayTasks,
    setUpcomingTasks,
    setOverdueTasks,
    setAllTasks,
    setStats,
    setLoading,
    setActiveTab,
    setSearchQuery,
    updateTask,
    removeTask,
  } = useTaskStore();

  const { isAuthenticated } = useAssistantStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allFetched, setAllFetched] = useState(false);
  const searchRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [todayRes, upcomingRes, overdueRes, statsRes] = await Promise.all([
        taskApi.getToday(),
        taskApi.getUpcoming(7),
        taskApi.getOverdue(),
        taskApi.getStats(),
      ]);
      setTodayTasks(todayRes.data?.tasks ?? todayRes.data ?? []);
      setUpcomingTasks(upcomingRes.data?.tasks ?? upcomingRes.data ?? []);
      setOverdueTasks(overdueRes.data?.tasks ?? overdueRes.data ?? []);
      setStats(statsRes.data ?? {});
    } catch (err) {
      console.error('[TaskPanel] Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setTodayTasks, setUpcomingTasks, setOverdueTasks, setStats, setLoading]);

  const fetchAllTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await taskApi.list();
      setAllTasks(res.data?.tasks ?? res.data ?? []);
      setAllFetched(true);
    } catch (err) {
      console.error('[TaskPanel] Failed to fetch all tasks:', err);
    }
  }, [isAuthenticated, setAllTasks]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Lazy-fetch all tasks when ALL tab is selected
  useEffect(() => {
    if (activeTab === 'all' && !allFetched) {
      fetchAllTasks();
    }
  }, [activeTab, allFetched, fetchAllTasks]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const currentTabTasks = useMemo(() => {
    switch (activeTab) {
      case 'today': return todayTasks;
      case 'upcoming': return upcomingTasks;
      case 'overdue': return overdueTasks;
      case 'all': return allTasks;
      default: return todayTasks;
    }
  }, [activeTab, todayTasks, upcomingTasks, overdueTasks, allTasks]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return currentTabTasks;
    const q = searchQuery.toLowerCase();
    return currentTabTasks.filter((t) => {
      const title = (t.title || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const tags = Array.isArray(t.tags) ? t.tags.join(' ').toLowerCase() : '';
      return title.includes(q) || desc.includes(q) || tags.includes(q);
    });
  }, [currentTabTasks, searchQuery]);

  const tabCounts = useMemo(() => ({
    today: todayTasks.length,
    upcoming: upcomingTasks.length,
    overdue: overdueTasks.length,
    all: allTasks.length,
  }), [todayTasks, upcomingTasks, overdueTasks, allTasks]);

  const handleComplete = async (taskId) => {
    try {
      const res = await taskApi.updateStatus(taskId, 'done');
      updateTask(res.data);
      const statsRes = await taskApi.getStats();
      setStats(statsRes.data ?? {});
    } catch (err) {
      console.error('[TaskPanel] Complete task failed:', err);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingTask) {
        await taskApi.update(editingTask.id, formData);
      } else {
        await taskApi.create(formData);
      }
      setFormOpen(false);
      setEditingTask(null);
      setAllFetched(false);
      fetchTasks();
    } catch (err) {
      console.error('[TaskPanel] Form submit failed:', err);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTask(null);
  };

  const completionRate = stats.completion_rate ?? 0;

  return (
    <>
      <HudPanel
        title="TASK COMMAND CENTER"
        cornerDecorations
        style={{ width: '320px', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Stats Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            marginBottom: '10px',
            background: 'rgba(79, 195, 247, 0.04)',
            borderRadius: '3px',
            border: '1px solid rgba(79, 195, 247, 0.08)',
            height: '36px',
          }}
        >
          <ProgressRing rate={completionRate} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--arc-blue)',
              opacity: 0.7,
              marginRight: 'auto',
            }}
          >
            {Math.round(completionRate)}%
          </span>
          <StatPill label="DONE" value={stats.completed_today ?? 0} color="#00E676" />
          <StatPill label="TOTAL" value={stats.total_today ?? 0} color="#4FC3F7" />
          <StatPill label="LATE" value={stats.overdue_count ?? 0} color="#FF5252" />
        </div>

        {/* Tab Bar */}
        <div
          style={{
            display: 'flex',
            gap: '2px',
            marginBottom: '10px',
            position: 'relative',
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  position: 'relative',
                  padding: '6px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '8px',
                      letterSpacing: '0.08em',
                      color: isActive ? tab.color : 'var(--hud-white-dim)',
                      opacity: isActive ? 1 : 0.5,
                      transition: 'color 0.2s, opacity 0.2s',
                    }}
                  >
                    {tab.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '8px',
                      padding: '0px 4px',
                      borderRadius: '6px',
                      background: isActive ? `${tab.color}25` : 'rgba(255,255,255,0.05)',
                      color: isActive ? tab.color : 'var(--hud-white-dim)',
                      opacity: isActive ? 1 : 0.4,
                      transition: 'all 0.2s',
                    }}
                  >
                    {tabCounts[tab.key]}
                  </span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '10%',
                      right: '10%',
                      height: '2px',
                      background: tab.color,
                      borderRadius: '1px',
                      boxShadow: `0 0 8px ${tab.color}80`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.button
            onClick={() => {
              setSearchOpen((prev) => !prev);
              if (searchOpen) setSearchQuery('');
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '24px',
              height: '24px',
              background: searchOpen ? 'rgba(79, 195, 247, 0.12)' : 'none',
              border: '1px solid var(--border-hud)',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: 0,
              transition: 'background 0.2s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--arc-blue)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </motion.button>
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden', flex: 1 }}
              >
                <input
                  ref={searchRef}
                  className="task-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search missions..."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Task List */}
        <div
          className="task-list-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '2px',
            minHeight: 0,
          }}
        >
          <AnimatePresence mode="popLayout">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onEdit={handleEdit}
                />
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 16px',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: EMPTY_STATES[activeTab]?.glowColor || 'rgba(79,195,247,0.1)',
                    boxShadow: `0 0 20px ${EMPTY_STATES[activeTab]?.glowColor || 'rgba(79,195,247,0.1)'}`,
                  }}
                >
                  {EMPTY_STATES[activeTab]?.icon}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--hud-white-dim)',
                    opacity: 0.6,
                    textAlign: 'center',
                    lineHeight: '1.5',
                  }}
                >
                  {searchQuery.trim()
                    ? 'No missions match your search.'
                    : EMPTY_STATES[activeTab]?.message}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* + NEW MISSION button */}
        <motion.button
          onClick={() => {
            if (onNewTask) {
              onNewTask();
            } else {
              setEditingTask(null);
              setFormOpen(true);
            }
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: '0 0 16px rgba(0, 229, 255, 0.25)',
          }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            padding: '10px 0',
            marginTop: '10px',
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            color: 'var(--hud-cyan)',
            background: 'rgba(0, 229, 255, 0.06)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            borderRadius: '3px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'background 0.2s, border-color 0.2s',
            outline: 'none',
            flexShrink: 0,
          }}
        >
          + NEW MISSION
        </motion.button>
      </HudPanel>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editTask={editingTask}
      />
    </>
  );
}
