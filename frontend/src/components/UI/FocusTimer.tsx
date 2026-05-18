import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleFocusTimer, showToast } from '../../store/uiSlice';
import { earnXp } from '../../store/profileSlice';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { IoPlayOutline, IoPauseOutline, IoReloadOutline, IoCloseOutline } from 'react-icons/io5';

export const FocusTimer: React.FC = () => {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.focusTimerOpen);
  const user = useAppSelector((state) => state.auth.user);

  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Use refs for isBreak / user so callbacks are always fresh without re-creating intervals
  const isBreakRef = useRef(isBreak);
  isBreakRef.current = isBreak;
  const userRef = useRef(user);
  userRef.current = user;

  const handleTimerComplete = useCallback(async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Play alert sound via Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Could not synthesize sound:', e);
    }

    if (!isBreakRef.current) {
      dispatch(showToast({ message: 'Focus Session Completed! Gained +15 XP! 🧵', type: 'success' }));
      dispatch(earnXp(15));

      if (userRef.current?.uid) {
        try {
          const userDocRef = doc(db, 'users', userRef.current.uid);
          const newXp = (userRef.current.xp || 0) + 15;
          await updateDoc(userDocRef, { xp: newXp });
        } catch (e) {
          console.error('Failed to sync timer XP to Firestore:', e);
        }
      }

      isBreakRef.current = true;
      setIsBreak(true);
      setMinutes(5);
      setSeconds(0);
    } else {
      dispatch(showToast({ message: 'Break completed! Time to focus!', type: 'info' }));
      isBreakRef.current = false;
      setIsBreak(false);
      setMinutes(25);
      setSeconds(0);
    }
  }, [dispatch]);

  // Countdown tick effect
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev > 0) return prev - 1;
        // Seconds hit 0 — try to decrement minutes
        setMinutes(prevMin => {
          if (prevMin > 0) return prevMin - 1;
          return 0; // timer at 0:00 — completion handled by the watcher below
        });
        return 59;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // Completion watcher — fires when both reach 0 while active
  useEffect(() => {
    if (isActive && minutes === 0 && seconds === 0) {
      handleTimerComplete();
    }
  }, [minutes, seconds, isActive, handleTimerComplete]);

  const handleToggle = () => {
    setIsActive(prev => !prev);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsBreak(false);
    setMinutes(25);
    setSeconds(0);
  };

  if (!open) return null;

  const totalTime = isBreak ? 5 * 60 : 25 * 60;
  const remainingTime = minutes * 60 + seconds;
  const progressPercentage = Math.round(((totalTime - remainingTime) / totalTime) * 100);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div
        className="w-full max-w-sm bg-background-surface border-4 border-double border-accent rounded-2xl shadow-floating p-6 relative text-center"
        style={{ clipPath: 'polygon(1% 0%, 98% 3%, 99% 97%, 0% 99%)' }}
      >
        {/* Border stitches guide line */}
        <div className="absolute inset-1.5 border border-dashed border-accent/40 rounded-xl pointer-events-none"></div>

        <button
          onClick={() => dispatch(toggleFocusTimer(false))}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-background-primary transition-all focus:outline-none z-10"
        >
          <IoCloseOutline className="text-xl" />
        </button>

        <div className="relative z-10 py-4">
          <span className="text-[10px] font-bold tracking-wider text-accent uppercase font-mono-stats">
            {isBreak ? '☕ REST BREAK' : '🎯 FOCUS MODE'}
          </span>

          {/* Circular SVG progress meter */}
          <div className="relative w-48 h-48 mx-auto my-6 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                className="stroke-background-primary"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                className="stroke-accent"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="502"
                strokeDashoffset={502 - (502 * progressPercentage) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold tracking-tighter text-text-primary font-mono-stats">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold text-text-secondary mt-1">
                {isBreak ? 'Relax & Breathe' : 'Keep Stitching'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handleReset}
              className="p-3 rounded-full border border-border-stitch hover:bg-background-primary text-text-secondary hover:text-accent transition-all duration-200"
              title="Reset Timer"
            >
              <IoReloadOutline className="text-lg" />
            </button>

            <button
              onClick={handleToggle}
              className="px-8 py-3 rounded-full bg-accent border-2 border-double border-white text-white font-extrabold text-xs tracking-wider uppercase flex items-center gap-2 shadow-orbital transition-all hover:shadow-floating active:scale-95"
            >
              {isActive ? (
                <>
                  <IoPauseOutline className="text-base" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <IoPlayOutline className="text-base" />
                  <span>Start Focus</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
