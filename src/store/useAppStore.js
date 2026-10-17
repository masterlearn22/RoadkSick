import { create } from 'zustand';

/**
 * Zustand store for application-wide layout, navigation, mock toggles, and notification toasts.
 */
const useAppStore = create((set) => ({
  // State
  sidebarOpen: true,
  currentPage: 'dashboard',
  isMockMode:
    import.meta.env.VITE_USE_MOCK === undefined
      ? true
      : import.meta.env.VITE_USE_MOCK === 'true',
  notifications: [],

  // Actions
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setSidebarOpen: (isOpen) =>
    set({
      sidebarOpen: isOpen,
    }),

  setCurrentPage: (page) =>
    set({
      currentPage: page,
    }),

  setMockMode: (isMock) =>
    set({
      isMockMode: isMock,
    }),

  addNotification: (notification) =>
    set((state) => {
      const id = notification.id || `notif-${Date.now()}-${Math.random()}`;
      const newNotif = {
        id,
        timestamp: new Date().toISOString(),
        type: notification.type || 'info', // 'info' | 'success' | 'warning' | 'error'
        message: notification.message || '',
        title: notification.title || '',
        duration: notification.duration || 4000,
        ...notification,
      };
      return {
        notifications: [newNotif, ...state.notifications],
      };
    }),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () =>
    set({
      notifications: [],
    }),
}));

export default useAppStore;
