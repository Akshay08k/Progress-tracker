import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import { loginSuccess, logout, setAuthLoading, type UserProfile } from './store/authSlice';

import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Layout & Global UI
import Navbar from './components/Layout/Navbar';
import NotificationsPanel from './components/Layout/NotificationsPanel';
import FocusTimer from './components/UI/FocusTimer';
import MoodLog from './components/UI/MoodLog';
import Toast from './components/UI/Toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CalendarPage from './pages/CalendarPage';
import Challenges from './pages/Challenges';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Route Guards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-dashed border-accent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-dashed border-accent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated && user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.theme.currentTheme);
  const authLoading = useAppSelector((state) => state.auth.loading);

  // 1. Sync theme class on body element
  useEffect(() => {
    // Remove any existing theme- classes
    const classes = Array.from(document.body.classList);
    classes.forEach((c) => {
      if (c.startsWith('theme-')) {
        document.body.classList.remove(c);
      }
    });
    
    // Add current theme class
    document.body.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  // 2. Firebase auth state listener
  useEffect(() => {
    dispatch(setAuthLoading(true));
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            dispatch(loginSuccess({ user: profileData, token }));
          } else {
            // Document might still be creating in register page flow
            const tempProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Stitch Member',
              photoURL: fbUser.photoURL || '',
              level: 1,
              xp: 0,
              streak: 0,
              role: 'user',
              bio: '',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              lastLoginIP: '',
              createdAt: new Date().toISOString()
            };
            dispatch(loginSuccess({ user: tempProfile, token }));
          }
        } catch (e) {
          console.error('Failed to restore user session:', e);
          dispatch(logout());
        }
      } else {
        dispatch(logout());
      }
      dispatch(setAuthLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-dashed border-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background-primary text-text-primary transition-colors duration-300">
        
        {/* Navigation & Panels */}
        <Navbar />
        <NotificationsPanel />
        <FocusTimer />
        <MoodLog />
        <Toast />

        {/* Dynamic Route Pages */}
        <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Core App Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/challenges" 
              element={
                <ProtectedRoute>
                  <Challenges />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Guarded Admin Dashboard Panel */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } 
            />

            {/* Fallbacks */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
};

export default App;
