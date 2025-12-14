'use client';

import { ReactNode } from 'react';

interface WithSidebarProps {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function WithSidebar({ sidebar, children, className = '' }: WithSidebarProps) {
  return (
    <div className={`relative ${className}`}>
      {/* 모바일에서는 사이드바 내용을 상단에 항상 표시 */}
      <div className="mb-4 lg:hidden">
        {sidebar}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 데스크탑 사이드바 */}
        <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
          {sidebar}
        </aside>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}


