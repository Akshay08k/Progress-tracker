import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from './authSlice';

interface AdminState {
  users: UserProfile[];
  stats: {
    totalUsers: number;
    tasksCreatedToday: number;
    tasksCreatedWeek: number;
    notificationsSent: number;
  } | null;
  announcement: string;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  users: [],
  stats: null,
  announcement: '',
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setAdminLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAdminUsers: (state, action: PayloadAction<UserProfile[]>) => {
      state.users = action.payload;
      state.loading = false;
    },
    setAdminStats: (state, action: PayloadAction<AdminState['stats']>) => {
      state.stats = action.payload;
      state.loading = false;
    },
    setAnnouncementSuccess: (state, action: PayloadAction<string>) => {
      state.announcement = action.payload;
    },
    setAdminFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const { 
  setAdminLoading, 
  setAdminUsers, 
  setAdminStats, 
  setAnnouncementSuccess, 
  setAdminFailure 
} = adminSlice.actions;
export default adminSlice.reducer;
