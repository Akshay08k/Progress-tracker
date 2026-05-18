import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
}

interface UiState {
  taskFormModalOpen: boolean;
  taskFormModalData: unknown | null; // For editing
  focusTimerOpen: boolean;
  moodLogOpen: boolean;
  mobileDrawerOpen: boolean;
  toast: Toast;
}

const initialState: UiState = {
  taskFormModalOpen: false,
  taskFormModalData: null,
  focusTimerOpen: false,
  moodLogOpen: false,
  mobileDrawerOpen: false,
  toast: {
    message: '',
    type: 'success',
    visible: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTaskFormModal: (state, action: PayloadAction<{ open: boolean; data?: unknown }>) => {
      state.taskFormModalOpen = action.payload.open;
      state.taskFormModalData = action.payload.data || null;
    },
    toggleFocusTimer: (state, action: PayloadAction<boolean>) => {
      state.focusTimerOpen = action.payload;
    },
    toggleMoodLog: (state, action: PayloadAction<boolean>) => {
      state.moodLogOpen = action.payload;
    },
    toggleMobileDrawer: (state, action: PayloadAction<boolean>) => {
      state.mobileDrawerOpen = action.payload;
    },
    showToast: (state, action: PayloadAction<{ message: string; type: Toast['type'] }>) => {
      state.toast.message = action.payload.message;
      state.toast.type = action.payload.type;
      state.toast.visible = true;
    },
    hideToast: (state) => {
      state.toast.visible = false;
    },
  },
});

export const {
  toggleTaskFormModal,
  toggleFocusTimer,
  toggleMoodLog,
  toggleMobileDrawer,
  showToast,
  hideToast,
} = uiSlice.actions;
export default uiSlice.reducer;
