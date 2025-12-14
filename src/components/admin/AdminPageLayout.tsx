'use client';

import React from 'react';
import AdminPageHeader from './AdminPageHeader';

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function AdminPageLayout({ 
  title, 
  description, 
  headerActions, 
  children, 
  className = "" 
}: AdminPageLayoutProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      <AdminPageHeader 
        title={title} 
        description={description}
      >
        {headerActions}
      </AdminPageHeader>
      {children}
    </div>
  );
}
