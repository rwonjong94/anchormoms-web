'use client';

import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl', 
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  '4xl': 'max-w-8xl',
  '6xl': 'max-w-9xl',
  '7xl': 'max-w-10xl',
  full: 'max-w-full'
};

const paddingClasses = {
  none: '',
  sm: 'px-4 py-6',
  md: 'px-4 sm:px-6 lg:px-8 py-8',
  lg: 'px-4 sm:px-6 lg:px-8 py-12'
};

export default function PageContainer({ 
  children, 
  className = '', 
  maxWidth = 'xl',
  padding = 'md'
}: PageContainerProps) {
  return (
    <div className={`min-h-screen bg-page`}>
      <div className={`${maxWidthClasses[maxWidth]} mx-auto ${paddingClasses[padding]} ${className}`}>
        {children}
      </div>
    </div>
  );
}
