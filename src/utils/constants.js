// JARVIS States
export const JARVIS_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ALERT: 'alert',
};

// Priority colors
export const PRIORITY_COLORS = {
  high: '#FF5252',
  medium: '#FFD740',
  low: '#4FC3F7',
};

// Status colors
export const STATUS_COLORS = {
  pending: '#40C4FF',
  in_progress: '#FFD740',
  done: '#00E676',
  overdue: '#FF5252',
  cancelled: '#757575',
};

// Arc reactor color states
export const REACTOR_COLORS = {
  idle: { primary: '#4FC3F7', intensity: 0.6 },
  listening: { primary: '#4FC3F7', intensity: 1.0 },
  processing: { primary: '#FFD740', intensity: 0.8 },
  speaking: { primary: '#4FC3F7', intensity: 0.9 },
  alert: { primary: '#FFD740', intensity: 1.0 },
};

// Sound effect keys
export const SOUNDS = {
  BOOT: 'boot',
  MIC_ON: 'mic-on',
  MIC_OFF: 'mic-off',
  SPEAK_START: 'speak-start',
  TASK_CREATED: 'task-created',
  TASK_COMPLETED: 'task-completed',
  REMINDER: 'reminder',
  ERROR: 'error',
};

// Keyboard shortcuts
export const SHORTCUTS = {
  TOGGLE_MIC: ' ', // Space
  CANCEL: 'Escape',
  MUTE: 'm',
  NEW_TASK: 'n', // Ctrl+N
};

// API endpoints
export const API = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  TASKS: {
    BASE: '/api/tasks',
    TODAY: '/api/tasks/today',
    UPCOMING: '/api/tasks/upcoming',
    OVERDUE: '/api/tasks/overdue',
    STATS: '/api/tasks/stats',
  },
  CHAT: {
    BASE: '/api/chat',
    HISTORY: '/api/chat/history',
  },
  SYSTEM: {
    HEALTH: '/api/system/health',
    STATUS: '/api/system/status',
  },
};
