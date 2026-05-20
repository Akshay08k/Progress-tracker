import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface HabitCompletion {
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  completions: HabitCompletion[];
  createdAt: string;
  archived: boolean;
}

interface HabitsState {
  items: Habit[];
  loading: boolean;
  error: string | null;
}

const initialState: HabitsState = {
  items: [],
  loading: false,
  error: null,
};

const calculateStreak = (completions: HabitCompletion[]): number => {
  const sorted = [...completions]
    .filter(c => c.completed)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (sorted.length === 0) return 0;
  
  let streak = 0;
  let checkDate = new Date();
  
  for (const completion of sorted) {
    const expectedDate = checkDate.toISOString().split('T')[0];
    if (completion.date === expectedDate) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (completion.date < expectedDate) {
      break;
    }
  }
  
  return streak;
};

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    setHabits: (state, action: PayloadAction<Habit[]>) => {
      state.items = action.payload;
    },
    addHabit: (state, action: PayloadAction<Habit>) => {
      state.items.push(action.payload);
    },
    updateHabit: (state, action: PayloadAction<Partial<Habit> & { id: string }>) => {
      const idx = state.items.findIndex(h => h.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload };
      }
    },
    deleteHabit: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(h => h.id !== action.payload);
    },
    toggleCompletion: (state, action: PayloadAction<{ habitId: string; date: string }>) => {
      const { habitId, date } = action.payload;
      const habit = state.items.find(h => h.id === habitId);
      if (habit) {
        const existingIdx = habit.completions.findIndex(c => c.date === date);
        if (existingIdx !== -1) {
          habit.completions[existingIdx].completed = !habit.completions[existingIdx].completed;
        } else {
          habit.completions.push({ date, completed: true });
        }
      }
    },
    archiveHabit: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex(h => h.id === action.payload);
      if (idx !== -1) {
        state.items[idx].archived = true;
      }
    },
    unarchiveHabit: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex(h => h.id === action.payload);
      if (idx !== -1) {
        state.items[idx].archived = false;
      }
    },
  },
});

export const {
  setHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  toggleCompletion,
  archiveHabit,
  unarchiveHabit,
} = habitsSlice.actions;

export { calculateStreak };
export default habitsSlice.reducer;
