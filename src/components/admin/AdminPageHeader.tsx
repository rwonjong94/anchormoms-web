'use client';

import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function AdminPageHeader({ 
  title, 
  description, 
  children, 
  className = "" 
}: AdminPageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-title">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-body mt-1">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex space-x-3 ml-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
