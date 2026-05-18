import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CalendarState {
  selectedDate: string; // YYYY-MM-DD
  viewMode: 'month' | 'week' | 'day';
  drawerOpen: boolean;
}

const initialState: CalendarState = {
  selectedDate: new Date().toISOString().split('T')[0],
  viewMode: 'month',
  drawerOpen: false,
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'month' | 'week' | 'day'>) => {
      state.viewMode = action.payload;
    },
    setCalendarDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.drawerOpen = action.payload;
    },
  },
});

export const { setSelectedDate, setViewMode, setCalendarDrawerOpen } = calendarSlice.actions;
export default calendarSlice.reducer;
