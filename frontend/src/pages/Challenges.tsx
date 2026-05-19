import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { earnXp } from '../store/profileSlice';
import { showToast } from '../store/uiSlice';
import { Card } from '../components/UI/Card';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { IoRibbonOutline, IoLockClosedOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  badgeName: string;
  check: (stats: { completedTasksCount: number; level: number; streak: number; xp: number }, tasks: any[]) => boolean;
}

export const Challenges: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const tasks = useAppSelector((state) => state.tasks.items);

  // Set claimed list from the synced user profile
  const claimedList = user?.claimedChallenges || [];

  // Challenges Definition
  const challenges: Challenge[] = [
    {
      id: 'task_rookie',
      title: 'Stitch Rookie',
      description: 'Resolve and complete 3 canvas tasks.',
      xpReward: 25,
      badgeName: 'Silver Needle',
      check: (stats) => stats.completedTasksCount >= 3,
    },
    {
      id: 'level_builder',
      title: 'Momentum Builder',
      description: 'Reach Level 2 or higher.',
      xpReward: 50,
      badgeName: 'Bronze Loom',
      check: (stats) => stats.level >= 2,
    },
    {
      id: 'streak_wizard',
      title: 'Streak Wizard',
      description: 'Form a streak of at least 3 active days.',
      xpReward: 100,
      badgeName: 'Golden Thread',
      check: (stats) => stats.streak >= 3,
    },
    {
      id: 'focus_titan',
      title: 'Focus Titan',
      description: 'Unlock experience stats totaling over 200 XP.',
      xpReward: 150,
      badgeName: 'Elite Weaver',
      check: (stats) => stats.xp >= 200,
    },
    {
      id: 'stitch_master',
      title: 'Stitch Master',
      description: 'Complete 10 canvas tasks.',
      xpReward: 200,
      badgeName: 'Master Loom',
      check: (stats) => stats.completedTasksCount >= 10,
    },
    {
      id: 'knowledge_seeker',
      title: 'Knowledge Seeker',
      description: 'Complete 5 Learning or General tasks.',
      xpReward: 75,
      badgeName: 'Scholar Needle',
      check: (_stats, list) => list.filter(t => t.completed && !t.isDeleted && (t.category === 'Learning' || t.category === 'General')).length >= 5,
    },
    {
      id: 'momentum_lord',
      title: 'Momentum Lord',
      description: 'Keep a streak of at least 5 active days.',
      xpReward: 150,
      badgeName: 'Daybreaker Flame',
      check: (stats) => stats.streak >= 5,
    },
    {
      id: 'perfect_thread',
      title: 'Perfect Thread',
      description: 'Have at least 5 total tasks sketched, with 100% completion rate.',
      xpReward: 250,
      badgeName: 'Seamless Canvas',
      check: (_stats, list) => {
        const active = list.filter(t => !t.isDeleted);
        return active.length >= 5 && active.every(t => t.completed);
      },
    }
  ];

  // Map active statistics
  const completedTasksCount = tasks.filter(t => t.completed && !t.isDeleted).length;
  
  const userStats = {
    completedTasksCount,
    level: user?.level || 1,
    streak: user?.streak || 0,
    xp: user?.xp || 0
  };

  const handleClaimReward = async (ch: Challenge) => {
    if (claimedList.includes(ch.id)) return;

    try {
      dispatch(earnXp(ch.xpReward));
      
      const newClaimed = [...claimedList, ch.id];
      
      // Update XP & Claimed List in database
      if (user?.uid) {
        const userRef = doc(db, 'users', user.uid);
        const newXp = (user.xp || 0) + ch.xpReward;
        await updateDoc(userRef, { 
          xp: newXp,
          claimedChallenges: newClaimed
        });
      }

      dispatch(showToast({ 
        message: `Unlocked Challenge: "${ch.title}"! Gained +${ch.xpReward} XP & "${ch.badgeName}" Badge! 🏆`, 
        type: 'success' 
      }));
    } catch (err: unknown) {
      console.error(err);
      dispatch(showToast({ message: 'Claim failed.', type: 'error' }));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight uppercase font-mono-stats">
          CHALLENGES HUB
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Push your focus limits, unlock double-border badges, and claim massive experience rewards.
        </p>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map((ch) => {
          const isCompleted = ch.check(userStats, tasks);
          const isClaimed = claimedList.includes(ch.id);

          return (
            <Card 
              key={ch.id} 
              stitched={isCompleted && !isClaimed} 
              className={`flex flex-col justify-between transition-all duration-300 ${isClaimed ? 'opacity-70' : ''}`}
              padding="p-6"
            >
              <div className="flex items-start gap-4 text-left">
                {/* Visual Icon Badge */}
                <div 
                  className={`
                    p-3.5 rounded-xl border border-dashed shrink-0
                    ${isCompleted ? 'bg-accent/10 border-accent text-accent animate-float-slow' : 'bg-background-primary border-border-stitch text-text-secondary'}
                  `}
                >
                  {isCompleted ? <IoRibbonOutline className="text-2xl" /> : <IoLockClosedOutline className="text-2xl" />}
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-accent uppercase font-mono-stats block">
                    BADGE: {ch.badgeName}
                  </span>
                  <h3 className="text-sm font-bold text-text-primary uppercase flex items-center gap-1.5">
                    {ch.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-normal">{ch.description}</p>
                </div>
              </div>

              {/* Status footer button panel */}
              <div className="pt-4 mt-4 border-t border-dashed border-border-stitch flex items-center justify-between">
                <span className="text-[10px] font-bold text-green-500 font-mono-stats uppercase">
                  +{ch.xpReward} XP Reward
                </span>

                {isClaimed ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-text-secondary font-mono-stats uppercase">
                    <IoCheckmarkCircleOutline className="text-sm text-green-500" />
                    <span>CLAIMED</span>
                  </span>
                ) : isCompleted ? (
                  <button
                    onClick={() => handleClaimReward(ch)}
                    className="px-4 py-1.5 bg-accent border border-white text-white rounded text-[10px] font-extrabold uppercase tracking-wide hover:shadow-floating transition-all active:scale-95"
                  >
                    Claim Reward
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-text-secondary/50 font-mono-stats uppercase flex items-center gap-1">
                    <IoLockClosedOutline className="text-xs" />
                    <span>LOCKED</span>
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

    </div>
  );
};

export default Challenges;
