import React from 'react';
import { cn } from '@/lib/utils';

interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ClayCard({ className, inset, children, ...props }: ClayCardProps) {
  return (
    <div
      className={cn(
        inset ? 'clay-panel' : 'clay-card',
        'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
