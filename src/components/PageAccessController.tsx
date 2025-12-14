'use client';

import { usePageAccess } from '@/hooks/usePageAccess';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import LoginRequiredModal from './LoginRequiredModal';
import { useEffect } from 'react';

interface PageAccessControllerProps {
  children: React.ReactNode;
}

export default function PageAccessController({ children }: PageAccessControllerProps) {
  const { showLoginModal, setShowLoginModal } = usePageAccess();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 보호된 페이지에 인증되지 않은 사용자가 접근하면 로그인 페이지로 리다이렉트
  useEffect(() => {
    // 인증 로딩 중일 때는 아무것도 하지 않음
    if (isLoading) {
      return;
    }
    
    const protectedPages = [
      '/exam/waiting',
      '/exam/take',
      '/exam',        // 시험 페이지
      '/lectures',    // 강의 페이지
      '/column'       // 칼럼 페이지
    ];
    
    const isProtectedPage = protectedPages.some(page => pathname.startsWith(page));
    
    // 로딩 완료 후 보호된 페이지에 인증되지 않은 사용자가 접근하면 리다이렉트
    if (isProtectedPage && !isAuthenticated && !showLoginModal) {
      router.push('/auth/login');
    }
  }, [pathname, isAuthenticated, showLoginModal, router, isLoading]);

  return (
    <>
      {children}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="이 페이지에 접근하려면 로그인이 필요합니다."
      />
    </>
  );
} 