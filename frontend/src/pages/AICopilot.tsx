import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { addTask } from '../store/tasksSlice';
import { showToast } from '../store/uiSlice';
import { Card } from '../components/UI/Card';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  IoSparklesOutline, IoSend, IoCompassOutline, 
  IoCloudUploadOutline, IoCalendarOutline, 
  IoAlertCircleOutline, IoExtensionPuzzleOutline 
} from 'react-icons/io5';

interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  daysOffset: number;
}

interface Blueprint {
  id: string;
  title: string;
  description: string;
  category: string;
  gradient: string;
  tasks: GeneratedTask[];
}

export const AICopilot: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<GeneratedTask[] | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [isWeaving, setIsWeaving] = useState(false);

  // Pre-configured blueprints
  const blueprints: Blueprint[] = [
    {
      id: 'hiit_shred',
      title: '7-Day HIIT Shred',
      description: 'High-intensity interval routines targeting fat loss, core strength & power.',
      category: 'Health',
      gradient: 'from-rose-500/20 to-orange-500/10 border-rose-500/30',
      tasks: [
        { title: 'Morning Metabolic HIIT Warmup', description: '10 min full joint activation + 3 sets of jump jacks, body squats & high knees.', category: 'Health', priority: 'medium', daysOffset: 0 },
        { title: 'Core Strength Endurance Session', description: '3 rounds of 45s forearm planks, bicycle crunches, and slow mountain climbers.', category: 'Health', priority: 'high', daysOffset: 1 },
        { title: 'Cardio Engine HIIT Interval Sprint', description: 'Run: 30s absolute peak sprint / 30s slow walk recovery, repeating 15 times.', category: 'Health', priority: 'high', daysOffset: 2 },
        { title: 'Active Recovery Yoga & Stretch', description: '20 min restorative full-body yoga sequence focusing on hamstrings, back, and hip flexors.', category: 'Health', priority: 'low', daysOffset: 3 },
        { title: 'Lower Body Plyometric Burst', description: '3 sets of squat jumps, alternate jumping lunges, and standing calf raises.', category: 'Health', priority: 'high', daysOffset: 4 },
        { title: 'Upper Body Bodyweight Decompression', description: 'Focus on perfect form pushups, chair tricep dips, and static arm pulls.', category: 'Health', priority: 'medium', daysOffset: 5 },
        { title: 'HIIT Peak Graduation Audit', description: 'Complete 30 min high intensity variable jog. Log heart rate recovery.', category: 'Health', priority: 'high', daysOffset: 6 }
      ]
    },
    {
      id: 'clean_keto',
      title: '3-Day Clean Keto Fuel',
      description: 'Kickstart metabolic ketosis with high-fat, high-fiber low carb diet tips.',
      category: 'Health',
      gradient: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
      tasks: [
        { title: 'Keto Kitchen Stock & Audit', description: 'Clear all processed sugars, refined grains, and high-carb snacks. Stock up on healthy avocados, salmon, eggs, and walnuts.', category: 'Health', priority: 'high', daysOffset: 0 },
        { title: 'Keto Fuel Day 1: Fats & Fiber', description: 'Meal Prep breakfast: scrambled eggs cooked in grass-fed butter. Lunch: mixed greens with avocado. Dinner: baked salmon.', category: 'Health', priority: 'medium', daysOffset: 1 },
        { title: 'Electrolyte Balance & Hydration check', description: 'Prevent the Keto Flu by consuming 3L of water infused with electrolyte pink salt & lemon.', category: 'Health', priority: 'low', daysOffset: 2 }
      ]
    },
    {
      id: 'react_ts',
      title: 'React & TS Architecture',
      description: 'Master strict compiler options, type generic components, and custom hooks.',
      category: 'Learning',
      gradient: 'from-sky-500/20 to-blue-500/10 border-sky-500/30',
      tasks: [
        { title: 'TS Strict Mode Config & Audit', description: 'Switch tsconfig to strict: true. Refactor any dynamic parameters to concrete interfaces.', category: 'Learning', priority: 'high', daysOffset: 0 },
        { title: 'State Hooks & Custom Reducers', description: 'Code a generic useLocalStorage custom state hook handles sync-caching and exceptions.', category: 'Learning', priority: 'medium', daysOffset: 1 },
        { title: 'Vapor-glass UI Tailwind Elements', description: 'Style a premium, reactive custom UI element with dynamic backdrop-filters and double-borders.', category: 'Learning', priority: 'low', daysOffset: 2 }
      ]
    },
    {
      id: 'zen_habit',
      title: 'Daily Zen Mindset Plan',
      description: 'Form a resilient mental framework with box breathing, detox, and stretches.',
      category: 'Personal',
      gradient: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30',
      tasks: [
        { title: 'Morning Calm Box Breathing', description: 'Sit upright. Perform 4 rounds of 4-4-4-4 box breathing to settle nervous system response.', category: 'Personal', priority: 'medium', daysOffset: 0 },
        { title: 'Digital Decompression Stretch', description: 'Decompress posture: shoulder rolls, chest opener stretch, and neck releases. Keep phone locked.', category: 'Personal', priority: 'low', daysOffset: 1 },
        { title: 'Three-Item Gratitude retrolog', description: 'Document 3 highly specific moments or people that brought joy or peace to your day.', category: 'Personal', priority: 'low', daysOffset: 2 }
      ]
    }
  ];

  // Client-side AI Simulation Engine
  const generateCustomPlan = (query: string): { title: string; tasks: GeneratedTask[] } => {
    const q = query.toLowerCase();
    
    if (q.includes('workout') || q.includes('exercise') || q.includes('fitness') || q.includes('gym') || q.includes('run') || q.includes('cardio') || q.includes('muscle')) {
      return {
        title: 'Dynamic Fit Engine Plan',
        tasks: [
          { title: 'Dynamic Full-Body warmup', description: 'Activate joints: shoulder rotations, leg swings, and jumping jacks to elevate core temp.', category: 'Health', priority: 'low', daysOffset: 0 },
          { title: 'Interval Cardio Core burst', description: 'Perform 3 sets of burpees, 45-sec forearm planks, and high knees.', category: 'Health', priority: 'high', daysOffset: 1 },
          { title: 'Stochastic Strength circuit', description: 'Bodyweight squats, pushups, and alternate lunges. 4 sets of 12 counts.', category: 'Health', priority: 'medium', daysOffset: 2 },
          { title: 'Aerate: Cardio stamina run', description: 'Continuous light running or power-walking for 25 minutes. Practice steady nostril breathing.', category: 'Health', priority: 'medium', daysOffset: 3 },
          { title: 'Static Deep muscle release', description: 'Full body cool-down stretching focusing on hips, quads, and lower back.', category: 'Health', priority: 'low', daysOffset: 4 }
        ]
      };
    }
    
    if (q.includes('diet') || q.includes('nutrition') || q.includes('eat') || q.includes('keto') || q.includes('food') || q.includes('meal') || q.includes('recipe') || q.includes('healthy')) {
      return {
        title: 'Nutritive Fuel Strategy',
        tasks: [
          { title: 'Kitchen Audit & Shopping Strategy', description: 'Review fridge contents. Discard high-sugar and highly processed items. Plan meal macros.', category: 'Health', priority: 'high', daysOffset: 0 },
          { title: 'Optimal Hydration Audit', description: 'Avoid sugary sodas. Track and log 3L of water intake throughout the active day.', category: 'Health', priority: 'medium', daysOffset: 1 },
          { title: 'Macro-Balanced Meal Prep', description: 'Pre-portion high protein and high fiber lunches to block unhealthy fast-food choices.', category: 'Health', priority: 'medium', daysOffset: 2 },
          { title: 'Mindful Chew & Portions', description: 'Practice quiet eating without screens. Focus on texture, chewing fully to support digestion.', category: 'Health', priority: 'low', daysOffset: 3 }
        ]
      };
    }
    
    if (q.includes('learn') || q.includes('study') || q.includes('code') || q.includes('program') || q.includes('typescript') || q.includes('react') || q.includes('python') || q.includes('book') || q.includes('course')) {
      return {
        title: 'Cognitive Learning Sprint',
        tasks: [
          { title: 'Core Concepts deep-dive notes', description: 'Read fundamental articles or docs for 45 mins. Log key terminology.', category: 'Learning', priority: 'high', daysOffset: 0 },
          { title: 'Sandbox Project assembly', description: 'Construct a simple, barebones code snippet or summary applying the concept.', category: 'Learning', priority: 'medium', daysOffset: 1 },
          { title: 'Refactoring & Error cleanup', description: 'Clean warnings, review logic bottlenecks, and add clear explanatory comments.', category: 'Learning', priority: 'low', daysOffset: 2 },
          { title: 'Active Recall & explanation', description: 'Write down a 3-sentence summary of the subject as if explaining to a beginner.', category: 'Learning', priority: 'medium', daysOffset: 3 }
        ]
      };
    }

    if (q.includes('money') || q.includes('finance') || q.includes('budget') || q.includes('save') || q.includes('expense')) {
      return {
        title: 'Wealth Architecture Plan',
        tasks: [
          { title: 'Granular Transaction Audit', description: 'Export bank statements for the last 30 days. Identify high-cost recurring outliers.', category: 'Finance', priority: 'high', daysOffset: 0 },
          { title: 'Daily Expense cap constraint', description: 'Setup a strict daily manual transaction cap. Cancel one unused subscription.', category: 'Finance', priority: 'medium', daysOffset: 1 },
          { title: 'Emergency Fund auto-transfer', description: 'Configure automatic recurring transfer of $50 directly into a high-yield savings vault.', category: 'Finance', priority: 'high', daysOffset: 2 }
        ]
      };
    }

    // Default creative fallback plan
    const capitalizedWord = query.charAt(0).toUpperCase() + query.slice(1);
    return {
      title: `Stitch AI ${capitalizedWord} Plan`,
      tasks: [
        { title: `Initialize ${capitalizedWord} target`, description: `Organize workspace, schedules, and assets. Ready all tools to secure success.`, category: 'General', priority: 'medium', daysOffset: 0 },
        { title: 'Deep Work action sprint', description: 'Trigger the Pomodoro timer. Work uninterrupted for 25 minutes on high priority details.', category: 'General', priority: 'high', daysOffset: 1 },
        { title: 'Feedback & Refinement sweep', description: 'Analyze your performance so far. Adjust parameters that felt slow or cluttered.', category: 'General', priority: 'medium', daysOffset: 2 },
        { title: 'Retrospective progress log', description: 'Record key takeaways and accomplishments. Schedule your next advanced weekly cycle.', category: 'General', priority: 'low', daysOffset: 3 }
      ]
    };
  };

  const handleApplyBlueprint = (bp: Blueprint) => {
    setActivePlan(bp.tasks);
    setPlanTitle(bp.title);
    dispatch(showToast({ message: `AI Drafted: "${bp.title}"! Weave it to your canvas!`, type: 'info' }));
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateCustomPlan(chatInput);
      setActivePlan(generated.tasks);
      setPlanTitle(generated.title);
      setIsGenerating(false);
      setChatInput('');
      dispatch(showToast({ message: 'AI Plan generated successfully! 🧵', type: 'success' }));
    }, 1200);
  };

  const handleWeavePlan = async () => {
    if (!activePlan || activePlan.length === 0) return;
    setIsWeaving(true);

    try {
      const today = new Date();
      
      for (const t of activePlan) {
        const taskDueDate = new Date(today);
        taskDueDate.setDate(today.getDate() + t.daysOffset);
        const dateStr = taskDueDate.toISOString().split('T')[0];

        const taskFields = {
          userId: user?.uid || 'anonymous',
          title: t.title,
          description: t.description,
          category: t.category,
          priority: t.priority as 'low' | 'medium' | 'high',
          dueDate: dateStr,
          dueTime: '09:00',
          recurring: 'none' as 'none' | 'daily' | 'weekly',
          completed: false,
          columnId: 'todo' as 'todo' | 'in_progress' | 'done',
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'tasks'), taskFields);
        dispatch(addTask({ id: docRef.id, ...taskFields }));
      }

      dispatch(showToast({ 
        message: `Successfully woven ${activePlan.length} tasks into your active board and calendar! 🧵🏆`, 
        type: 'success' 
      }));
      setActivePlan(null);
      setPlanTitle('');
    } catch (error) {
      console.error(error);
      dispatch(showToast({ message: 'Failed to weave tasks onto canvas.', type: 'error' }));
    } finally {
      setIsWeaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div>
        <span className="text-[10px] font-extrabold tracking-widest text-accent uppercase font-mono-stats block">
          STITCH CO-DRIVE
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight uppercase font-mono-stats">
          STITCH AI COPILOT
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Leverage a robust dynamic planning assistant to draft structured fitness, health diet, study, or financial routines. Weave them onto your canvas instantly!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Chat Workspace */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Main AI Chat & Generation Card */}
          <Card stitched={true} padding="p-6" className="relative overflow-hidden bg-background-surface/80 backdrop-blur-md">
            
            {/* Glowing Accent Orbs */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative space-y-6">
              
              {/* Top Title Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-dashed border-border-stitch">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <IoSparklesOutline className="text-lg animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-xs font-extrabold text-text-primary uppercase tracking-wide">
                      Interactive Plan Architect
                    </h2>
                    <p className="text-[10px] text-text-secondary">Type prompts like "workout routine" or "healthy diet guide"</p>
                  </div>
                </div>
                
                {isGenerating && (
                  <span className="text-[9px] text-accent font-bold animate-pulse font-mono-stats uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></span>
                    Synthesizing...
                  </span>
                )}
              </div>

              {/* Chat Form Input */}
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask for custom fitness, keto diet, learning tracks, study habits, expense audits..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isGenerating}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-background-primary border border-border-stitch text-xs text-text-primary focus:outline-none focus:border-accent placeholder-text-secondary/40 focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !chatInput.trim()}
                  className="p-3 bg-accent text-white rounded-xl hover:shadow-floating transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 border border-white/20"
                >
                  <IoSend className="text-sm" />
                </button>
              </form>

              {/* Generated Plan Active Display */}
              {activePlan ? (
                <div className="space-y-4 animate-slide-in">
                  <div className="p-4 rounded-xl border border-dashed border-accent/40 bg-accent/5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[8px] font-bold text-accent uppercase font-mono-stats block">Generated AI Blueprint</span>
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">{planTitle}</h3>
                      </div>
                      
                      <button
                        onClick={handleWeavePlan}
                        disabled={isWeaving}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:shadow-floating active:scale-95 flex items-center gap-1.5 border border-white/20"
                      >
                        {isWeaving ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>WEAVING...</span>
                          </>
                        ) : (
                          <>
                            <IoCloudUploadOutline className="text-sm" />
                            <span>WEAVE INTO CANVAS 🧵</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step-by-Step Task list draft */}
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {activePlan.map((t, idx) => (
                        <div key={idx} className="p-3 bg-background-surface border border-border-stitch rounded-lg flex items-center justify-between gap-3 hover:border-accent/40 transition-colors">
                          <div className="text-left">
                            <span className="text-[7px] font-mono-stats font-bold text-accent uppercase bg-accent/10 px-1.5 py-0.5 rounded mr-1.5">
                              {t.category}
                            </span>
                            <span className="text-xs font-bold text-text-primary">{t.title}</span>
                            <p className="text-[10px] text-text-secondary mt-0.5 leading-normal">{t.description}</p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <div className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block ${t.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/30' : t.priority === 'medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-green-500/10 text-green-500 border-green-500/30'}`}>
                              {t.priority}
                            </div>
                            <div className="text-[8px] text-text-secondary/70 mt-1 font-mono-stats flex items-center gap-0.5 justify-end">
                              <IoCalendarOutline />
                              <span>Day +{t.daysOffset}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : !isGenerating ? (
                <div className="text-center p-8 border border-dashed border-border-stitch/60 rounded-xl text-text-secondary text-xs flex flex-col items-center justify-center gap-2">
                  <IoCompassOutline className="text-3xl text-text-secondary/40 animate-pulse" />
                  <span>No plan active. Pick one of the beautiful pre-engineered templates on the right or type a custom prompt above to synthesize tasks instantly!</span>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-accent/30 bg-accent/5 rounded-xl text-accent text-xs flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-dashed border-accent rounded-full animate-spin"></div>
                  <span className="font-bold uppercase tracking-widest font-mono-stats text-[10px] animate-pulse">Consulting the Loom of Knowledge...</span>
                </div>
              )}

            </div>
          </Card>

          {/* Guidelines Notice Box */}
          <div className="bg-[#e49b2f]/10 border border-dashed border-[#e49b2f]/30 text-[#e49b2f] p-4 rounded-xl flex items-start gap-3 text-xs">
            <IoAlertCircleOutline className="text-lg shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase">PRO TIP: STAGGERED SEWING SCHEDULER</span>
              <p className="leading-normal text-[11px] text-text-secondary">
                The Stitch AI Copilot automatically assigns progressive target dates to tasks! If you generate a 7-day routine, Day 0 matches today, Day 1 matches tomorrow, and so on. Your Calendar page will draw a spectacular connected thread connecting them chronologically in real-time!
              </p>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Blueprints Roster */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 px-1">
            <IoExtensionPuzzleOutline className="text-accent text-base" />
            <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
              Pre-Engineered Blueprints
            </h3>
          </div>

          <div className="space-y-3">
            {blueprints.map((bp) => (
              <Card 
                key={bp.id} 
                stitched={false}
                padding="p-4"
                className={`
                  text-left border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-floating bg-gradient-to-br ${bp.gradient}
                `}
                onClick={() => handleApplyBlueprint(bp)}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono-stats font-bold text-accent uppercase bg-background-surface px-1.5 py-0.5 border border-border-stitch rounded">
                      {bp.category}
                    </span>
                    <span className="text-[8px] font-mono-stats font-bold text-text-secondary/70">
                      {bp.tasks.length} Threads
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-text-primary uppercase">
                    {bp.title}
                  </h4>
                  
                  <p className="text-[10px] text-text-secondary leading-normal">
                    {bp.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AICopilot;
