'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg'
};

export default function Card({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md',
  shadow = 'md'
}: CardProps) {
  const baseClasses = 'bg-card rounded-xl border border-default animate-scale-in';
  const hoverClasses = hover ? 'hover-lift cursor-pointer' : '';
  
  return (
    <div className={`${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}
