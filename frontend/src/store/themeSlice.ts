import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeType = 
  | 'dark-void' 
  | 'light-canvas' 
  | 'forest-green' 
  | 'midnight-purple' 
  | 'ember-orange' 
  | 'arctic-frost';

interface ThemeState {
  currentTheme: ThemeType;
}

const getInitialTheme = (): ThemeType => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved) return saved as ThemeType;
  }
  return 'dark-void';
};

const initialState: ThemeState = {
  currentTheme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.currentTheme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
        document.body.className = `theme-${action.payload}`;
      }
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
