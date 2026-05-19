import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleMoodLog, toggleFocusTimer, showToast } from '../store/uiSlice';
import { Card } from '../components/UI/Card';
import { FabricBadge } from '../components/UI/FabricBadge';
import { StitchProgressBar } from '../components/UI/StitchProgressBar';
import { getXpProgressPercentage } from '../utils/xp';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  IoFlameOutline, IoTimeOutline, IoJournalOutline,
  IoAlertCircleOutline, IoExtensionPuzzleOutline, IoSparklesOutline, IoPeopleOutline,
  IoCloseOutline, IoCheckmarkOutline
} from 'react-icons/io5';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Announcement {
  message: string;
  active: boolean;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const tasks = useAppSelector((state) => state.tasks.items);

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  
  // Streak Buddy States
  const [partnerUidInput, setPartnerUidInput] = useState('');
  const [buddyData, setBuddyData] = useState<any>(null);
  const [incomingInvites, setIncomingInvites] = useState<any[]>([]);
  const [outgoingInvite, setOutgoingInvite] = useState<any>(null);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Sync completed tasks to user's xpHistory once on dashboard load if empty
  useEffect(() => {
    const syncXpHistory = async () => {
      if (!user?.uid || (user.xpHistory && user.xpHistory.length > 0)) return;
      
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      });

      const dailyCompletedXp: { [date: string]: number } = {};
      
      tasks.forEach(task => {
        if (task.completed && !task.isDeleted && task.dueDate && last7Days.includes(task.dueDate)) {
          dailyCompletedXp[task.dueDate] = (dailyCompletedXp[task.dueDate] || 0) + 10;
        }
      });

      const initialHistory = last7Days.map(date => ({
        date,
        xp: dailyCompletedXp[date] || 0
      })).filter(h => h.xp > 0);

      if (initialHistory.length > 0) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            xpHistory: initialHistory
          });
        } catch (e) {
          console.error('Failed to seed xpHistory from tasks:', e);
        }
      }
    };

    if (tasks.length > 0 && user) {
      syncXpHistory();
    }
  }, [user, tasks]);

  // Real-time Buddy Data observer
  useEffect(() => {
    if (!user?.buddyUid) {
      setBuddyData(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', user.buddyUid), (docSnap) => {
      if (docSnap.exists()) {
        setBuddyData(docSnap.data());
      }
    }, (error) => {
      console.warn('Buddy sync warning:', error);
    });
    return () => unsub();
  }, [user?.buddyUid]);

  // Real-time Invites observer
  useEffect(() => {
    if (!user?.uid) return;

    // Incoming invites
    const qIn = query(
      collection(db, 'buddyInvites'),
      where('receiverUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubIn = onSnapshot(qIn, (snap) => {
      setIncomingInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.warn('Incoming invites sync warning:', error);
    });

    // Outgoing invites
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
    }, (error) => {
      console.warn('Outgoing invite sync warning:', error);
    });

    return () => {
      unsubIn();
      unsubOut();
    };
  }, [user?.uid]);

  // Actions for Buddy System
  const handleSendInvite = async () => {
    if (!user?.uid) return;
    const target = partnerUidInput.trim();
    if (!target) {
      dispatch(showToast({ message: 'Please enter a valid partner UID.', type: 'error' }));
      return;
    }
    if (target === user.uid) {
      dispatch(showToast({ message: 'You cannot invite yourself as a buddy!', type: 'error' }));
      return;
    }
    if (user.buddyUid) {
      dispatch(showToast({ message: 'You are already linked to a buddy. Unlink them first.', type: 'error' }));
      return;
    }

    setSendingInvite(true);
    try {
      // Check if target user exists in Firestore
      const targetUserDoc = await getDoc(doc(db, 'users', target));
      if (!targetUserDoc.exists()) {
        dispatch(showToast({ message: 'No registered user found with that UID. Check the ID and try again.', type: 'error' }));
        setSendingInvite(false);
        return;
      }

      const targetData = targetUserDoc.data();
      if (targetData.buddyUid) {
        dispatch(showToast({ message: 'This user is already linked with another buddy.', type: 'error' }));
        setSendingInvite(false);
        return;
      }

      // Add to buddyInvites
      await addDoc(collection(db, 'buddyInvites'), {
        senderUid: user.uid,
        senderName: user.displayName || 'Stitch Member',
        receiverUid: target,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Send real-time notification
      await addDoc(collection(db, 'notifications'), {
        userId: target,
        title: 'Streak Buddy Invitation 🧵',
        body: `${user.displayName || 'A fellow weaver'} invited you to be their Streak Buddy! Accept from your Command Console.`,
        type: 'streak_buddy',
        read: false,
        createdAt: new Date().toISOString()
      });

      dispatch(showToast({ message: 'Streak Buddy invitation sent successfully!', type: 'success' }));
      setPartnerUidInput('');
    } catch (e) {
      console.error(e);
      dispatch(showToast({ message: 'Failed to send invitation.', type: 'error' }));
    } finally {
      setSendingInvite(false);
    }
  };

  const handleAcceptInvite = async (invite: any) => {
    if (!user?.uid) return;
    try {
      // 1. Update invite status in Firestore
      await updateDoc(doc(db, 'buddyInvites', invite.id), { status: 'accepted' });

      // 2. Set buddyUid on both users
      await updateDoc(doc(db, 'users', user.uid), { buddyUid: invite.senderUid });
      await updateDoc(doc(db, 'users', invite.senderUid), { buddyUid: user.uid });

      // 3. Send acceptance notification back to sender
      await addDoc(collection(db, 'notifications'), {
        userId: invite.senderUid,
        title: 'Stitch Buddy Synced! 🤝',
        body: `${user.displayName || 'Your buddy'} accepted your Streak Buddy request! Streaks are now synced.`,
        type: 'streak_buddy',
        read: false,
        createdAt: new Date().toISOString()
      });

      dispatch(showToast({ message: 'Streak Buddy successfully connected!', type: 'success' }));
    } catch (e) {
      console.error(e);
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
      dispatch(showToast({ message: 'Outgoing invitation cancelled.', type: 'info' }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlinkBuddy = async () => {
    if (!user?.uid || !user?.buddyUid) return;
    const oldBuddyUid = user.buddyUid;
    try {
      // 1. Clear buddyUid from both users
      await updateDoc(doc(db, 'users', user.uid), { buddyUid: null });
      await updateDoc(doc(db, 'users', oldBuddyUid), { buddyUid: null });

      // 2. Send notification to the other buddy
      await addDoc(collection(db, 'notifications'), {
        userId: oldBuddyUid,
        title: 'Streak Buddy Unlinked 🧵',
        body: `${user.displayName || 'Your partner'} has disconnected their Streak Buddy account from yours.`,
        type: 'streak_buddy',
        read: false,
        createdAt: new Date().toISOString()
      });

      dispatch(showToast({ message: 'Streak Buddy successfully unlinked.', type: 'success' }));
    } catch (e) {
      console.error(e);
      dispatch(showToast({ message: 'Failed to unlink.', type: 'error' }));
    }
  };

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${backendUrl}/api/admin/announcements`);
        if (res.ok) {
          const data = await res.json();
          if (data.active) {
            setAnnouncement(data);
          }
        }
      } catch (e) {
        console.warn('Could not retrieve active announcements:', e);
      }
    };
    fetchAnnouncement();
  }, []);

  // Compute Task aggregates
  const activeTasks = tasks.filter(t => !t.completed && !t.isDeleted);
  const completedToday = tasks.filter(t => t.completed && !t.isDeleted);
  const totalToday = tasks.filter(t => !t.isDeleted);

  const completionRate = totalToday.length > 0
    ? Math.round((completedToday.length / totalToday.length) * 100)
    : 0;

  // AI Task Coach Tip computation
  const getCoachTip = () => {
    const highPriorityCount = activeTasks.filter(t => t.priority === 'high').length;
    if (highPriorityCount > 1) {
      return `Coach: You have ${highPriorityCount} high-priority tasks in progress. We recommend allocating a 25-minute Pomodoro focus block to resolve your heaviest thread first!`;
    }
    if (activeTasks.length === 0 && totalToday.length > 0) {
      return "Coach: Perfect Stitch! All scheduled canvas nodes have been successfully completed today. Take a break or start a new personal challenge!";
    }
    if (totalToday.length === 0) {
      return "Coach: A blank canvas today. Head over to the Tasks tab to sketch your goals and stitch your first target for today!";
    }
    return "Coach: Steady as she goes! Continue making incremental progress. Switch on the Focus Timer to power through your next node.";
  };

  // Recharts Chart 1: Tasks by Category (Donut Chart)
  const categoryCounts = tasks.reduce((acc: { [key: string]: number }, curr) => {
    if (curr.isDeleted) return acc;
    const cat = curr.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const donutData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#534ab7', '#10b981', '#d85a30', '#7f77dd', '#378add', '#8b5cf6'];

  // Recharts Chart 2: Daily Focus XP (Area Chart - Dynamic last 7 days of focus)
  const getXpHistoryData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = days[d.getDay()];
      
      const historyEntry = user?.xpHistory?.find(h => h.date === dateStr);
      data.push({
        day: dayLabel,
        xp: historyEntry ? historyEntry.xp : 0
      });
    }
    return data;
  };

  const xpHistoryData = getXpHistoryData();

  // XP progression details
  const currentXp = user?.xp || 0;
  const currentLvl = user?.level || 1;
  const progressPercent = getXpProgressPercentage(currentXp, currentLvl);

  return (
    <div className="space-y-6">

      {/* Site Announcement Banner */}
      {announcement && (
        <div className="bg-accent/10 border border-dashed border-accent text-accent px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-orbital animate-pulse">
          <IoAlertCircleOutline className="text-xl shrink-0" />
          <span className="text-xs font-semibold leading-normal">{announcement.message}</span>
        </div>
      )}

      {/* Header Profile Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight uppercase font-mono-stats">
            COMMAND CONSOLE
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Welcome back, <b className="text-text-primary">{user?.displayName || 'StitchXP Member'}</b>. Every stitch counts towards mastery.
          </p>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleMoodLog(true))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-stitch bg-background-surface hover:border-accent text-text-secondary hover:text-accent font-bold text-xs shadow-orbital hover:shadow-floating transition-all active:scale-95 duration-200"
          >
            <IoJournalOutline className="text-sm" />
            <span>Reflect Mood</span>
          </button>

          <button
            onClick={() => dispatch(toggleFocusTimer(true))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent border-2 border-double border-white text-white font-bold text-xs shadow-orbital hover:shadow-floating transition-all active:scale-95 duration-200"
          >
            <IoTimeOutline className="text-sm" />
            <span>Pomodoro Clock</span>
          </button>
        </div>
      </div>

      {/* Stats Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 1: Gamer Leveling & XP */}
        <Card woven={true} className="lg:col-span-2 flex flex-col md:flex-row items-center gap-6" padding="p-6">
          <FabricBadge level={currentLvl} xp={currentXp} className="shrink-0" />

          <div className="flex-1 w-full space-y-4">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide">
                  Experience Thread Progression
                </h3>
                <span className="text-xs font-bold text-accent font-mono-stats">{progressPercent}%</span>
              </div>
              <StitchProgressBar progress={progressPercent} height="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center border-t border-dashed border-border-stitch">
              <div className="p-2 bg-background-primary/40 rounded-lg border border-border-stitch">
                <span className="text-[10px] font-bold text-text-secondary uppercase font-mono-stats block">Streak</span>
                <span className="text-lg font-bold text-red-500 font-mono-stats flex items-center justify-center gap-0.5">
                  <IoFlameOutline className="animate-pulse" />
                  {user?.streak || 0}
                </span>
              </div>

              <div className="p-2 bg-background-primary/40 rounded-lg border border-border-stitch">
                <span className="text-[10px] font-bold text-text-secondary uppercase font-mono-stats block">Completed</span>
                <span className="text-lg font-bold text-green-500 font-mono-stats">
                  {completedToday.length}
                </span>
              </div>

              <div className="p-2 bg-background-primary/40 rounded-lg border border-border-stitch">
                <span className="text-[10px] font-bold text-text-secondary uppercase font-mono-stats block">Remaining</span>
                <span className="text-lg font-bold text-accent font-mono-stats">
                  {activeTasks.length}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: AI Coach Schedulers Panel */}
        <Card className="flex flex-col justify-between" padding="p-6">
          <div className="space-y-2">
            <span className="text-[9px] font-bold tracking-wider text-accent uppercase font-mono-stats block">AI COACH SCHEDULE OPTIMIZER</span>
            <h3 className="text-xs font-extrabold text-text-primary uppercase flex items-center gap-1">
              <IoSparklesOutline className="text-accent animate-pulse" />
              Focus Advisor
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed pt-1">
              {getCoachTip()}
            </p>
          </div>

          <div className="pt-4 border-t border-dashed border-border-stitch mt-4 flex justify-between items-center text-[10px] font-bold text-text-secondary">
            <span>Productivity Ratio:</span>
            <span className="text-green-500 font-mono-stats">{completionRate}% Done</span>
          </div>
        </Card>
      </div>

      {/* Recharts Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Area Chart: XP trends */}
        <Card stitched={true} padding="p-6">
          <div className="mb-4">
            <span className="text-[9px] font-bold tracking-wider text-accent uppercase font-mono-stats block">XP FOCUS INDEX</span>
            <h3 className="text-xs font-extrabold text-text-primary uppercase">Weekly Performance Area</h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={xpHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-stitch)" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#9ca3af" fontSize={10} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-stitch)' }}
                  labelStyle={{ color: 'var(--text-primary)', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ color: 'var(--color-accent)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="xp" stroke="var(--color-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorXp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart: Tasks breakdown */}
        <Card stitched={true} padding="p-6">
          <div className="mb-4">
            <span className="text-[9px] font-bold tracking-wider text-accent uppercase font-mono-stats block">FOCUS DISTRIBUTIONS</span>
            <h3 className="text-xs font-extrabold text-text-primary uppercase">Activity Category Breakdown</h3>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {donutData.length === 0 ? (
              <div className="text-center p-6 text-text-secondary text-xs">
                No active tasks to index focus fields. Complete task items to populate distributions!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--background-surface)', borderColor: 'var(--border-stitch)' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Accountability partner & Gamification hub links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Accountability Widget */}
        <Card className="flex flex-col gap-4" padding="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/10 text-accent rounded-xl border border-dashed border-accent/40 shrink-0">
              <IoPeopleOutline className="text-2xl animate-float-slow" />
            </div>
            <div className="space-y-1 flex-1 text-left">
              <span className="text-[9px] font-bold text-accent uppercase font-mono-stats block">ACCOUNTABILITY PAIR</span>
              <h4 className="text-xs font-bold text-text-primary uppercase">Streak Buddy System</h4>
              
              {!user?.buddyUid && !outgoingInvite && incomingInvites.length === 0 && (
                <>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Collaborate with a friend to share streaks and hold each other accountable! Enter your partner's UID.
                  </p>
                  <div className="pt-2.5 flex items-center gap-2">
                    <input
                      type="text"
                      value={partnerUidInput}
                      onChange={(e) => setPartnerUidInput(e.target.value)}
                      placeholder="Partner UID..."
                      disabled={sendingInvite}
                      className="px-3 py-1.5 bg-background-primary border border-border-stitch rounded-lg text-[10px] text-text-primary focus:outline-none focus:border-accent w-full max-w-[200px] font-mono-stats"
                    />
                    <button
                      onClick={handleSendInvite}
                      disabled={sendingInvite}
                      className="px-4 py-1.5 bg-accent hover:bg-accent/90 border border-white text-white text-[10px] font-extrabold uppercase font-mono-stats rounded-lg shadow-orbital transition-all duration-200"
                    >
                      {sendingInvite ? 'Sending...' : 'Invite'}
                    </button>
                  </div>
                </>
              )}

              {/* Outgoing pending request */}
              {!user?.buddyUid && outgoingInvite && (
                <div className="pt-1.5 space-y-2">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Outgoing invitation sent to:
                    <span className="block font-mono-stats text-[10px] bg-background-primary/50 border border-border-stitch px-2 py-1 rounded mt-1 truncate">
                      {outgoingInvite.receiverUid}
                    </span>
                    Waiting for them to sync and accept...
                  </p>
                  <button
                    onClick={() => handleCancelInvite(outgoingInvite)}
                    className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-[9px] font-bold uppercase rounded font-mono-stats transition-all"
                  >
                    Cancel Invite
                  </button>
                </div>
              )}

              {/* Incoming pending requests */}
              {!user?.buddyUid && incomingInvites.length > 0 && (
                <div className="pt-1.5 space-y-3">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    You have a pending invite from:
                  </p>
                  {incomingInvites.map((invite) => (
                    <div key={invite.id} className="p-3 bg-background-primary/60 border border-dashed border-accent/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-text-primary uppercase">{invite.senderName}</div>
                        <div className="text-[8px] font-mono-stats text-text-secondary/70 truncate max-w-[160px]">{invite.senderUid}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAcceptInvite(invite)}
                          className="p-1 px-2.5 bg-accent text-white border border-white text-[9px] font-extrabold uppercase rounded-md flex items-center gap-1 hover:bg-accent/90 transition-all font-mono-stats"
                        >
                          <IoCheckmarkOutline />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(invite)}
                          className="p-1 px-2.5 bg-background-surface text-text-secondary border border-border-stitch text-[9px] font-bold uppercase rounded-md flex items-center gap-1 hover:bg-background-primary transition-all font-mono-stats"
                        >
                          <IoCloseOutline />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Linked Buddy Side-by-Side Dashboard */}
          {user?.buddyUid && buddyData && (
            <div className="pt-2 border-t border-dashed border-border-stitch mt-2 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4 text-center">
                {/* You Column */}
                <div className="p-3 bg-background-primary/50 border border-border-stitch rounded-xl relative">
                  <span className="absolute top-2 left-2 text-[8px] font-bold text-accent uppercase font-mono-stats">YOU</span>
                  <div className="mt-3 font-bold text-text-primary text-sm uppercase truncate">{user.displayName}</div>
                  <div className="text-[9px] font-mono-stats text-text-secondary mt-0.5">LVL {user.level}</div>
                  <div className="mt-2 text-xl font-bold font-mono-stats text-red-500 flex items-center justify-center gap-0.5" title="Your Streak">
                    <IoFlameOutline className="animate-pulse" />
                    {user.streak || 0}
                  </div>
                  <div className="text-[8px] font-mono-stats text-text-secondary/60 mt-1">{user.xp} XP total</div>
                </div>

                {/* Buddy Column */}
                <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl relative">
                  <span className="absolute top-2 left-2 text-[8px] font-bold text-accent uppercase font-mono-stats">BUDDY</span>
                  <div className="mt-3 font-bold text-text-primary text-sm uppercase truncate">{buddyData.displayName || 'Stitch Buddy'}</div>
                  <div className="text-[9px] font-mono-stats text-text-secondary mt-0.5">LVL {buddyData.level || 1}</div>
                  <div className="mt-2 text-xl font-bold font-mono-stats text-red-500 flex items-center justify-center gap-0.5" title="Buddy's Streak">
                    <IoFlameOutline className="animate-pulse text-red-500" />
                    {buddyData.streak || 0}
                  </div>
                  <div className="text-[8px] font-mono-stats text-text-secondary/60 mt-1">{buddyData.xp || 0} XP total</div>
                </div>
              </div>

              {/* Comparision motivational banner */}
              <div className="p-2.5 rounded-lg text-center text-[10px] font-semibold bg-background-primary border border-border-stitch flex items-center justify-center gap-1.5 uppercase font-mono-stats">
                {user.streak > (buddyData.streak || 0) && (
                  <span>🏆 You are leading the thread! Keep it up!</span>
                )}
                {user.streak < (buddyData.streak || 0) && (
                  <span>🔥 Catch up! {buddyData.displayName || 'Buddy'} is leading with a {buddyData.streak} day streak!</span>
                )}
                {user.streak === (buddyData.streak || 0) && (
                  <span>💪 Thread Synced! You both have an active {user.streak} day streak!</span>
                )}
              </div>

              {/* Unlink button */}
              <div className="flex justify-end">
                <button
                  onClick={handleUnlinkBuddy}
                  className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-[9px] font-bold uppercase rounded font-mono-stats transition-all"
                >
                  Unlink Buddy
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Navigate panel */}
        <Card className="flex items-start gap-4" padding="p-6">
          <div className="p-3 bg-[#d85a30]/10 text-[#d85a30] rounded-xl border border-dashed border-[#d85a30]/40 shrink-0">
            <IoExtensionPuzzleOutline className="text-2xl" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-[#d85a30] uppercase font-mono-stats block">GAMIFIED REWARDS</span>
            <h4 className="text-xs font-bold text-text-primary uppercase">Challenges Hub</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Gain experience multiplier badges by completing weekly streak and category challenges in the hub!
            </p>
            <button
              onClick={() => navigate('/challenges')}
              className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-[#d85a30] border border-white text-white rounded text-[10px] font-extrabold uppercase tracking-wide shadow-orbital hover:shadow-floating transition-all active:scale-95 duration-200"
            >
              Explore Hub
            </button>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
