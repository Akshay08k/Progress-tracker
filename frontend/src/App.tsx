import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import { loginSuccess, logout, setAuthLoading, type UserProfile } from './store/authSlice';

import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { setNotifications } from './store/notificationsSlice';

// Layout & Global UI
import Navbar from './components/Layout/Navbar';
import NotificationsPanel from './components/Layout/NotificationsPanel';
import Toast from './components/UI/Toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Route Guards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated && user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.theme.currentTheme);
  const authLoading = useAppSelector((state) => state.auth.loading);

  // Apply initial theme class on mount
  useEffect(() => {
    const themes = ['light', 'dark', 'forest', 'ocean', 'sunset', 'rose'];
    themes.forEach(t => document.body.classList.remove(`theme-${t}`));
    document.body.classList.add(`theme-${currentTheme}`);
  }, []);

  // Sync theme class when it changes
  useEffect(() => {
    const themes = ['light', 'dark', 'forest', 'ocean', 'sunset', 'rose'];
    themes.forEach(t => document.body.classList.remove(`theme-${t}`));
    document.body.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  // Firebase auth state listener
  useEffect(() => {
    dispatch(setAuthLoading(true));
    let unsubscribeUserDoc: (() => void) | null = null;
    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubscribeUserDoc) { unsubscribeUserDoc(); unsubscribeUserDoc = null; }
      if (unsubscribeNotifications) { unsubscribeNotifications(); unsubscribeNotifications = null; }

      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const userDocRef = doc(db, 'users', fbUser.uid);
          
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            dispatch(loginSuccess({ user: profileData, token }));
          } else {
            const tempProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'User',
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

          unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const updatedProfile = docSnap.data() as UserProfile;
              dispatch(loginSuccess({ user: updatedProfile, token }));
            }
          }, (error) => {
            console.error('User doc sync error:', error);
          });

          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', fbUser.uid),
            orderBy('createdAt', 'desc')
          );
          
          unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            dispatch(setNotifications(list));
          }, (error) => {
            console.warn('Notifications sync warning:', error);
          });

        } catch (e) {
          console.error('Failed to restore session:', e);
          dispatch(logout());
        }
      } else {
        dispatch(logout());
      }
      dispatch(setAuthLoading(false));
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [dispatch]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background-primary text-text-primary transition-colors duration-300">
        
        {/* Navigation & Panels */}
        <Navbar />
        <NotificationsPanel />
        <Toast />

        {/* Routes */}
        <div className="pt-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
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
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
};

export default App;
