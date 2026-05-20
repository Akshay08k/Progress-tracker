import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { loginSuccess, loginFailure, setAuthLoading } from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { auth, googleProvider, db } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { IoMailOutline, IoLockClosedOutline, IoPersonOutline, IoLogoGoogle } from 'react-icons/io5';

export const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName || !email || !password || !confirmPassword) {
      dispatch(showToast({ message: 'All fields are required.', type: 'error' }));
      return;
    }

    if (password !== confirmPassword) {
      dispatch(showToast({ message: 'Passwords do not match.', type: 'error' }));
      return;
    }

    if (password.length < 6) {
      dispatch(showToast({ message: 'Password must be at least 6 characters.', type: 'error' }));
      return;
    }

    setLoading(true);
    dispatch(setAuthLoading(true));

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName });
      const token = await fbUser.getIdToken();

      const profileData = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName,
        photoURL: '',
        level: 1,
        xp: 0,
        streak: 0,
        role: 'user' as const,
        bio: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lastLoginIP: '',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', fbUser.uid), profileData);

      dispatch(loginSuccess({ user: profileData, token }));
      dispatch(showToast({ message: 'Account created! Welcome!', type: 'success' }));
      navigate('/dashboard');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const errMsg = firebaseError.code === 'auth/email-already-in-use'
        ? 'This email is already in use.'
        : firebaseError.message || 'Registration failed.';
      
      dispatch(loginFailure(errMsg));
      dispatch(showToast({ message: errMsg, type: 'error' }));
    } finally {
      setLoading(false);
      dispatch(setAuthLoading(false));
    }
  };

  const handleGoogleRegister = async () => {
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
          role: 'user' as const,
          bio: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          lastLoginIP: '',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profileData);
      }

      dispatch(loginSuccess({ user: profileData, token }));
      dispatch(showToast({ message: 'Welcome!', type: 'success' }));
      navigate('/dashboard');
    } catch (error: unknown) {
      const firebaseError = error as { message?: string };
      const errMsg = firebaseError.message || 'Google signup failed.';
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
          <h2 className="text-2xl font-bold text-text-primary">Create account</h2>
          <p className="text-text-secondary mt-1">Start building better habits today</p>
        </div>

        {/* Card */}
        <div className="bg-background-surface rounded-2xl shadow-lg border border-border p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/50">
                  <IoPersonOutline className="text-lg" />
                </span>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl text-sm text-text-primary bg-background-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-secondary/40"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/50">
                  <IoLockClosedOutline className="text-lg" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl text-sm text-text-primary bg-background-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-secondary/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/50">
                  <IoLockClosedOutline className="text-lg" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl text-sm text-text-primary bg-background-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-secondary/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 py-2.5 rounded-xl text-white font-medium text-sm transition-colors shadow-lg mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="relative my-6">
            <hr className="border-border" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-surface px-3 text-sm text-text-secondary">
              or continue with
            </span>
          </div>

          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full border border-border hover:bg-background-primary disabled:opacity-50 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors text-text-secondary"
          >
            <IoLogoGoogle className="text-lg" />
            <span>Google</span>
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:opacity-80 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
