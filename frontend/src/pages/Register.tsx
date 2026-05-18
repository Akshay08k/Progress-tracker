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
  const [optInDaily, setOptInDaily] = useState(true);
  const [optInWeekly, setOptInWeekly] = useState(true);
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
        role: 'user' as const, // default role
        bio: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lastLoginIP: '',
        preferences: {
          dailySummary: optInDaily,
          weeklyDigest: optInWeekly,
        },
        createdAt: new Date().toISOString(),
      };

      // Set Firestore profile document
      await setDoc(doc(db, 'users', fbUser.uid), profileData);

      dispatch(loginSuccess({ user: profileData, token }));
      dispatch(showToast({ message: `Account created! Welcome to StitchXP, ${displayName}!`, type: 'success' }));
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error(error);
      const firebaseError = error as { code?: string; message?: string };
      const errMsg = firebaseError.code === 'auth/email-already-in-use'
        ? 'This email address is already in use.'
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
          displayName: fbUser.displayName || 'Stitch Member',
          photoURL: fbUser.photoURL || '',
          level: 1,
          xp: 0,
          streak: 0,
          role: 'user' as const,
          bio: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          lastLoginIP: '',
          preferences: {
            dailySummary: true,
            weeklyDigest: true,
          },
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profileData);
      }

      dispatch(loginSuccess({ user: profileData, token }));
      dispatch(showToast({ message: `Welcome, ${profileData.displayName}!`, type: 'success' }));
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error(error);
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
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4 relative overflow-hidden bg-woven-grid">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl animate-float-slow" style={{ animationDelay: '2s' }}></div>

      <div 
        className="w-full max-w-md bg-background-surface border-4 border-double border-accent/40 rounded-2xl shadow-floating p-8 my-8 relative"
        style={{ clipPath: 'polygon(1% 0%, 99% 2%, 97% 99%, 0% 97%)' }}
      >
        <div className="absolute inset-2 border border-dashed border-accent/30 rounded-xl pointer-events-none"></div>

        <div className="text-center mb-6 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-accent border-2 border-double border-white flex items-center justify-center shadow-orbital mx-auto mb-3 animate-float-slow">
            <span className="text-white font-extrabold text-lg font-mono-stats">S</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-text-primary uppercase font-mono-stats">
            REGISTER CANVAS
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            "Design your board, connect the stitches, track your success."
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1 tracking-wide">
              Display Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                <IoPersonOutline className="text-base" />
              </span>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1 tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                <IoMailOutline className="text-base" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1 tracking-wide">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                <IoLockClosedOutline className="text-base" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1 tracking-wide">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                <IoLockClosedOutline className="text-base" />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          {/* Opt-in Email Settings */}
          <div className="space-y-2 py-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="optInDaily"
                checked={optInDaily}
                onChange={(e) => setOptInDaily(e.target.checked)}
                className="rounded bg-background-primary border-border-stitch text-accent focus:ring-accent w-4 h-4 cursor-pointer"
              />
              <label htmlFor="optInDaily" className="text-[10px] font-bold text-text-secondary uppercase cursor-pointer select-none">
                Subscribe to Daily Recaps (9 PM)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="optInWeekly"
                checked={optInWeekly}
                onChange={(e) => setOptInWeekly(e.target.checked)}
                className="rounded bg-background-primary border-border-stitch text-accent focus:ring-accent w-4 h-4 cursor-pointer"
              />
              <label htmlFor="optInWeekly" className="text-[10px] font-bold text-text-secondary uppercase cursor-pointer select-none">
                Subscribe to Sunday Digests (6 PM)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent border-2 border-double border-white py-3 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase shadow-orbital hover:shadow-floating transition-all active:scale-95 duration-200 mt-2"
          >
            {loading ? 'Registering Canvas...' : 'Stitch Account Up'}
          </button>
        </form>

        <div className="relative my-5 text-center z-10">
          <hr className="border-t border-dashed border-border-stitch" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-surface px-3 text-[10px] font-bold text-text-secondary uppercase font-mono-stats">
            OR REG OAUTH
          </span>
        </div>

        <button
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full bg-background-primary border border-border-stitch py-3 rounded-lg text-text-secondary hover:text-text-primary hover:border-accent font-bold text-xs flex items-center justify-center gap-2 transition-all relative z-10"
        >
          <IoLogoGoogle className="text-sm text-accent" />
          <span>Register with Google</span>
        </button>

        <div className="text-center mt-5 text-xs text-text-secondary relative z-10">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-accent hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
