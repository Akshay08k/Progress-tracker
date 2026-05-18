import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Task {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  dueTime?: string;
  recurring?: 'none' | 'daily' | 'weekly';
  reminderEnabled?: boolean;
  reminderTime?: '15m' | '1h' | '1d' | 'custom';
  repeatMode?: 'none' | 'daily' | 'weekly' | 'custom';
  repeatConfig?: {
    daysOfWeek?: number[];
    intervalDays?: number;
    endDate?: string;
  };
  difficulty?: 'easy' | 'medium' | 'hard';
  completed: boolean;
  missed?: boolean;
  xpEarned?: number;
  completedAt?: string;
  notes?: string;
  order?: number;
  isDeleted?: boolean;
  columnId?: 'todo' | 'in_progress' | 'done';
  createdAt?: string;
  updatedAt?: string;
}

interface TasksState {
  items: Task[];
  filters: {
    category: string;
    priority: string;
    search: string;
    status: 'all' | 'active' | 'completed' | 'missed';
  };
  sortOrder: 'dueDate' | 'priority' | 'difficulty' | 'order';
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  items: [],
  filters: {
    category: 'All',
    priority: 'All',
    search: '',
    status: 'all',
  },
  sortOrder: 'order',
  loading: false,
  error: null,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasksStart: (state) => {
      state.loading = true;
    },
    setTasksSuccess: (state, action: PayloadAction<Task[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setTasksFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Primary CRUD actions used by pages
    addTask: (state, action: PayloadAction<Task>) => {
      state.items.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const idx = state.items.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload };
      }
    },
    toggleTaskCompleted: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex(t => t.id === action.payload);
      if (idx !== -1) {
        state.items[idx].completed = !state.items[idx].completed;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex(t => t.id === action.payload);
      if (idx !== -1) {
        state.items[idx].isDeleted = true;
      }
    },
    // Legacy aliases kept for compatibility
    addTaskSuccess: (state, action: PayloadAction<Task>) => {
      state.items.push(action.payload);
    },
    updateTaskSuccess: (state, action: PayloadAction<Task>) => {
      const idx = state.items.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    deleteTaskSuccess: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.filters.category = action.payload;
    },
    setPriorityFilter: (state, action: PayloadAction<string>) => {
      state.filters.priority = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<'all' | 'active' | 'completed' | 'missed'>) => {
      state.filters.status = action.payload;
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'dueDate' | 'priority' | 'difficulty' | 'order'>) => {
      state.sortOrder = action.payload;
    },
    reorderTasks: (state, action: PayloadAction<Task[]>) => {
      state.items = action.payload;
    },
  },
});

export const {
  setTasksStart,
  setTasksSuccess,
  setTasksFailure,
  addTask,
  updateTask,
  toggleTaskCompleted,
  deleteTask,
  addTaskSuccess,
  updateTaskSuccess,
  deleteTaskSuccess,
  setCategoryFilter,
  setPriorityFilter,
  setStatusFilter,
  setSearchFilter,
  setSortOrder,
  reorderTasks,
} = tasksSlice.actions;
export default tasksSlice.reducer;
