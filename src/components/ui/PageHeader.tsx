'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  children, 
  className = '' 
}: PageHeaderProps) {
  return (
    <div className={`mb-8 animate-slide-up ${className}`}>
      <div className="text-center">
        <h1 className="text-heading-1 text-title mb-3">
          {title}
        </h1>
        {subtitle && (
          <p className="text-body-large text-body max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
}
