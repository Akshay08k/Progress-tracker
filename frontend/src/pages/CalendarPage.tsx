import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../store';
import { Card } from '../components/UI/Card';
import { 
  IoChevronBackOutline, IoChevronForwardOutline, 
  IoInformationCircleOutline, IoLinkOutline 
} from 'react-icons/io5';


export const CalendarPage: React.FC = () => {
  const tasks = useAppSelector((state) => state.tasks.items);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  });

  const [svgPath, setSvgPath] = useState('');
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const taskElementsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Generate week dates
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  // Shift weeks
  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(d);
  };

  // Filter tasks for the active week
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate === dateStr && !t.isDeleted);
  };

  useEffect(() => {
    const computeThreadPath = () => {
      if (!gridContainerRef.current) return;

      const coordinates: { x: number; y: number }[] = [];
      const containerRect = gridContainerRef.current.getBoundingClientRect();

      weekDates.forEach((date, index) => {
        const dateTasks = getTasksForDate(date);
        const task = dateTasks[0];
        if (task) {
          const el = taskElementsRef.current[`${task.id}-${index}`];
          if (el) {
            const elRect = el.getBoundingClientRect();
            const centerX = elRect.left - containerRect.left + elRect.width / 2;
            const centerY = elRect.top - containerRect.top + elRect.height / 2;
            coordinates.push({ x: centerX, y: centerY });
          }
        }
      });

      if (coordinates.length < 2) {
        setSvgPath('');
        return;
      }

      let path = `M ${coordinates[0].x} ${coordinates[0].y}`;
      for (let i = 0; i < coordinates.length - 1; i++) {
        const curr = coordinates[i];
        const next = coordinates[i + 1];
        const cpX1 = curr.x + (next.x - curr.x) / 2;
        const cpY1 = curr.y;
        const cpX2 = curr.x + (next.x - curr.x) / 2;
        const cpY2 = next.y;
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
      }
      setSvgPath(path);
    };

    const timer = setTimeout(() => {
      computeThreadPath();
    }, 100);

    window.addEventListener('resize', computeThreadPath);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', computeThreadPath);
    };
  }, [currentWeekStart, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate 52-week activity contribution canvas (GitHub-style heatmap)
  // Mock last 365 days with actual task completions mapped
  const generateContributionDays = () => {
    const days: { dateStr: string; count: number }[] = [];
    const today = new Date();
    
    // Start from 364 days ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);

    const completionMap = tasks.reduce((acc: { [key: string]: number }, curr) => {
      if (curr.completed && !curr.isDeleted && curr.dueDate) {
        acc[curr.dueDate] = (acc[curr.dueDate] || 0) + 1;
      }
      return acc;
    }, {});

    for (let i = 0; i <= 364; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      days.push({
        dateStr,
        count: completionMap[dateStr] || 0
      });
    }

    return days;
  };

  const contributionDays = generateContributionDays();

  const getHeatmapColorClass = (count: number) => {
    if (count === 0) return 'bg-background-primary border border-border-stitch/30';
    if (count === 1) return 'bg-accent/20 border border-accent/30';
    if (count === 2) return 'bg-accent/50 border border-accent/40';
    return 'bg-accent border border-white/40';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight uppercase font-mono-stats">
            STITCHED PLANNER
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Visualize recurring loops connected with custom SVG sewing guides and audit your 52-week heatmap.
          </p>
        </div>

        {/* Toolbar Week Swappers */}
        <div className="flex items-center gap-3 bg-background-surface border border-border-stitch px-4 py-2 rounded-lg">
          <button
            onClick={handlePrevWeek}
            className="p-1 rounded hover:bg-background-primary text-text-secondary hover:text-accent transition-colors focus:outline-none"
          >
            <IoChevronBackOutline className="text-lg" />
          </button>
          
          <span className="text-xs font-bold font-mono-stats tracking-wider text-text-primary uppercase">
            Week of {currentWeekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>

          <button
            onClick={handleNextWeek}
            className="p-1 rounded hover:bg-background-primary text-text-secondary hover:text-accent transition-colors focus:outline-none"
          >
            <IoChevronForwardOutline className="text-lg" />
          </button>
        </div>
      </div>

      {/* Info notice about Connected Threads */}
      <div className="bg-[#378add]/10 border border-dashed border-[#378add]/40 text-[#378add] p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
        <IoInformationCircleOutline className="text-xl shrink-0" />
        <span>
          <b>Connected Sewing Threads:</b> Notice the dashed accent curves! An SVG sewing string automatically threads consecutive daily tasks together to guide your visual workflow loops.
        </span>
      </div>

      {/* Stitched Weekly Grid with connected thread overlays */}
      <Card stitched={true} padding="p-0" className="relative overflow-hidden">
        <div ref={gridContainerRef} className="relative p-6">
          
          {/* SVG Thread path canvas overlay */}
          {svgPath && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <path
                d={svgPath}
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                fill="none"
                className="animate-stitch-draw"
                style={{ strokeLinecap: 'round' }}
              />
            </svg>
          )}

          {/* Week Days columns */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 relative z-20">
            {weekDates.map((date, idx) => {
              const dateStr = date.toISOString().split('T')[0];
              const dateTasks = getTasksForDate(date);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div 
                  key={idx}
                  className={`
                    p-3 rounded-xl border border-dashed min-h-[160px] flex flex-col gap-2 transition-colors
                    ${isToday ? 'border-accent bg-accent/5' : 'border-border-stitch bg-background-primary/30'}
                  `}
                >
                  {/* Column day header */}
                  <div className="text-center pb-2 border-b border-dashed border-border-stitch/60">
                    <span className="text-[10px] font-bold text-text-secondary uppercase font-mono-stats block">
                      {date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className={`text-xs font-extrabold font-mono-stats ${isToday ? 'text-accent' : 'text-text-primary'}`}>
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Tasks Container */}
                  <div className="flex-1 flex flex-col gap-2 pt-1.5">
                    {dateTasks.map((t) => (
                      <div
                        key={t.id}
                        ref={(el) => {
                          taskElementsRef.current[`${t.id}-${idx}`] = el;
                        }}
                        className={`
                          p-2.5 rounded-lg border text-left text-[9px] relative overflow-hidden transition-all duration-200
                          ${t.completed ? 'bg-background-primary/40 border-border-stitch/60 text-text-secondary' : 'bg-background-surface border-border-stitch hover:border-accent/40 shadow-orbital'}
                        `}
                      >
                        <div className="font-bold uppercase truncate pr-3">{t.title}</div>
                        <div className="text-[7px] text-text-secondary/70 mt-1 uppercase font-mono-stats flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
                          {t.category}
                        </div>
                        {t.recurring !== 'none' && (
                          <div className="absolute top-1.5 right-1.5 text-accent" title="Recurring Thread">
                            <IoLinkOutline />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </Card>

      {/* 52-Week Contribution Canvas (GitHub Heatmap) */}
      <Card padding="p-6">
        <div className="mb-4">
          <span className="text-[9px] font-bold tracking-wider text-accent uppercase font-mono-stats block">HEATMAP AUDITING</span>
          <h3 className="text-xs font-extrabold text-text-primary uppercase">52-Week Sewing Activity Canvas</h3>
        </div>

        {/* Heatmap Grid wrapper */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-[3px]" style={{ minWidth: '680px' }}>
            {/* Columns of 52 weeks */}
            {Array.from({ length: 52 }).map((_, weekIdx) => {
              const weekDays = contributionDays.slice(weekIdx * 7, (weekIdx + 1) * 7);

              return (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {weekDays.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`w-[9px] h-[9px] rounded-xs cursor-pointer ${getHeatmapColorClass(day.count)}`}
                      title={`${day.dateStr}: ${day.count} stitches completed`}
                    ></div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 text-[8px] font-mono-stats text-text-secondary mt-3">
          <span>Fewer Stitches</span>
          <div className="w-[8px] h-[8px] rounded-xs bg-background-primary border border-border-stitch/30"></div>
          <div className="w-[8px] h-[8px] rounded-xs bg-accent/20 border border-accent/30"></div>
          <div className="w-[8px] h-[8px] rounded-xs bg-accent/50 border border-accent/40"></div>
          <div className="w-[8px] h-[8px] rounded-xs bg-accent border border-white/40"></div>
          <span>More Stitches</span>
        </div>
      </Card>

    </div>
  );
};

export default CalendarPage;
