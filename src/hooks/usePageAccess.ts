'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface PageAccessResult {
  isAllowed: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

export function usePageAccess(): PageAccessResult {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 완전히 차단되는 페이지들 (로그인 필수)
  const protectedPages = ['/exam/waiting', '/exam/take'];
  
  // 로그인 권장 페이지들 (exam에서 waiting이나 explanation으로 넘어갈 때)
  const loginRecommendedPages = ['/explanation'];

  useEffect(() => {
    if (isLoading) return;

    // 보호된 페이지 접근 시도 (완전 차단)
    if (protectedPages.some(page => pathname.startsWith(page))) {
      if (!isAuthenticated) {
        setShowLoginModal(true);
      }
    }
    
    // 로그인 권장 페이지 접근 시도 (explanation 페이지)
    else if (loginRecommendedPages.some(page => pathname.startsWith(page))) {
      if (!isAuthenticated) {
        setShowLoginModal(true);
      }
    }
  }, [pathname, isAuthenticated, isLoading]);

  const isProtectedPage = protectedPages.some(page => pathname.startsWith(page));
  const isAllowed = !isProtectedPage || isAuthenticated;

  return {
    isAllowed,
    showLoginModal,
    setShowLoginModal
  };
} 