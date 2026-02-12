import api from './api';
import { API } from '../utils/constants';

export const chatApi = {
  send: (text, sessionId = 'default') =>
    api.post(API.CHAT.BASE, { text, session_id: sessionId }),

  getHistory: (sessionId = 'default', limit = 20) =>
    api.get(API.CHAT.HISTORY, { params: { session_id: sessionId, limit } }),

  clearHistory: (sessionId = 'default') =>
    api.delete(API.CHAT.HISTORY, { params: { session_id: sessionId } }),
};

export default chatApi;
