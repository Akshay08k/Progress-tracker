import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeType = 
  | 'light' 
  | 'dark' 
  | 'forest' 
  | 'ocean' 
  | 'sunset' 
  | 'rose';

const THEMES: ThemeType[] = ['light', 'dark', 'forest', 'ocean', 'sunset', 'rose'];

interface ThemeState {
  currentTheme: ThemeType;
}

const getInitialTheme = (): ThemeType => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved && THEMES.includes(saved as ThemeType)) {
      return saved as ThemeType;
    }
  }
  return 'light';
};

const applyTheme = (theme: ThemeType) => {
  if (typeof window === 'undefined') return;
  
  THEMES.forEach(t => {
    document.body.classList.remove(`theme-${t}`);
  });
  document.body.classList.add(`theme-${theme}`);
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
        applyTheme(action.payload);
      }
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
