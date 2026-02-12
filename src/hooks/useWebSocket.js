import { useCallback } from 'react';
import useAssistantStore from '../store/useAssistantStore';
import useTaskStore from '../store/useTaskStore';
import taskApi from '../services/taskApi';
import api from '../services/api';

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
    console.error('[Chat] Failed to refresh tasks:', err);
  }
}

/** Actions that mean tasks changed and UI should refresh */
const TASK_REFRESH_ACTIONS = [
  'task_created', 'task_completed', 'task_updated', 'task_deleted',
  'task_cancelled', 'tasks_listed', 'tasks_found',
];

export default function useWebSocket() {
  const { addTranscriptEntry, setJarvisState } = useAssistantStore();

  // Mark as connected since we use REST (always "connected" when authenticated)
  useAssistantStore.getState().setConnectionStatus('connected');

  const sendVoiceInput = useCallback(async (text) => {
    const sessionId = useAssistantStore.getState().sessionId;

    addTranscriptEntry({
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    });
    setJarvisState('processing');

    try {
      const res = await api.post('/api/chat', {
        text,
        session_id: sessionId,
      });

      const data = res.data;

      addTranscriptEntry({
        role: 'assistant',
        content: data.text,
        emotion: data.emotion,
        action: data.action,
        timestamp: new Date().toISOString(),
      });

      // If the AI performed a task-related action, refresh task panels
      const actionName = data.action?.action;
      if (actionName && TASK_REFRESH_ACTIONS.includes(actionName)) {
        refreshAllTasks();
      }
    } catch (err) {
      console.error('[Chat] API error:', err);
      addTranscriptEntry({
        role: 'assistant',
        content: 'I apologize, sir. I\'m having trouble connecting to my servers. Please try again.',
        emotion: 'concerned',
        timestamp: new Date().toISOString(),
      });
      setJarvisState('idle');
    }
  }, []);

  const sendTaskAction = useCallback(async (action, taskId) => {
    if (action === 'complete' && taskId) {
      try {
        await taskApi.updateStatus(taskId, 'done');
        refreshAllTasks();
      } catch (err) {
        console.error('[Chat] Task action error:', err);
      }
    }
  }, []);

  const sendReminderResponse = useCallback((action, taskId) => {
    // Reminders require WebSocket (not available on Vercel)
    // Handle locally — just dismiss
    console.log(`[Reminder] ${action} for task ${taskId} (local only)`);
  }, []);

  return { sendVoiceInput, sendTaskAction, sendReminderResponse };
}
