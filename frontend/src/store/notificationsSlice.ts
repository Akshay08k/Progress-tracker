import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'task_reminder' | 'security_ip' | 'streak_risk' | 'summary' | 'level_up' | 'challenge_complete';
  read: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: NotificationItem[];
  unreadCount: number;
  panelOpen: boolean;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  panelOpen: false,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.read).length;
    },
    markAsReadSuccess: (state, action: PayloadAction<string>) => {
      const idx = state.notifications.findIndex(n => n.id === action.payload);
      if (idx !== -1 && !state.notifications[idx].read) {
        state.notifications[idx].read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsReadSuccess: (state) => {
      state.notifications.forEach(n => { n.read = true; });
      state.unreadCount = 0;
    },
    toggleNotificationsPanel: (state, action: PayloadAction<boolean | undefined>) => {
      state.panelOpen = action.payload !== undefined ? action.payload : !state.panelOpen;
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => { n.read = true; });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  markAsReadSuccess,
  markAllAsReadSuccess,
  toggleNotificationsPanel,
  markAllAsRead,
  clearNotifications
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
