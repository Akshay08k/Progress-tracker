import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleMoodLog, showToast } from '../../store/uiSlice';
import { earnXp } from '../../store/profileSlice';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { IoCloseOutline } from 'react-icons/io5';

interface MoodOption {
  value: number;
  emoji: string;
  label: string;
  color: string;
}

export const MoodLog: React.FC = () => {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.moodLogOpen);
  const user = useAppSelector((state) => state.auth.user);

  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const moodOptions: MoodOption[] = [
    { value: 1, emoji: '😢', label: 'Struggling', color: 'hover:border-red-500 hover:bg-red-500/10' },
    { value: 2, emoji: '😕', label: 'Stressed', color: 'hover:border-orange-500 hover:bg-orange-500/10' },
    { value: 3, emoji: '😐', label: 'Neutral', color: 'hover:border-yellow-500 hover:bg-yellow-500/10' },
    { value: 4, emoji: '🙂', label: 'Focused', color: 'hover:border-green-500 hover:bg-green-500/10' },
    { value: 5, emoji: '😎', label: 'Flow State', color: 'hover:border-accent hover:bg-accent/10' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) {
      dispatch(showToast({ message: 'Please select a mood level.', type: 'warning' }));
      return;
    }

    setSubmitting(true);
    try {
      const moodEntry = {
        userId: user?.uid || 'anonymous',
        mood: selectedMood,
        note,
        createdAt: new Date().toISOString(),
      };

      // 1. Save entry to Firestore
      if (user?.uid) {
        await addDoc(collection(db, 'moods'), moodEntry);
        
        // 2. Award XP
        dispatch(earnXp(5));
        const userRef = doc(db, 'users', user.uid);
        const newXp = (user.xp || 0) + 5;
        await updateDoc(userRef, { xp: newXp });
      }

      dispatch(showToast({ message: 'Mood logged successfully! Gained +5 XP!', type: 'success' }));
      dispatch(toggleMoodLog(false));
      setSelectedMood(null);
      setNote('');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to submit mood log.';
      dispatch(showToast({ message: msg, type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div 
        className="w-full max-w-md bg-background-surface border-4 border-double border-accent rounded-2xl shadow-floating p-6 relative"
        style={{ clipPath: 'polygon(0% 1%, 100% 0%, 97% 99%, 2% 97%)' }}
      >
        <div className="absolute inset-1.5 border border-dashed border-accent/40 rounded-xl pointer-events-none"></div>

        <button
          onClick={() => dispatch(toggleMoodLog(false))}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-background-primary transition-all focus:outline-none z-10"
        >
          <IoCloseOutline className="text-xl" />
        </button>

        <div className="relative z-10">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold tracking-wider text-accent uppercase font-mono-stats">
              DAILY MOOD REFLECTION
            </span>
            <h3 className="text-lg font-bold text-text-primary uppercase mt-1">
              How is your focus canvas today?
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Reflecting on your mood builds awareness. Earn +5 XP.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid of emojis */}
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedMood(opt.value)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                    ${selectedMood === opt.value ? 'border-accent bg-accent/10 scale-105 shadow-orbital' : 'border-border-stitch bg-background-primary text-text-secondary'}
                    ${opt.color}
                  `}
                >
                  <span className="text-3xl filter drop-shadow-sm mb-1">{opt.emoji}</span>
                  <span className="text-[9px] font-semibold text-center leading-none">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Note text field */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-2 tracking-wide">
                Optional Journal Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="What is shaping your focus state today? Write a simple line..."
                className="w-full p-3 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedMood}
              className="w-full bg-accent border-2 border-double border-white py-3 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase shadow-orbital hover:shadow-floating transition-all active:scale-95 duration-200 disabled:opacity-40 disabled:pointer-events-none"
            >
              {submitting ? 'Logging Mindset...' : 'Lock Mindset Log'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MoodLog;
