import { create } from 'zustand';
import { JARVIS_STATES } from '../utils/constants';

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const useAssistantStore = create((set, get) => ({
  // JARVIS state
  jarvisState: JARVIS_STATES.IDLE,
  setJarvisState: (state) => set({ jarvisState: state }),

  // Connection
  connectionStatus: 'disconnected', // 'connected', 'disconnected', 'reconnecting'
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // Session
  sessionId: generateSessionId(),
  newSession: () => {
    const newId = generateSessionId();
    set({ sessionId: newId, transcript: [], interimText: '', currentResponse: '' });
    return newId;
  },

  // Transcript
  transcript: [],
  interimText: '',
  setInterimText: (text) => set({ interimText: text }),
  addTranscriptEntry: (entry) =>
    set((state) => ({
      transcript: [...state.transcript.slice(-50), entry],
    })),
  clearTranscript: () => set({ transcript: [], interimText: '' }),

  // Current response
  currentResponse: '',
  setCurrentResponse: (text) => set({ currentResponse: text }),

  // Reminder alerts
  activeReminder: null,
  setActiveReminder: (reminder) => set({ activeReminder: reminder }),
  dismissReminder: () => set({ activeReminder: null }),

  // Boot state
  isBooted: false,
  setBooted: (booted) => set({ isBooted: booted }),

  // Auth
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('jarvis_token') || null,
  refreshToken: localStorage.getItem('jarvis_refresh_token') || null,

  login: (token, refreshToken, user) => {
    localStorage.setItem('jarvis_token', token);
    localStorage.setItem('jarvis_refresh_token', refreshToken);
    set({ isAuthenticated: true, token, refreshToken, user });
  },

  logout: () => {
    localStorage.removeItem('jarvis_token');
    localStorage.removeItem('jarvis_refresh_token');
    set({ isAuthenticated: false, token: null, refreshToken: null, user: null });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));

export default useAssistantStore;
