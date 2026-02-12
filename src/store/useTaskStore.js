import { create } from 'zustand';

const useTaskStore = create((set, get) => ({
  tasks: [],
  todayTasks: [],
  upcomingTasks: [],
  overdueTasks: [],
  allTasks: [],
  stats: { completed_today: 0, total_today: 0, overdue_count: 0, completion_rate: 0 },
  isLoading: false,
  error: null,
  activeTab: 'today',
  searchQuery: '',

  setTasks: (tasks) => set({ tasks }),
  setTodayTasks: (tasks) => set({ todayTasks: tasks }),
  setUpcomingTasks: (tasks) => set({ upcomingTasks: tasks }),
  setOverdueTasks: (tasks) => set({ overdueTasks: tasks }),
  setAllTasks: (tasks) => set({ allTasks: tasks }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addTask: (task) =>
    set((state) => ({ tasks: [task, ...state.tasks] })),

  updateTask: (updatedTask) =>
    set((state) => {
      const update = (arr) => arr.map((t) => t.id === updatedTask.id ? updatedTask : t);
      return {
        tasks: update(state.tasks),
        todayTasks: update(state.todayTasks),
        upcomingTasks: update(state.upcomingTasks),
        overdueTasks: update(state.overdueTasks),
        allTasks: update(state.allTasks),
      };
    }),

  removeTask: (taskId) =>
    set((state) => {
      const remove = (arr) => arr.filter((t) => t.id !== taskId);
      return {
        tasks: remove(state.tasks),
        todayTasks: remove(state.todayTasks),
        upcomingTasks: remove(state.upcomingTasks),
        overdueTasks: remove(state.overdueTasks),
        allTasks: remove(state.allTasks),
      };
    }),
}));

export default useTaskStore;
