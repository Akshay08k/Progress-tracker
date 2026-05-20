import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { showToast } from '../store/uiSlice';
import { type Habit, calculateStreak } from '../store/habitsSlice';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, where, getDoc } from 'firebase/firestore';
import {
  IoAddOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoFlameOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoCalendarOutline,
  IoTrendingUpOutline,
  IoPeopleOutline,
} from 'react-icons/io5';

const HABIT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

const HABIT_ICONS = ['💪', '📚', '🏃', '💧', '🧘', '✍️', '🎯', '💤', '🥗', '🎵'];

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const habits = useAppSelector((state) => state.habits.items);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState(HABIT_COLORS[0]);
  const [formIcon, setFormIcon] = useState(HABIT_ICONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buddy system states
  const [partnerUidInput, setPartnerUidInput] = useState('');
  const [buddyData, setBuddyData] = useState<any>(null);
  const [incomingInvites, setIncomingInvites] = useState<any[]>([]);
  const [outgoingInvite, setOutgoingInvite] = useState<any>(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showBuddySection, setShowBuddySection] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Single source of truth: Firestore snapshot listener
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Habit[];
      dispatch({ type: 'habits/setHabits', payload: habitList });
    }, (error) => {
      console.error('Habits snapshot error:', error);
    });

    return () => unsubscribe();
  }, [user?.uid, dispatch]);

  // Buddy system listeners
  useEffect(() => {
    if (!user?.buddyUid) {
      setBuddyData(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', user.buddyUid), (docSnap) => {
      if (docSnap.exists()) {
        setBuddyData(docSnap.data());
      }
    });
    return () => unsub();
  }, [user?.buddyUid]);

  useEffect(() => {
    if (!user?.uid) return;

    const qIn = query(
      collection(db, 'buddyInvites'),
      where('receiverUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubIn = onSnapshot(qIn, (snap) => {
      setIncomingInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qOut = query(
      collection(db, 'buddyInvites'),
      where('senderUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubOut = onSnapshot(qOut, (snap) => {
      if (!snap.empty) {
        setOutgoingInvite({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setOutgoingInvite(null);
      }
    });

    return () => {
      unsubIn();
      unsubOut();
    };
  }, [user?.uid]);

  // Buddy actions
  const handleSendInvite = async () => {
    if (!user?.uid) return;
    const target = partnerUidInput.trim();
    if (!target) {
      dispatch(showToast({ message: 'Please enter a valid partner UID.', type: 'error' }));
      return;
    }
    if (target === user.uid) {
      dispatch(showToast({ message: 'You cannot invite yourself!', type: 'error' }));
      return;
    }
    if (user.buddyUid) {
      dispatch(showToast({ message: 'You are already linked to a buddy.', type: 'error' }));
      return;
    }

    setSendingInvite(true);
    try {
      const targetUserDoc = await getDoc(doc(db, 'users', target));
      if (!targetUserDoc.exists()) {
        dispatch(showToast({ message: 'No user found with that UID.', type: 'error' }));
        setSendingInvite(false);
        return;
      }

      const targetData = targetUserDoc.data();
      if (targetData.buddyUid) {
        dispatch(showToast({ message: 'This user is already linked with a buddy.', type: 'error' }));
        setSendingInvite(false);
        return;
      }

      await addDoc(collection(db, 'buddyInvites'), {
        senderUid: user.uid,
        senderName: user.displayName || 'User',
        receiverUid: target,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'notifications'), {
        userId: target,
        title: 'Streak Buddy Invitation',
        body: `${user.displayName || 'A user'} invited you to be their Streak Buddy!`,
        type: 'streak_buddy',
        read: false,
        createdAt: new Date().toISOString()
      });

      dispatch(showToast({ message: 'Invitation sent!', type: 'success' }));
      setPartnerUidInput('');
    } catch (e) {
      dispatch(showToast({ message: 'Failed to send invitation.', type: 'error' }));
    } finally {
      setSendingInvite(false);
    }
  };

  const handleAcceptInvite = async (invite: any) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'buddyInvites', invite.id), { status: 'accepted' });
      await updateDoc(doc(db, 'users', user.uid), { buddyUid: invite.senderUid });
      await updateDoc(doc(db, 'users', invite.senderUid), { buddyUid: user.uid });

      await addDoc(collection(db, 'notifications'), {
        userId: invite.senderUid,
        title: 'Streak Buddy Connected!',
        body: `${user.displayName || 'Your buddy'} accepted your request!`,
        type: 'streak_buddy',
        read: false,
        createdAt: new Date().toISOString()
      });

      dispatch(showToast({ message: 'Buddy connected!', type: 'success' }));
    } catch (e) {
      dispatch(showToast({ message: 'Failed to accept invitation.', type: 'error' }));
    }
  };

  const handleDeclineInvite = async (invite: any) => {
    try {
      await updateDoc(doc(db, 'buddyInvites', invite.id), { status: 'declined' });
      dispatch(showToast({ message: 'Invitation declined.', type: 'info' }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelInvite = async (invite: any) => {
    try {
      await updateDoc(doc(db, 'buddyInvites', invite.id), { status: 'declined' });
      dispatch(showToast({ message: 'Invitation cancelled.', type: 'info' }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlinkBuddy = async () => {
    if (!user?.uid || !user?.buddyUid) return;
    const oldBuddyUid = user.buddyUid;
    try {
      await updateDoc(doc(db, 'users', user.uid), { buddyUid: null });
      await updateDoc(doc(db, 'users', oldBuddyUid), { buddyUid: null });

      await addDoc(collection(db, 'notifications'), {
        userId: oldBuddyUid,
        title: 'Streak Buddy Unlinked',
        body: `${user.displayName || 'Your partner'} unlinked their account.`,
        type: 'streak_buddy',
        read: false,
        createdAt: new Date().toISOString()
      });

      dispatch(showToast({ message: 'Buddy unlinked.', type: 'success' }));
    } catch (e) {
      dispatch(showToast({ message: 'Failed to unlink.', type: 'error' }));
    }
  };

  // Habit CRUD - only write to Firestore, let snapshot update Redux
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !user?.uid || isSubmitting) return;

    setIsSubmitting(true);
    const habitData = {
      userId: user.uid,
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
      icon: formIcon,
      completions: [],
      createdAt: new Date().toISOString(),
      archived: false,
    };

    try {
      await addDoc(collection(db, 'habits'), habitData);
      dispatch(showToast({ message: 'Habit created!', type: 'success' }));
      handleCloseModal();
    } catch (err) {
      dispatch(showToast({ message: 'Failed to create habit', type: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !formName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const updates = {
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
      icon: formIcon,
    };

    try {
      await updateDoc(doc(db, 'habits', editingHabit.id), updates);
      dispatch(showToast({ message: 'Habit updated!', type: 'success' }));
      handleCloseModal();
    } catch (err) {
      dispatch(showToast({ message: 'Failed to update habit', type: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!window.confirm('Delete this habit?')) return;
    try {
      await deleteDoc(doc(db, 'habits', id));
      dispatch(showToast({ message: 'Habit deleted', type: 'info' }));
    } catch (err) {
      dispatch(showToast({ message: 'Failed to delete habit', type: 'error' }));
    }
  };

  const handleToggleToday = useCallback(async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const existingIdx = habit.completions.findIndex(c => c.date === today);
    let newCompletions: { date: string; completed: boolean }[];
    
    if (existingIdx !== -1) {
      newCompletions = habit.completions.map((c, i) => 
        i === existingIdx ? { ...c, completed: !c.completed } : c
      );
    } else {
      newCompletions = [...habit.completions, { date: today, completed: true }];
    }

    try {
      await updateDoc(doc(db, 'habits', habitId), { completions: newCompletions });
    } catch (err) {
      dispatch(showToast({ message: 'Failed to update', type: 'error' }));
    }
  }, [habits, today, dispatch]);

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormName(habit.name);
    setFormDescription(habit.description);
    setFormColor(habit.color);
    setFormIcon(habit.icon);
    setShowCreateModal(true);
  };

  const handleOpenCreate = () => {
    setEditingHabit(null);
    setFormName('');
    setFormDescription('');
    setFormColor(HABIT_COLORS[0]);
    setFormIcon(HABIT_ICONS[0]);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingHabit(null);
    setIsSubmitting(false);
  };

  const activeHabits = habits.filter(h => !h.archived);
  const completedToday = activeHabits.filter(h => 
    h.completions.some(c => c.date === today && c.completed)
  ).length;
  const totalActive = activeHabits.length;
  const bestStreak = activeHabits.length > 0 
    ? Math.max(0, ...activeHabits.map(h => calculateStreak(h.completions)))
    : 0;

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        day: d.getDate(),
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
            {user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-text-secondary mt-1">
            {completedToday === totalActive && totalActive > 0
              ? "All habits completed today! Amazing work!"
              : `${completedToday} of ${totalActive} habits completed today`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBuddySection(!showBuddySection)}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-background-surface transition-colors text-text-primary"
          >
            <IoPeopleOutline className="text-lg" />
            <span className="text-sm">Buddy</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors"
          >
            <IoAddOutline className="text-xl" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background-surface rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl">
              <IoFlameOutline className="text-orange-500 text-xl" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Best Streak</p>
              <p className="text-2xl font-bold text-text-primary">{bestStreak} days</p>
            </div>
          </div>
        </div>
        <div className="bg-background-surface rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 rounded-xl">
              <IoCheckmarkOutline className="text-green-500 text-xl" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Completed Today</p>
              <p className="text-2xl font-bold text-text-primary">{completedToday}/{totalActive}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-surface rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-xl">
              <IoTrendingUpOutline className="text-accent text-xl" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Completion Rate</p>
              <p className="text-2xl font-bold text-text-primary">
                {totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buddy Section */}
      {showBuddySection && (
        <div className="bg-background-surface rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <IoPeopleOutline className="text-xl text-accent" />
            <h3 className="font-semibold text-text-primary">Streak Buddy</h3>
          </div>

          {!user?.buddyUid && !outgoingInvite && incomingInvites.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">Connect with a friend to share streaks and stay accountable.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={partnerUidInput}
                  onChange={(e) => setPartnerUidInput(e.target.value)}
                  placeholder="Enter their User ID..."
                  disabled={sendingInvite}
                  className="flex-1 px-4 py-2 border border-border rounded-xl bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent text-sm placeholder:text-text-secondary/40"
                />
                <button
                  onClick={handleSendInvite}
                  disabled={sendingInvite}
                  className="px-5 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {sendingInvite ? 'Sending...' : 'Invite'}
                </button>
              </div>
            </div>
          )}

          {!user?.buddyUid && outgoingInvite && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Invite sent to: <span className="font-mono text-xs bg-background-primary px-2 py-1 rounded text-text-primary">{outgoingInvite.receiverUid}</span>
              </p>
              <button
                onClick={() => handleCancelInvite(outgoingInvite)}
                className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-sm hover:bg-red-500/10 transition-colors"
              >
                Cancel Invite
              </button>
            </div>
          )}

          {!user?.buddyUid && incomingInvites.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">You have a pending invite from:</p>
              {incomingInvites.map((invite) => (
                <div key={invite.id} className="p-4 bg-background-primary border border-border rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-text-primary">{invite.senderName}</div>
                    <div className="text-xs text-text-secondary font-mono truncate max-w-[200px]">{invite.senderUid}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvite(invite)}
                      className="p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                    >
                      <IoCheckmarkOutline />
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(invite)}
                      className="p-2 border border-border rounded-lg hover:bg-background-surface transition-colors text-text-secondary"
                    >
                      <IoCloseOutline />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user?.buddyUid && buddyData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background-primary border border-border rounded-xl text-center">
                  <div className="text-xs text-accent font-medium uppercase mb-2">You</div>
                  <div className="font-semibold text-text-primary">{user.displayName}</div>
                  <div className="text-2xl font-bold text-orange-500 mt-2 flex items-center justify-center gap-1">
                    <IoFlameOutline /> {user.streak || 0}
                  </div>
                </div>
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl text-center">
                  <div className="text-xs text-accent font-medium uppercase mb-2">Buddy</div>
                  <div className="font-semibold text-text-primary">{buddyData.displayName || 'Buddy'}</div>
                  <div className="text-2xl font-bold text-orange-500 mt-2 flex items-center justify-center gap-1">
                    <IoFlameOutline /> {buddyData.streak || 0}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-background-primary border border-border rounded-xl text-center text-sm text-text-primary">
                {user.streak > (buddyData.streak || 0) && "You're leading! Keep it up!"}
                {user.streak < (buddyData.streak || 0) && `${buddyData.displayName || 'Buddy'} is leading with ${buddyData.streak} days!`}
                {user.streak === (buddyData.streak || 0) && `Tied at ${user.streak} days! Thread synced!`}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUnlinkBuddy}
                  className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl text-sm hover:bg-red-500/10 transition-colors"
                >
                  Unlink Buddy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Habits List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Your Habits</h2>
        {activeHabits.length === 0 ? (
          <div className="text-center py-16 bg-background-surface rounded-xl border border-border">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-text-primary">No habits yet</h3>
            <p className="text-text-secondary mt-1 mb-6">Start building better routines, one habit at a time</p>
            <button
              onClick={handleOpenCreate}
              className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors"
            >
              Create your first habit
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeHabits.map((habit) => {
              const streak = calculateStreak(habit.completions);
              const isCompletedToday = habit.completions.some(c => c.date === today && c.completed);
              
              return (
                <div
                  key={habit.id}
                  className={`bg-background-surface rounded-xl p-4 border transition-all ${
                    isCompletedToday ? 'border-green-500/30' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleToday(habit.id)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isCompletedToday
                          ? 'bg-green-500 text-white'
                          : 'border-2 border-border hover:border-accent'
                      }`}
                    >
                      {isCompletedToday ? (
                        <IoCheckmarkOutline className="text-2xl" />
                      ) : (
                        <span className="text-2xl">{habit.icon}</span>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-text-primary ${isCompletedToday ? 'line-through text-text-secondary' : ''}`}>
                        {habit.name}
                      </h3>
                      {habit.description && (
                        <p className="text-sm text-text-secondary truncate">{habit.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500">
                          <IoFlameOutline />
                          <span className="font-bold text-sm">{streak}</span>
                        </div>
                      )}

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEdit(habit)}
                          className="p-2 hover:bg-background-primary rounded-lg transition-colors"
                        >
                          <IoPencilOutline className="text-text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <IoTrashOutline className="text-text-secondary hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Last 7 days */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <IoCalendarOutline className="text-text-secondary text-sm" />
                    <div className="flex gap-1.5">
                      {last7Days.map((day) => {
                        const completed = habit.completions.some(
                          c => c.date === day.date && c.completed
                        );
                        const isToday = day.date === today;
                        return (
                          <div
                            key={day.date}
                            className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-xs ${
                              completed
                                ? 'bg-accent text-white'
                                : isToday
                                ? 'border border-accent/30 bg-accent/5'
                                : 'bg-background-primary text-text-secondary'
                            }`}
                          >
                            <span className="text-[9px] opacity-75">{day.label[0]}</span>
                            <span className="font-medium -mt-0.5">{day.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-background-surface rounded-2xl w-full max-w-md p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text-primary">
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-background-primary rounded-lg transition-colors text-text-secondary"
              >
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            <form onSubmit={editingHabit ? handleUpdateHabit : handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Habit Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Morning Exercise"
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-secondary/40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g., 30 minutes of cardio"
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-secondary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {HABIT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormIcon(icon)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        formIcon === icon
                          ? 'bg-accent/10 ring-2 ring-accent'
                          : 'bg-background-primary hover:bg-background-primary/80'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {HABIT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        formColor === color
                          ? 'ring-2 ring-offset-2 ring-accent'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl font-medium hover:bg-background-primary transition-colors text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingHabit ? 'Save Changes' : 'Create Habit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
