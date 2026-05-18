import React from 'react';

interface FabricBadgeProps {
  level: number;
  xp?: number;
  className?: string;
}

export const getLevelTitle = (lvl: number): string => {
  if (lvl <= 1) return 'Starter';
  if (lvl === 2) return 'Consistent';
  if (lvl === 3) return 'Momentum Builder';
  if (lvl === 4) return 'Flow State';
  if (lvl === 5) return 'Unstoppable';
  return 'Legend';
};

export const FabricBadge: React.FC<FabricBadgeProps> = ({
  level,
  xp,
  className = '',
}) => {
  const title = getLevelTitle(level);

  return (
    <div
      className={`
        inline-flex flex-col items-center justify-center
        bg-background-surface
        border-4 border-double border-accent
        px-6 py-4 rounded-xl shadow-floating relative
        bg-woven-grid
        transform hover:rotate-1 hover:scale-105 transition-all duration-300
        ${className}
      `}
      style={{
        clipPath: 'polygon(1% 5%, 99% 2%, 96% 98%, 3% 95%)', // Tactile asymmetrical fabric patch cut
      }}
    >
      {/* Margin stitches thread overlay */}
      <div className="absolute inset-1 border border-dashed border-accent/60 rounded-lg pointer-events-none"></div>

      <span className="text-[10px] font-bold tracking-wider text-accent uppercase font-mono-stats">LEVEL</span>
      <span className="text-3xl font-extrabold font-mono-stats text-text-primary my-0.5">{level}</span>
      <span className="text-xs font-semibold tracking-tight text-text-secondary text-center px-1">{title}</span>
      
      {xp !== undefined && (
        <span className="text-[10px] font-mono-stats text-text-secondary/70 mt-1 bg-background-primary px-2 py-0.5 rounded border border-dashed border-border-stitch">
          {xp} XP
        </span>
      )}
    </div>
  );
};

export default FabricBadge;
