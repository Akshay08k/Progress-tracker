import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ProfileState {
  xp: number;
  level: number;
  streak: number;
  displayName: string;
  photoURL: string;
  bio: string;
  timezone: string;
}

const initialState: ProfileState = {
  xp: 0,
  level: 1,
  streak: 0,
  displayName: '',
  photoURL: '',
  bio: '',
  timezone: '',
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfileData: (state, action: PayloadAction<ProfileState>) => {
      return { ...state, ...action.payload };
    },
    earnXp: (state, action: PayloadAction<number>) => {
      state.xp += action.payload;
    },
    updateStreak: (state, action: PayloadAction<number>) => {
      state.streak = action.payload;
    }
  }
});

export const { setProfileData, earnXp, updateStreak } = profileSlice.actions;
export default profileSlice.reducer;
