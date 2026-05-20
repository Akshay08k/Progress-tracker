import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { updateProfileSuccess } from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { db, storage } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getXpProgressPercentage } from '../utils/xp';
import {
  IoPersonOutline,
  IoCloudUploadOutline,
  IoMailOutline,
  IoCalendarOutline,
  IoFlameOutline,
  IoTrophyOutline,
  IoStarOutline,
} from 'react-icons/io5';

const LEVEL_TITLES = [
  'Novice Weaver', 'Thread Starter', 'Pattern Learner', 'Stitch Apprentice',
  'Fabric Builder', 'Canvas Crafter', 'Design Specialist', 'Master Tailor',
  'Grand Artisan', 'Legend Weaver',
];

const getLevelTitle = (level: number) => {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
};

export const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [optInDaily, setOptInDaily] = useState(user?.preferences?.dailySummary ?? true);
  const [optInWeekly, setOptInWeekly] = useState(user?.preferences?.weeklyDigest ?? true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentXp = user?.xp || 0;
  const currentLvl = user?.level || 1;
  const progressPercent = getXpProgressPercentage(currentXp, currentLvl);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    if (file.size > 2 * 1024 * 1024) {
      dispatch(showToast({ message: 'Image must be under 2MB.', type: 'error' }));
      return;
    }

    setUploading(true);
    try {
      const avatarRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(avatarRef, file);
      const downloadURL = await getDownloadURL(avatarRef);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: downloadURL });

      dispatch(updateProfileSuccess({ displayName: user.displayName, photoURL: downloadURL }));
      dispatch(showToast({ message: 'Photo updated!', type: 'success' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      dispatch(showToast({ message: msg, type: 'error' }));
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      dispatch(showToast({ message: 'Name cannot be empty.', type: 'warning' }));
      return;
    }

    setSaving(true);
    try {
      if (user?.uid) {
        const userRef = doc(db, 'users', user.uid);
        const updatedFields = {
          displayName,
          preferences: {
            dailySummary: optInDaily,
            weeklyDigest: optInWeekly
          }
        };

        await updateDoc(userRef, updatedFields);
        dispatch(updateProfileSuccess({
          displayName,
          photoURL: user.photoURL,
          preferences: updatedFields.preferences
        }));

        dispatch(showToast({ message: 'Profile updated!', type: 'success' }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed.';
      dispatch(showToast({ message: msg, type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar & XP Card */}
        <div className="bg-background-surface rounded-xl border border-border p-6 flex flex-col items-center space-y-4">
          {/* Avatar */}
          <div className="relative w-24 h-24 rounded-full border-4 border-accent/20 bg-background-primary flex items-center justify-center overflow-hidden group">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-3xl font-bold text-accent">
                {user?.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs cursor-pointer transition-opacity">
              <IoCloudUploadOutline className="text-xl mb-1" />
              <span>{uploading ? 'Uploading...' : 'Change'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-text-primary">{user?.displayName}</h3>
            <p className="text-sm text-text-secondary">{user?.email}</p>
          </div>

          {/* UID Copy */}
          <div className="w-full bg-background-primary border border-border rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs text-text-secondary">
            <span className="truncate font-mono" title={user?.uid}>ID: {user?.uid?.slice(0, 8)}...</span>
            <button
              type="button"
              onClick={() => {
                if (user?.uid) {
                  navigator.clipboard.writeText(user.uid);
                  setCopied(true);
                  dispatch(showToast({ message: 'ID copied!', type: 'success' }));
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="text-accent font-medium shrink-0"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* XP & Level Card */}
          <div className="w-full bg-accent/10 border border-accent/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <IoTrophyOutline className="text-accent text-lg" />
              <span className="text-sm font-medium text-text-primary">Level {currentLvl}</span>
              <span className="text-xs text-text-secondary">- {getLevelTitle(currentLvl)}</span>
            </div>

            {/* XP Progress Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1 text-text-secondary">
                <span>{currentXp} XP</span>
                <span className="text-accent font-medium">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-background-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-accent/10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-orange-500 font-bold">
                  <IoFlameOutline className="text-sm" />
                  {user?.streak || 0}
                </div>
                <div className="text-[10px] text-text-secondary">Streak</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-accent font-bold">
                  <IoStarOutline className="text-sm" />
                  {currentXp}
                </div>
                <div className="text-[10px] text-text-secondary">Total XP</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-accent font-bold">
                  <IoTrophyOutline className="text-sm" />
                  {currentLvl}
                </div>
                <div className="text-[10px] text-text-secondary">Level</div>
              </div>
            </div>
          </div>

          {/* Member Info */}
          <div className="w-full space-y-2 text-sm text-text-secondary pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="text-accent" />
              <span>Joined {new Date(user?.createdAt || '').toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Settings Form */}
        <div className="lg:col-span-2 bg-background-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <IoPersonOutline className="text-accent text-lg" />
            <h3 className="font-semibold text-text-primary">Account Settings</h3>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/50">
                    <IoMailOutline />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background-primary/50 border border-border text-sm text-text-secondary cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/50">
                    <IoPersonOutline />
                  </span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background-primary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-secondary/40"
                  />
                </div>
              </div>
            </div>

            {/* Email Preferences */}
            <div className="border-t border-b border-border py-4 space-y-3">
              <span className="text-xs font-medium text-accent uppercase">Email Notifications</span>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="optInDaily"
                  checked={optInDaily}
                  onChange={(e) => setOptInDaily(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer mt-0.5"
                />
                <div>
                  <label htmlFor="optInDaily" className="text-sm font-medium text-text-primary cursor-pointer select-none">
                    Daily Recap (9 PM)
                  </label>
                  <p className="text-xs text-text-secondary mt-0.5">Summary of your habit completions and tomorrow's plan.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="optInWeekly"
                  checked={optInWeekly}
                  onChange={(e) => setOptInWeekly(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer mt-0.5"
                />
                <div>
                  <label htmlFor="optInWeekly" className="text-sm font-medium text-text-primary cursor-pointer select-none">
                    Weekly Digest (Sunday 6 PM)
                  </label>
                  <p className="text-xs text-text-secondary mt-0.5">Weekly progress report with streaks and completion rates.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-accent hover:bg-accent/90 text-white font-medium px-8 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
