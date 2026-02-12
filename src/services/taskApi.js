import api from './api';
import { API } from '../utils/constants';

export const taskApi = {
  list: (params = {}) => api.get(API.TASKS.BASE, { params }),
  getToday: () => api.get(API.TASKS.TODAY),
  getUpcoming: (days = 7) => api.get(API.TASKS.UPCOMING, { params: { days } }),
  getOverdue: () => api.get(API.TASKS.OVERDUE),
  getStats: () => api.get(API.TASKS.STATS),
  getById: (id) => api.get(`${API.TASKS.BASE}/${id}`),
  create: (data) => api.post(API.TASKS.BASE, data),
  update: (id, data) => api.put(`${API.TASKS.BASE}/${id}`, data),
  updateStatus: (id, status) => api.patch(`${API.TASKS.BASE}/${id}/status`, { status }),
  delete: (id) => api.delete(`${API.TASKS.BASE}/${id}`),
};

export default taskApi;
