import { useEffect, useState, useCallback, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

// Stores
import useAssistantStore from '../store/useAssistantStore';
import useTaskStore from '../store/useTaskStore';
import useSettingsStore from '../store/useSettingsStore';

// Services
import taskApi from '../services/taskApi';

// Hooks
import useWebSocket from '../hooks/useWebSocket';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useAudioAnalyser from '../hooks/useAudioAnalyser';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import useSoundEffects from '../hooks/useSoundEffects';
import useWakeWord from '../hooks/useWakeWord';

// HUD Background
import GridBackground from './hud/GridBackground';
import ScanLine from './hud/ScanLine';
import CornerBrackets from './hud/CornerBrackets';
import DataStreamLines from './hud/DataStreamLines';
import TopStatusBar from './hud/TopStatusBar';
import BottomVoiceBar from './hud/BottomVoiceBar';

// Arc Reactor
import ArcReactor from './arc-reactor/ArcReactor';

// Panels
import TaskPanel from './panels/TaskPanel';
import SystemPanel from './panels/SystemPanel';

// Voice
import TranscriptDisplay from './voice/TranscriptDisplay';

// Overlays
import ReminderAlert from './overlays/ReminderAlert';
import SettingsModal from './overlays/SettingsModal';
import TaskForm from './panels/TaskForm';

/**
 * JarvisHUD — the full main interface.
 * Only loaded AFTER authentication + boot sequence.
 * This keeps Three.js, sound effects, and heavy hooks off the login page.
 */
export default function JarvisHUD() {
  const {
    jarvisState, setJarvisState,
    token, activeReminder, dismissReminder,
    addTranscriptEntry, isAuthenticated, isBooted,
  } = useAssistantStore();

  const { settingsOpen, setSettingsOpen } = useSettingsStore();
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Hooks
  const { sendVoiceInput, sendTaskAction, sendReminderResponse } = useWebSocket();
  const { isListening, start: startListening, stop: stopListening } = useSpeechRecognition();
  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeechSynthesis();
  const { isActive: audioActive, start: startAudio, stop: stopAudio, getFrequencyData } = useAudioAnalyser();
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

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((result) => {
        setNotifPermission(result);
        if (result === 'granted') {
          new Notification('JARVIS - Notifications Enabled', {
            body: 'You will now receive task reminders on your desktop, sir.',
            icon: '/favicon.svg',
          });
        }
      });
    }
  }, []);

  // Fetch tasks
  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchTasks = async () => {
        try {
          const [todayRes, upcomingRes, overdueRes, statsRes] = await Promise.all([
            taskApi.getToday(), taskApi.getUpcoming(), taskApi.getOverdue(), taskApi.getStats(),
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

  // Conversation mode
  const conversationModeRef = useRef(false);

  const startMicConversation = useCallback((withTimeout = false) => {
    const currentState = useAssistantStore.getState().jarvisState;
    if (currentState === 'speaking' || currentState === 'processing' || currentState === 'listening') return;

    setTimeout(() => {
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

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      conversationModeRef.current = false;
      stopListening();
      stopAudio();
      setJarvisState('idle');
      playSound?.('mic-off');
    } else {
      conversationModeRef.current = false;
      cancelSpeech();
      window.speechSynthesis?.cancel();
      startMicConversation(false);
    }
  }, [isListening, stopListening, stopAudio, setJarvisState, playSound, cancelSpeech, startMicConversation]);

  useWakeWord({
    enabled: isAuthenticated && isBooted,
    onWake: useCallback(() => {
      console.log('[WakeWord] Activating conversation mode');
      conversationModeRef.current = true;
      startMicConversation(false);
    }, [startMicConversation]),
  });

  // Auto-reopen mic after AI finishes speaking
  useEffect(() => {
    const unsub = useAssistantStore.subscribe((state, prev) => {
      if (
        prev.jarvisState === 'speaking' &&
        state.jarvisState === 'idle' &&
        conversationModeRef.current
      ) {
        console.log('[Conversation] AI done speaking, reopening mic with 5s timeout');
        setTimeout(() => {
          if (conversationModeRef.current) {
            startMicConversation(true);
          }
        }, 800);
      }
    });
    return unsub;
  }, [startMicConversation]);

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

  const handleTaskCreate = async (taskData) => {
    try {
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

      const timeInfo = payload.due_time ? ` at ${payload.due_time}` : '';
      const dateInfo = payload.due_date ? ` on ${payload.due_date}` : '';
      const jarvisMsg = `Task "${payload.title}" has been created${dateInfo}${timeInfo}, sir. I'll keep track of it for you.`;
      addTranscriptEntry({
        role: 'assistant',
        content: jarvisMsg,
        emotion: 'happy',
        timestamp: new Date().toISOString(),
      });

      const [todayRes, statsRes] = await Promise.all([
        taskApi.getToday(), taskApi.getStats(),
      ]);
      useTaskStore.getState().setTodayTasks(todayRes.data);
      useTaskStore.getState().setStats(statsRes.data);
    } catch {
      toast.error('Failed to create task');
    }
  };

  // Prime TTS on first interaction
  useEffect(() => {
    let primed = false;
    const primeTTS = () => {
      if (primed) return;
      primed = true;
      if (window.speechSynthesis) {
        const silent = new SpeechSynthesisUtterance('');
        silent.volume = 0;
        window.speechSynthesis.speak(silent);
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
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: 'var(--bg-void)' }}>
      <GridBackground />
      <ScanLine />
      <CornerBrackets />
      <DataStreamLines />

      <TopStatusBar onSettingsClick={() => setSettingsOpen(true)} />

      {notifPermission !== 'granted' && notifPermission !== 'denied' && (
        <div
          style={{
            position: 'fixed', top: 50, left: '50%', transform: 'translateX(-50%)',
            zIndex: 200, background: 'var(--bg-panel)', border: '1px solid var(--hud-gold)',
            borderRadius: 4, padding: '8px 20px', display: 'flex', alignItems: 'center',
            gap: 12, backdropFilter: 'blur(12px)', boxShadow: '0 0 20px rgba(255,215,64,0.15)',
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
              }
            }}
            style={{
              padding: '4px 14px', fontSize: 10, fontFamily: 'var(--font-display)',
              fontWeight: 600, letterSpacing: '1px', color: 'var(--hud-gold)',
              background: 'rgba(255,215,64,0.1)', border: '1px solid var(--hud-gold)',
              borderRadius: 3, cursor: 'pointer',
            }}
          >
            ENABLE
          </button>
        </div>
      )}

      <div className="absolute inset-0 flex" style={{ top: '46px', bottom: '68px' }}>
        <div className="hud-side-panel flex-shrink-0 p-3 overflow-y-auto" style={{ width: 'clamp(260px, 22vw, 320px)', scrollbarWidth: 'thin' }}>
          <TaskPanel onNewTask={() => setShowTaskForm(true)} />
        </div>

        <div className="flex-1 flex flex-col items-center min-w-0" style={{ padding: '8px 12px 0' }}>
          <div style={{ flexShrink: 0 }}>
            <ArcReactor jarvisState={jarvisState} audioData={getFrequencyData} size={280} />
          </div>
          <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: '600px', marginTop: '4px' }}>
            <TranscriptDisplay onSendMessage={handleTextInput} />
          </div>
        </div>

        <div className="hud-side-panel flex-shrink-0 p-3 overflow-y-auto" style={{ width: 'clamp(260px, 20vw, 300px)', scrollbarWidth: 'thin' }}>
          <SystemPanel />
        </div>
      </div>

      <BottomVoiceBar
        isListening={isListening} jarvisState={jarvisState}
        onMicToggle={handleMicToggle} getFrequencyData={getFrequencyData} audioActive={audioActive}
      />

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
                  emotion: 'happy', timestamp: new Date().toISOString(),
                });
                const [todayRes, statsRes] = await Promise.all([taskApi.getToday(), taskApi.getStats()]);
                useTaskStore.getState().setTodayTasks(todayRes.data);
                useTaskStore.getState().setStats(statsRes.data);
              } catch { toast.error('Failed to complete task'); }
            }}
            onAcknowledge={() => { sendReminderResponse('acknowledge', activeReminder.task_id); dismissReminder(); }}
            onSnooze={() => { sendReminderResponse('snooze', activeReminder.task_id); dismissReminder(); }}
            onDismiss={dismissReminder}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTaskForm && <TaskForm isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} onSubmit={handleTaskCreate} />}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>

      <Toaster
        theme="dark" position="top-right"
        toastOptions={{ style: { background: 'var(--bg-panel)', border: '1px solid var(--border-hud)', color: 'var(--hud-white)', fontFamily: 'var(--font-body)' } }}
      />
    </div>
  );
}
