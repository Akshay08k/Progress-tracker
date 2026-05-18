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

  const handleIpSecurityCheck = async (userId: string, userEmail: string) => {
    try {
      // 1. Get client IP address
      let clientIp = '127.0.0.1';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          clientIp = ipData.ip;
        }
      } catch (e) {
        console.warn('Could not fetch client IP from ipify, using fallback:', e);
      }

      // 2. Trigger Next.js security endpoint
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const secRes = await fetch(`${backendUrl}/api/auth/ip-security`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
          ip: clientIp
        })
      });

      if (secRes.ok) {
        const secData = await secRes.json();
        if (secData.alertTriggered) {
          dispatch(showToast({ 
            message: 'New login location detected! Verification alert dispatched to email.', 
            type: 'warning' 
          }));
        }
      }
    } catch (err) {
      console.error('Failed to trigger backend IP security audit:', err);
    }
  };

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

      // Retrieve Firestore document details
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let profileData;

      if (userDocSnap.exists()) {
        profileData = userDocSnap.data();
      } else {
        // Fallback profile creation if Firestore record doesn't exist yet
        profileData = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Progress Tracker User',
          photoURL: fbUser.photoURL || '',
          level: 1,
          xp: 0,
          streak: 0,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profileData);
      }

      // Trigger serverless IP security logs
      await handleIpSecurityCheck(fbUser.uid, fbUser.email || '');

      dispatch(loginSuccess({ user: profileData, token }));
      dispatch(showToast({ message: `Welcome back, ${profileData.displayName}!`, type: 'success' }));
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error(error);
      const firebaseError = error as { code?: string; message?: string };
      const errMsg = firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/user-not-found'
        ? 'Invalid email or password credentials.'
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
        // Create base level profile record
        profileData = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Progress Member',
          photoURL: fbUser.photoURL || '',
          level: 1,
          xp: 0,
          streak: 0,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profileData);
      }

      // Audit client IP address
      await handleIpSecurityCheck(fbUser.uid, fbUser.email || '');

      dispatch(loginSuccess({ user: profileData, token }));
      dispatch(showToast({ message: `Welcome, ${profileData.displayName}!`, type: 'success' }));
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error(error);
      const firebaseError = error as { message?: string };
      const errMsg = firebaseError.message || 'Google Auth failed.';
      dispatch(loginFailure(errMsg));
      dispatch(showToast({ message: errMsg, type: 'error' }));
    } finally {
      setLoading(false);
      dispatch(setAuthLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4 relative overflow-hidden bg-woven-grid">
      {/* Dynamic orbital glowing accent background details */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl animate-float-slow" style={{ animationDelay: '2s' }}></div>

      <div 
        className="w-full max-w-md bg-background-surface border-4 border-double border-accent/40 rounded-2xl shadow-floating p-8 relative"
        style={{ clipPath: 'polygon(0% 1%, 100% 0%, 98% 100%, 1% 98%)' }} // Custom hand-cut patch cut-out shape
      >
        {/* Sewing stitches borders inside boundary */}
        <div className="absolute inset-2 border border-dashed border-accent/30 rounded-xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-accent border-2 border-double border-white flex items-center justify-center shadow-orbital mx-auto mb-3 animate-float-slow">
            <span className="text-white font-extrabold text-lg font-mono-stats">S</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-text-primary uppercase font-mono-stats">
            STITCHXP LOGIN
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            "Every productive habit starts with a single stitch."
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide">
                Password
              </label>
              <Link 
                to="/forgot-password" 
                className="text-[10px] font-bold text-accent hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                <IoLockClosedOutline className="text-base" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent border-2 border-double border-white py-3 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase shadow-orbital hover:shadow-floating transition-all active:scale-95 duration-200 mt-2"
          >
            {loading ? 'Processing Login...' : 'Stitch Account In'}
          </button>
        </form>

        <div className="relative my-6 text-center z-10">
          <hr className="border-t border-dashed border-border-stitch" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-surface px-3 text-[10px] font-bold text-text-secondary uppercase font-mono-stats">
            OR FUSE AUTH
          </span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-background-primary border border-border-stitch py-3 rounded-lg text-text-secondary hover:text-text-primary hover:border-accent font-bold text-xs flex items-center justify-center gap-2 transition-all relative z-10"
        >
          <IoLogoGoogle className="text-sm text-accent" />
          <span>Continue with Google</span>
        </button>

        <div className="text-center mt-6 text-xs text-text-secondary relative z-10">
          Need a fresh canvas?{' '}
          <Link to="/register" className="font-bold text-accent hover:underline">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
