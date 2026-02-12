import { useEffect, useState, useCallback, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

// Stores
import useAssistantStore from './store/useAssistantStore';
import useTaskStore from './store/useTaskStore';
import useSettingsStore from './store/useSettingsStore';

// Services
import api from './services/api';
import taskApi from './services/taskApi';

// Hooks
import useWebSocket from './hooks/useWebSocket';
import useSpeechRecognition from './hooks/useSpeechRecognition';
import useSpeechSynthesis from './hooks/useSpeechSynthesis';
import useAudioAnalyser from './hooks/useAudioAnalyser';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useSoundEffects from './hooks/useSoundEffects';
import useWakeWord from './hooks/useWakeWord';

// HUD Background
import GridBackground from './components/hud/GridBackground';
import ScanLine from './components/hud/ScanLine';
import CornerBrackets from './components/hud/CornerBrackets';
import DataStreamLines from './components/hud/DataStreamLines';
import TopStatusBar from './components/hud/TopStatusBar';
import BottomVoiceBar from './components/hud/BottomVoiceBar';

// Arc Reactor
import ArcReactor from './components/arc-reactor/ArcReactor';

// Panels
import TaskPanel from './components/panels/TaskPanel';
import SystemPanel from './components/panels/SystemPanel';

// Voice
import TranscriptDisplay from './components/voice/TranscriptDisplay';

// Overlays
import BootSequence from './components/overlays/BootSequence';
import ReminderAlert from './components/overlays/ReminderAlert';
import SettingsModal from './components/overlays/SettingsModal';
import TaskForm from './components/panels/TaskForm';

function App() {
  const {
    isAuthenticated, isBooted, setBooted, jarvisState, setJarvisState,
    token, user, login, logout, setUser, activeReminder, dismissReminder,
    addTranscriptEntry,
  } = useAssistantStore();

  const { settingsOpen, setSettingsOpen, loadFromPreferences } = useSettingsStore();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);

  // Hooks
  const { sendVoiceInput, sendTaskAction, sendReminderResponse } = useWebSocket();
  const { isListening, isSupported, start: startListening, stop: stopListening } = useSpeechRecognition();
  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis();
  const { isActive: audioActive, start: startAudio, stop: stopAudio, getFrequencyData, getAverageVolume } = useAudioAnalyser();
  const { playSound } = useSoundEffects();

  // Listen for AI responses to speak them
  useEffect(() => {
    const unsub = useAssistantStore.subscribe((state, prev) => {
      const transcript = state.transcript;
      const prevTranscript = prev.transcript;
      if (transcript.length > prevTranscript.length) {
        const latest = transcript[transcript.length - 1];
        if (latest.role === 'assistant' && latest.content) {
          speak(latest.content);
        }
      }
    });
    return unsub;
  }, [speak]);

  // Safety net: auto-reset from 'processing' if stuck for 30s
  useEffect(() => {
    if (jarvisState !== 'processing') return;
    const timeout = setTimeout(() => {
      const current = useAssistantStore.getState().jarvisState;
      if (current === 'processing') {
        console.warn('[Safety] Stuck in processing, resetting to idle');
        setJarvisState('idle');
      }
    }, 30000);
    return () => clearTimeout(timeout);
  }, [jarvisState, setJarvisState]);

  // Safety net: auto-reset from 'listening' if stuck for 10s
  useEffect(() => {
    if (jarvisState !== 'listening') return;
    const timeout = setTimeout(() => {
      const current = useAssistantStore.getState().jarvisState;
      if (current === 'listening') {
        console.warn('[Safety] Stuck in listening, resetting to idle');
        conversationModeRef.current = false;
        stopListening();
        stopAudio();
        setJarvisState('idle');
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [jarvisState, setJarvisState, stopListening, stopAudio]);

  // Track notification permission state
  const [notifPermission, setNotifPermission] = useState(
    () => ('Notification' in window) ? Notification.permission : 'denied'
  );

  // Request Windows notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((result) => {
        setNotifPermission(result);
        if (result === 'granted') {
          // Send a test notification to confirm it works
          new Notification('JARVIS - Notifications Enabled', {
            body: 'You will now receive task reminders on your desktop, sir.',
            icon: '/favicon.svg',
          });
        }
      });
    }
  }, []);

  // Auto-login check
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
          loadFromPreferences(res.data.preferences);
        } catch {
          logout();
        }
      }
    };
    checkAuth();
  }, []);

  // Fetch tasks when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchTasks = async () => {
        try {
          const [todayRes, upcomingRes, overdueRes, statsRes] = await Promise.all([
            taskApi.getToday(),
            taskApi.getUpcoming(),
            taskApi.getOverdue(),
            taskApi.getStats(),
          ]);
          useTaskStore.getState().setTodayTasks(todayRes.data);
          useTaskStore.getState().setUpcomingTasks(upcomingRes.data);
          useTaskStore.getState().setOverdueTasks(overdueRes.data);
          useTaskStore.getState().setStats(statsRes.data);
        } catch (err) {
          console.error('Failed to fetch tasks:', err);
        }
      };
      fetchTasks();
      const interval = setInterval(fetchTasks, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  // Conversation mode: after wake word, mic auto-reopens after AI speaks
  const conversationModeRef = useRef(false);

  // Helper: start mic with conversation-mode awareness
  const startMicConversation = useCallback((withTimeout = false) => {
    const currentState = useAssistantStore.getState().jarvisState;
    if (currentState === 'speaking' || currentState === 'processing' || currentState === 'listening') return;

    // Don't cancel speech here — speech is already done (guard above ensures it)
    // Just start the mic after a brief delay
    setTimeout(() => {
      // Re-check state in case it changed during the delay
      const stateNow = useAssistantStore.getState().jarvisState;
      if (stateNow === 'speaking' || stateNow === 'processing' || stateNow === 'listening') return;

      playSound?.('mic-on');
      startAudio();
      startListening(
        (finalText) => {
          stopAudio();
          setJarvisState('processing');
          sendVoiceInput(finalText);
        },
        {
          ...(withTimeout ? { noSpeechTimeoutMs: 5000 } : {}),
          onTimeout: () => {
            console.log('[Conversation] No speech detected, returning to standby');
            conversationModeRef.current = false;
            stopAudio();
            setJarvisState('idle');
            playSound?.('mic-off');
          },
        }
      );
    }, 150);
  }, [setJarvisState, playSound, startAudio, startListening, stopAudio, sendVoiceInput]);

  // Voice toggle (manual — SPACE / mic button)
  const handleMicToggle = useCallback(() => {
    if (isListening) {
      conversationModeRef.current = false;
      stopListening();
      stopAudio();
      setJarvisState('idle');
      playSound?.('mic-off');
    } else {
      // Manual toggle: cancel any lingering speech, single turn only
      conversationModeRef.current = false;
      cancelSpeech();
      window.speechSynthesis?.cancel();
      startMicConversation(false);
    }
  }, [isListening, stopListening, stopAudio, setJarvisState, playSound, cancelSpeech, startMicConversation]);

  // Wake word detection — "Hey Jarvis", "Hi buddy", etc.
  useWakeWord({
    enabled: isAuthenticated && isBooted,
    onWake: useCallback(() => {
      console.log('[WakeWord] Activating conversation mode');
      conversationModeRef.current = true;
      startMicConversation(false); // First turn: no timeout, user just woke JARVIS
    }, [startMicConversation]),
  });

  // Auto-reopen mic after AI finishes speaking (conversation mode)
  useEffect(() => {
    const unsub = useAssistantStore.subscribe((state, prev) => {
      if (
        prev.jarvisState === 'speaking' &&
        state.jarvisState === 'idle' &&
        conversationModeRef.current
      ) {
        console.log('[Conversation] AI done speaking, reopening mic with 5s timeout');
        // Wait for speech synthesis to fully release audio, then reopen mic
        setTimeout(() => {
          if (conversationModeRef.current) {
            startMicConversation(true);
          }
        }, 800);
      }
    });
    return unsub;
  }, [startMicConversation]);

  // Text input handler (wired to same pipeline as voice)
  const handleTextInput = useCallback((text) => {
    if (!text.trim()) return;
    addTranscriptEntry({
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    });
    setJarvisState('processing');
    sendVoiceInput(text.trim());
  }, [addTranscriptEntry, setJarvisState, sendVoiceInput]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleMic: handleMicToggle,
    onCancel: () => {
      conversationModeRef.current = false;
      if (isListening) { stopListening(); stopAudio(); }
      if (isSpeaking) cancelSpeech();
      setJarvisState('idle');
    },
    onMute: () => {
      const store = useSettingsStore.getState();
      store.setSoundsEnabled(!store.soundsEnabled);
    },
    onNewTask: () => setShowTaskForm(true),
  });

  // Auth handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        await api.post('/api/auth/register', authForm);
        toast.success('Account created! Logging in...');
      }
      const loginPayload = {
        username: authForm.username,
        password: authForm.password,
      };
      if (authForm.email) loginPayload.email = authForm.email;
      const res = await api.post('/api/auth/login', loginPayload);
      login(res.data.access_token, res.data.refresh_token, null);
      // Fetch user profile
      const userRes = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      setUser(userRes.data);
      loadFromPreferences(userRes.data.preferences);
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = 'Authentication failed';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || String(d)).join(', ');
      }
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Task form submit
  const handleTaskCreate = async (taskData) => {
    try {
      // Clean up payload — remove empty strings, default recurrence
      const payload = {
        title: taskData.title,
        ...(taskData.description ? { description: taskData.description } : {}),
        ...(taskData.due_date ? { due_date: taskData.due_date } : {}),
        ...(taskData.due_time ? { due_time: taskData.due_time } : {}),
        priority: taskData.priority || 'medium',
        recurrence: taskData.recurrence || 'none',
        tags: Array.isArray(taskData.tags) ? taskData.tags : [],
      };
      const res = await taskApi.create(payload);
      useTaskStore.getState().addTask(res.data);
      playSound?.('task-created');
      setShowTaskForm(false);

      // JARVIS announces the task creation
      const timeInfo = payload.due_time ? ` at ${payload.due_time}` : '';
      const dateInfo = payload.due_date ? ` on ${payload.due_date}` : '';
      const jarvisMsg = `Task "${payload.title}" has been created${dateInfo}${timeInfo}, sir. I'll keep track of it for you.`;
      addTranscriptEntry({
        role: 'assistant',
        content: jarvisMsg,
        emotion: 'happy',
        timestamp: new Date().toISOString(),
      });

      // Refresh task lists
      const [todayRes, statsRes] = await Promise.all([
        taskApi.getToday(),
        taskApi.getStats(),
      ]);
      useTaskStore.getState().setTodayTasks(todayRes.data);
      useTaskStore.getState().setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  // Prime speech synthesis on first user interaction (unlocks Chrome autoplay policy)
  useEffect(() => {
    if (!isAuthenticated) return;
    let primed = false;
    const primeTTS = () => {
      if (primed) return;
      primed = true;
      if (window.speechSynthesis) {
        const silent = new SpeechSynthesisUtterance('');
        silent.volume = 0;
        window.speechSynthesis.speak(silent);
        console.log('[TTS] Speech synthesis primed');
      }
      window.removeEventListener('click', primeTTS);
      window.removeEventListener('keydown', primeTTS);
      window.removeEventListener('touchstart', primeTTS);
    };
    window.addEventListener('click', primeTTS);
    window.addEventListener('keydown', primeTTS);
    window.addEventListener('touchstart', primeTTS);
    return () => {
      window.removeEventListener('click', primeTTS);
      window.removeEventListener('keydown', primeTTS);
      window.removeEventListener('touchstart', primeTTS);
    };
  }, [isAuthenticated]);

  // Boot sequence complete
  const handleBootComplete = () => {
    setBooted(true);
    playSound?.('boot');
    // Also prime TTS here since boot completion is user-initiated
    if (window.speechSynthesis) {
      const silent = new SpeechSynthesisUtterance('');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
  };

  // Not authenticated — show login screen
  if (!isAuthenticated || !token) {
    return (
      <div className="w-screen h-screen overflow-hidden relative flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
        <GridBackground />
        <div className="glass-panel p-8 w-96 relative z-10">
          <h1 className="font-display text-2xl tracking-widest text-center mb-6" style={{ color: 'var(--arc-blue)' }}>
            J.A.R.V.I.S.
          </h1>
          <p className="font-mono text-xs text-center mb-6" style={{ color: 'var(--hud-cyan-dim)' }}>
            {authMode === 'login' ? 'IDENTITY VERIFICATION REQUIRED' : 'NEW USER REGISTRATION'}
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={authForm.username}
              onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
              required
              className="w-full bg-transparent border-b px-3 py-2 text-sm font-body outline-none"
              style={{ borderColor: 'var(--border-hud)', color: 'var(--hud-white)' }}
            />
            {authMode === 'register' && (
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
                className="w-full bg-transparent border-b px-3 py-2 text-sm font-body outline-none"
                style={{ borderColor: 'var(--border-hud)', color: 'var(--hud-white)' }}
              />
            )}
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              required
              minLength={6}
              className="w-full bg-transparent border-b px-3 py-2 text-sm font-body outline-none"
              style={{ borderColor: 'var(--border-hud)', color: 'var(--hud-white)' }}
            />
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2 font-display text-sm tracking-widest uppercase transition-all"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--arc-blue)',
                color: 'var(--arc-blue)',
                cursor: authLoading ? 'wait' : 'pointer',
              }}
            >
              {authLoading ? 'VERIFYING...' : authMode === 'login' ? 'AUTHENTICATE' : 'REGISTER'}
            </button>
          </form>
          <p
            className="text-center mt-4 text-xs font-mono cursor-pointer"
            style={{ color: 'var(--hud-cyan-dim)' }}
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          >
            {authMode === 'login' ? 'CREATE NEW IDENTITY' : 'EXISTING USER? LOGIN'}
          </p>
        </div>
        <Toaster theme="dark" position="top-right" />
      </div>
    );
  }

  // Boot sequence
  if (!isBooted) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  // Main HUD
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: 'var(--bg-void)' }}>
      {/* Background layers */}
      <GridBackground />
      <ScanLine />
      <CornerBrackets />
      <DataStreamLines />

      {/* Top status bar */}
      <TopStatusBar onSettingsClick={() => setSettingsOpen(true)} />

      {/* Notification permission banner */}
      {notifPermission !== 'granted' && notifPermission !== 'denied' && (
        <div
          style={{
            position: 'fixed',
            top: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            background: 'var(--bg-panel)',
            border: '1px solid var(--hud-gold)',
            borderRadius: 4,
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 20px rgba(255,215,64,0.15)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--hud-gold)' }}>
            Enable desktop notifications for task reminders
          </span>
          <button
            onClick={async () => {
              if ('Notification' in window) {
                const result = await Notification.requestPermission();
                setNotifPermission(result);
                if (result === 'granted') {
                  new Notification('JARVIS - Notifications Enabled', {
                    body: 'Desktop reminders are now active, sir.',
                    icon: '/favicon.svg',
                  });
                }
              }
            }}
            style={{
              padding: '4px 14px',
              fontSize: 10,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              letterSpacing: '1px',
              color: 'var(--hud-gold)',
              background: 'rgba(255,215,64,0.1)',
              border: '1px solid var(--hud-gold)',
              borderRadius: 3,
              cursor: 'pointer',
            }}
          >
            ENABLE
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="absolute inset-0 flex" style={{ top: '46px', bottom: '68px' }}>
        {/* Left Panel - Tasks */}
        <div
          className="hud-side-panel flex-shrink-0 p-3 overflow-y-auto"
          style={{ width: 'clamp(260px, 22vw, 320px)', scrollbarWidth: 'thin' }}
        >
          <TaskPanel onNewTask={() => setShowTaskForm(true)} />
        </div>

        {/* Center - Arc Reactor + Chat */}
        <div className="flex-1 flex flex-col items-center min-w-0" style={{ padding: '8px 12px 0' }}>
          {/* Arc Reactor - pinned top, shrinkable */}
          <div style={{ flexShrink: 0 }}>
            <ArcReactor
              jarvisState={jarvisState}
              audioData={getFrequencyData}
              size={280}
            />
          </div>

          {/* Chat - fills remaining space */}
          <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: '600px', marginTop: '4px' }}>
            <TranscriptDisplay onSendMessage={handleTextInput} />
          </div>
        </div>

        {/* Right Panel - System */}
        <div
          className="hud-side-panel flex-shrink-0 p-3 overflow-y-auto"
          style={{ width: 'clamp(260px, 20vw, 300px)', scrollbarWidth: 'thin' }}
        >
          <SystemPanel />
        </div>
      </div>

      {/* Bottom voice bar */}
      <BottomVoiceBar
        isListening={isListening}
        jarvisState={jarvisState}
        onMicToggle={handleMicToggle}
        getFrequencyData={getFrequencyData}
        audioActive={audioActive}
      />

      {/* Overlays */}
      <AnimatePresence>
        {activeReminder && (
          <ReminderAlert
            reminder={activeReminder}
            onComplete={async (taskId) => {
              try {
                await taskApi.updateStatus(taskId, 'done');
                sendTaskAction('complete', taskId);
                dismissReminder();
                playSound?.('task-completed');
                addTranscriptEntry({
                  role: 'assistant',
                  content: `Well done, sir. Task "${activeReminder.title}" has been marked as complete.`,
                  emotion: 'happy',
                  timestamp: new Date().toISOString(),
                });
                // Refresh tasks
                const [todayRes, statsRes] = await Promise.all([
                  taskApi.getToday(), taskApi.getStats(),
                ]);
                useTaskStore.getState().setTodayTasks(todayRes.data);
                useTaskStore.getState().setStats(statsRes.data);
              } catch {
                toast.error('Failed to complete task');
              }
            }}
            onAcknowledge={() => {
              sendReminderResponse('acknowledge', activeReminder.task_id);
              dismissReminder();
            }}
            onSnooze={() => {
              sendReminderResponse('snooze', activeReminder.task_id);
              dismissReminder();
            }}
            onDismiss={dismissReminder}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTaskForm && (
          <TaskForm
            isOpen={showTaskForm}
            onClose={() => setShowTaskForm(false)}
            onSubmit={handleTaskCreate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-hud)',
            color: 'var(--hud-white)',
            fontFamily: 'var(--font-body)',
          },
        }}
      />
    </div>
  );
}

export default App;
