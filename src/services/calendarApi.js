import api from './api';

export const calendarApi = {
  getAuthUrl: () => api.get('/api/google/auth-url'),
  getEvents: () => api.get('/api/calendar/events'),
  getStatus: () => api.get('/api/calendar/status'),
  sync: () => api.post('/api/calendar/sync'),
  disconnect: () => api.delete('/api/calendar/disconnect'),
};
