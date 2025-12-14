'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import MyPageSidebar from '@/components/MyPageSidebar';

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* 사이드바 네비게이션 */}
          <div className="lg:col-span-1">
            <MyPageSidebar />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3 mt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
