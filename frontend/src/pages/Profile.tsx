import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { updateProfileSuccess } from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { Card } from '../components/UI/Card';
import { FabricBadge } from '../components/UI/FabricBadge';
import { db, storage } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { IoPersonOutline, IoCloudUploadOutline, IoMailOutline, IoCalendarOutline, IoLocationOutline, IoSparklesOutline } from 'react-icons/io5';

export const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  // Profile Form States
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [optInDaily, setOptInDaily] = useState(user?.preferences?.dailySummary ?? true);
  const [optInWeekly, setOptInWeekly] = useState(user?.preferences?.weeklyDigest ?? true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    // Check size limit (e.g. 2MB)
    if (file.size > 2 * 1024 * 1024) {
      dispatch(showToast({ message: 'Avatar image must be under 2MB size.', type: 'error' }));
      return;
    }

    setUploading(true);
    try {
      const avatarRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(avatarRef, file);
      const downloadURL = await getDownloadURL(avatarRef);

      // Update in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: downloadURL });

      // Sync local Redux session
      dispatch(updateProfileSuccess({ displayName: user.displayName, photoURL: downloadURL }));
      dispatch(showToast({ message: 'Profile photo uploaded successfully!', type: 'success' }));
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Avatar upload failed.';
      dispatch(showToast({ message: msg, type: 'error' }));
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      dispatch(showToast({ message: 'Display name cannot be empty.', type: 'warning' }));
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

        dispatch(showToast({ message: 'Profile settings updated successfully!', type: 'success' }));
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Settings update failed.';
      dispatch(showToast({ message: msg, type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight uppercase font-mono-stats">
          USER PROFILE SETTINGS
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Customize your dashboard display name, update avatar icons, and configure recap email subscriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Avatar & Gamification Card */}
        <Card className="text-center flex flex-col items-center justify-between" padding="p-6">
          <div className="space-y-4 w-full flex flex-col items-center">
            <div className="relative w-28 h-28 rounded-full border-4 border-double border-accent bg-background-primary flex items-center justify-center overflow-hidden group shadow-orbital">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl text-accent font-extrabold font-mono-stats">
                  {user?.displayName?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Upload Overlay hover panel */}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold uppercase cursor-pointer transition-opacity">
                <IoCloudUploadOutline className="text-xl mb-1" />
                <span>{uploading ? 'Uploading...' : 'Replace'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase">{user?.displayName}</h3>
              <span className="text-[10px] text-text-secondary font-mono-stats">{user?.email}</span>
            </div>

            <div className="mt-1 w-full max-w-[220px] bg-background-primary/50 border border-border-stitch rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 text-[9px] font-mono-stats text-text-secondary">
              <span className="truncate" title={user?.uid}>UID: {user?.uid}</span>
              <button
                type="button"
                onClick={() => {
                  if (user?.uid) {
                    navigator.clipboard.writeText(user.uid);
                    setCopied(true);
                    dispatch(showToast({ message: 'User ID copied to clipboard!', type: 'success' }));
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="text-accent hover:text-accent/80 shrink-0 font-bold uppercase transition-colors"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <FabricBadge level={user?.level || 1} xp={user?.xp || 0} />
          </div>

          <div className="w-full pt-4 border-t border-dashed border-border-stitch mt-6 text-[10px] text-text-secondary space-y-2.5 text-left font-mono-stats">
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="text-sm text-accent" />
              <span>Joined: {new Date(user?.createdAt || '').toLocaleDateString()}</span>
            </div>

            {user?.lastLoginIP && (
              <div className="flex items-center gap-2">
                <IoLocationOutline className="text-sm text-red-500" />
                <span>Last Secure IP: {user?.lastLoginIP}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <IoSparklesOutline className="text-sm text-yellow-500" />
              <span>System Role: <span className="uppercase text-accent font-bold">{user?.role}</span></span>
            </div>
          </div>
        </Card>

        {/* Right Column: Settings Form Fields */}
        <Card className="lg:col-span-2" stitched={true} padding="p-6">
          <div className="mb-6 flex items-center gap-1.5">
            <IoPersonOutline className="text-accent text-lg" />
            <h3 className="text-xs font-extrabold text-text-primary uppercase">Canvas Profile Options</h3>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">
                  Account Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/50">
                    <IoMailOutline />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background-primary/50 border border-border-stitch text-xs text-text-secondary cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">
                  Display Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary/60">
                    <IoPersonOutline />
                  </span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="E.g. Captain Stitch"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email preference selectors */}
            <div className="border-t border-b border-dashed border-border-stitch py-4 space-y-3">
              <span className="text-[9px] font-bold text-accent uppercase font-mono-stats block">
                Security & Recap Subscriptions
              </span>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="profileOptInDaily"
                  checked={optInDaily}
                  onChange={(e) => setOptInDaily(e.target.checked)}
                  className="rounded bg-background-primary border-border-stitch text-accent focus:ring-accent w-4 h-4 cursor-pointer mt-0.5"
                />
                <div>
                  <label htmlFor="profileOptInDaily" className="text-xs font-bold text-text-primary uppercase cursor-pointer select-none">
                    Receive Daily Recap Reports (9 PM)
                  </label>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    An automated summary detailing your task completions, streak rates, and tomorrow's upcoming items.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="profileOptInWeekly"
                  checked={optInWeekly}
                  onChange={(e) => setOptInWeekly(e.target.checked)}
                  className="rounded bg-background-primary border-border-stitch text-accent focus:ring-accent w-4 h-4 cursor-pointer mt-0.5"
                />
                <div>
                  <label htmlFor="profileOptInWeekly" className="text-xs font-bold text-text-primary uppercase cursor-pointer select-none">
                    Receive Weekly Progress Digests (Sunday 6 PM)
                  </label>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    A comprehensive report mapping completion rates, peak focus categories, experience totals, and streaks.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-accent border border-white text-white font-extrabold text-xs px-8 py-3 rounded-lg uppercase tracking-wider shadow-orbital hover:shadow-floating transition-all active:scale-95 duration-200"
            >
              {saving ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </form>
        </Card>
      </div>

    </div>
  );
};

export default Profile;
