import React from 'react';
import { cn } from '@/lib/utils';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function ClayButton({ className, variant = 'default', children, ...props }: ClayButtonProps) {
  const variants = {
    default: 'clay-btn px-6 py-3',
    primary: 'clay-btn-primary px-6 py-3',
    secondary: 'clay-btn-secondary px-6 py-3',
    icon: 'clay-btn p-3 flex items-center justify-center aspect-square',
  };

  return (
    <button
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
