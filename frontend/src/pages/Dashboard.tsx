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
  IoAlertCircleOutline, IoExtensionPuzzleOutline, IoSparklesOutline, IoPeopleOutline
} from 'react-icons/io5';

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
  const [partnerMessage, setPartnerMessage] = useState('Sync your code with an accountability partner to share streaks!');

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

  // Recharts Chart 2: Daily Focus XP (Area Chart - Mocked last 7 days of focus)
  const xpHistoryData = [
    { day: 'Mon', xp: 20 },
    { day: 'Tue', xp: 45 },
    { day: 'Wed', xp: 30 },
    { day: 'Thu', xp: 75 },
    { day: 'Fri', xp: 60 },
    { day: 'Sat', xp: 90 },
    { day: 'Sun', xp: user?.xp ? Math.min(user.xp, 120) : 40 },
  ];

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
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#212030" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#9ca3af" fontSize={10} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--background-surface)', borderColor: 'var(--border-stitch)' }}
                  labelStyle={{ color: 'var(--text-primary)', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ color: 'var(--accent)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="xp" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorXp)" />
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
        <Card className="flex items-start gap-4" padding="p-6">
          <div className="p-3 bg-accent/10 text-accent rounded-xl border border-dashed border-accent/40 shrink-0">
            <IoPeopleOutline className="text-2xl" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-[9px] font-bold text-accent uppercase font-mono-stats block">ACCOUNTABILITY PAIR</span>
            <h4 className="text-xs font-bold text-text-primary uppercase">Streak Buddy System</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {partnerMessage}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Partner UID..."
                className="px-2 py-1 bg-background-primary border border-border-stitch rounded text-[10px] text-text-primary focus:outline-none focus:border-accent w-full max-w-[150px]"
              />
              <button
                onClick={() => {
                  setPartnerMessage('Partner synchronized successfully! Streaks are active.');
                  dispatch(showToast({ message: 'Accountability partner linked!', type: 'success' }));
                }}
                className="px-2 py-1 bg-accent border border-white rounded text-[10px] text-white font-extrabold uppercase font-mono-stats"
              >
                Sync
              </button>
            </div>
          </div>
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
