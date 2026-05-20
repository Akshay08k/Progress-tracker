import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { loginSuccess, loginFailure, setAuthLoading } from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { auth, googleProvider, db } from '../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { IoMailOutline, IoLockClosedOutline, IoLogoGoogle } from 'react-icons/io5';

export const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      dispatch(showToast({ message: 'Please enter both email and password.', type: 'error' }));
      return;
    }

    setLoading(true);
    dispatch(setAuthLoading(true));

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken();

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let profileData;

      if (userDocSnap.exists()) {
        profileData = userDocSnap.data();
      } else {
        profileData = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'User',
          photoURL: fbUser.photoURL || '',
          level: 1,
          xp: 0,
          streak: 0,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profileData);
      }

      dispatch(loginSuccess({ user: profileData, token }));
      dispatch(showToast({ message: 'Welcome back!', type: 'success' }));
      navigate('/dashboard');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const errMsg = firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/user-not-found'
        ? 'Invalid email or password.'
        : firebaseError.message || 'Login failed.';
      
      dispatch(loginFailure(errMsg));
      dispatch(showToast({ message: errMsg, type: 'error' }));
    } finally {
      setLoading(false);
      dispatch(setAuthLoading(false));
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    dispatch(setAuthLoading(true));

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken();

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let profileData;

      if (userDocSnap.exists()) {
        profileData = userDocSnap.data();
      } else {
        profileData = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'User',
          photoURL: fbUser.photoURL || '',
          level: 1,
          xp: 0,
          streak: 0,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profileData);
      }

      dispatch(loginSuccess({ user: profileData, token }));
      dispatch(showToast({ message: 'Welcome!', type: 'success' }));
      navigate('/dashboard');
    } catch (error: unknown) {
      const firebaseError = error as { message?: string };
      const errMsg = firebaseError.message || 'Google login failed.';
      dispatch(loginFailure(errMsg));
      dispatch(showToast({ message: errMsg, type: 'error' }));
    } finally {
      setLoading(false);
      dispatch(setAuthLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
          <p className="text-text-secondary mt-1">Sign in to track your habits</p>
        </div>

        {/* Card */}
        <div className="bg-background-surface rounded-2xl shadow-lg border border-border p-8">
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/50">
                  <IoMailOutline className="text-lg" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl text-sm text-text-primary bg-background-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-secondary/40"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-text-secondary">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-accent hover:opacity-80 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/50">
                  <IoLockClosedOutline className="text-lg" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl text-sm text-text-primary bg-background-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-secondary/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 py-2.5 rounded-xl text-white font-medium text-sm transition-colors shadow-lg"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-6">
            <hr className="border-border" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-surface px-3 text-sm text-text-secondary">
              or continue with
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border border-border hover:bg-background-primary disabled:opacity-50 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors text-text-secondary"
          >
            <IoLogoGoogle className="text-lg" />
            <span>Google</span>
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent hover:opacity-80 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
