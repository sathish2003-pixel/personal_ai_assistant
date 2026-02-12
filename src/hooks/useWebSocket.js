import { useEffect, useCallback, useRef } from 'react';
import useAssistantStore from '../store/useAssistantStore';
import useTaskStore from '../store/useTaskStore';
import taskApi from '../services/taskApi';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';

/** Refresh all task lists from the API */
async function refreshAllTasks() {
  try {
    const [todayRes, upcomingRes, overdueRes, statsRes] = await Promise.all([
      taskApi.getToday(),
      taskApi.getUpcoming(),
      taskApi.getOverdue(),
      taskApi.getStats(),
    ]);
    const store = useTaskStore.getState();
    store.setTodayTasks(todayRes.data);
    store.setUpcomingTasks(upcomingRes.data);
    store.setOverdueTasks(overdueRes.data);
    store.setStats(statsRes.data);
  } catch (err) {
    console.error('[WS] Failed to refresh tasks:', err);
  }
}

/** Actions that mean tasks changed and UI should refresh */
const TASK_REFRESH_ACTIONS = [
  'task_created', 'task_completed', 'task_updated', 'task_deleted',
  'task_cancelled', 'tasks_listed', 'tasks_found',
];

export default function useWebSocket() {
  const socketRef = useRef(null);
  const { token, setConnectionStatus, addTranscriptEntry, setActiveReminder, setJarvisState } =
    useAssistantStore();

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    socket.on('system_status', (data) => {
      console.log('[WS] System status:', data);
    });

    socket.on('ai_response', (data) => {
      // Skip adding to transcript if it's a reminder (ReminderAlert handles its own voice loop)
      if (data.session_id === 'reminders') return;

      addTranscriptEntry({
        role: 'assistant',
        content: data.text,
        emotion: data.emotion,
        action: data.action,
        timestamp: new Date().toISOString(),
      });
      // Don't force 'speaking' here — let TTS onstart set it.
      // This prevents state getting stuck at 'speaking' if TTS fails silently.

      // If the AI performed a task-related action, refresh the task panels immediately
      const actionName = data.action?.action;
      if (actionName && TASK_REFRESH_ACTIONS.includes(actionName)) {
        refreshAllTasks();
      }
    });

    socket.on('task_updated', (data) => {
      // Optimistic remove for deletions, then full refresh for everything
      if (data.action === 'task_deleted' || data.action === 'task_cancelled') {
        useTaskStore.getState().removeTask(data.task_id);
      }
      // Always refresh to sync UI with latest DB state
      refreshAllTasks();
    });

    socket.on('reminder_alert', (data) => {
      setActiveReminder(data);
      setJarvisState('alert');
    });

    socket.on('reminder_dismissed', () => {
      useAssistantStore.getState().dismissReminder();
    });

    socket.on('pong', () => {
      // Connection alive
    });

    return () => {
      disconnectSocket();
      setConnectionStatus('disconnected');
    };
  }, [token]);

  const sendVoiceInput = useCallback((text) => {
    const socket = getSocket();
    const sessionId = useAssistantStore.getState().sessionId;
    if (socket?.connected) {
      addTranscriptEntry({
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      });
      socket.emit('voice_input', { text, session_id: sessionId });
      setJarvisState('processing');
    }
  }, []);

  const sendTaskAction = useCallback((action, taskId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('task_action', { action, task_id: taskId });
    }
  }, []);

  const sendReminderResponse = useCallback((action, taskId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('reminder_response', { action, task_id: taskId });
    }
  }, []);

  return { sendVoiceInput, sendTaskAction, sendReminderResponse };
}
