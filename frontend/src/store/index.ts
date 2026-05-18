import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import tasksReducer from './tasksSlice';
import calendarReducer from './calendarSlice';
import notificationsReducer from './notificationsSlice';
import themeReducer from './themeSlice';
import profileReducer from './profileSlice';
import adminReducer from './adminSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    calendar: calendarReducer,
    notifications: notificationsReducer,
    theme: themeReducer,
    profile: profileReducer,
    admin: adminReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
