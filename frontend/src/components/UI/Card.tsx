import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glass?: boolean;
  woven?: boolean;
  hoverable?: boolean;
  stitched?: boolean;
  padding?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = false,
  woven = false,
  hoverable = true,
  stitched = false,
  padding = 'p-6',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        rounded-xl
        border border-border-stitch
        transition-all duration-300
        ${glass ? 'glass-panel text-text-primary' : 'bg-background-surface text-text-primary'}
        ${woven ? 'bg-woven-grid' : ''}
        ${hoverable ? 'hover:-translate-y-1 hover:shadow-floating hover:border-accent/40' : 'shadow-orbital'}
        ${stitched ? 'border-dashed border-accent/40' : ''}
        ${padding}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
