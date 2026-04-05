import React from 'react';
import { cn } from '@/lib/utils';

interface ClayProgressProps {
  value: number;
  max?: number;
  className?: string;
  colorClass?: string;
}

export function ClayLinearProgress({ value, max = 100, className, colorClass = 'bg-[var(--color-primary)]' }: ClayProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={cn("h-4 w-full clay-panel overflow-hidden p-0.5", className)}>
      <div 
        className={cn("h-full rounded-full shadow-sm transition-all duration-500", colorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function ClayCircularProgress({ value, max = 100, size = 120, strokeWidth = 12, className, colorClass = 'text-[var(--color-primary)]', children }: ClayProgressProps & { size?: number, strokeWidth?: number, children?: React.ReactNode }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Outer Clay Bevel */}
      <div className="absolute inset-0 rounded-full shadow-clay" />
      
      {/* Inner Clay Bevel */}
      <div className="absolute inset-[15%] rounded-full shadow-clay-inset bg-[var(--color-bg-base)] flex items-center justify-center">
        {children}
      </div>

      <svg width={size} height={size} className="transform -rotate-90 absolute inset-0 drop-shadow-md">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-out", colorClass)}
        />
      </svg>
    </div>
  );
}
