import React from 'react';

interface StitchProgressBarProps {
  progress: number; // 0 to 100
  height?: string;
  className?: string;
}

export const StitchProgressBar: React.FC<StitchProgressBarProps> = ({
  progress,
  height = 'h-4',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full ${height} bg-background-primary rounded-full relative border border-dashed border-border-stitch overflow-hidden`}>
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out border-r-2 border-white relative"
          style={{ width: `${percentage}%` }}
        >
          {/* Thread stitched lines visual overlay */}
          <div className="absolute inset-0 w-full h-full opacity-40 border-t border-b border-dashed border-white"></div>
        </div>
      </div>
    </div>
  );
};

export default StitchProgressBar;
