import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 관리자 페이지 접근 시 자동으로 일반 사용자를 로그아웃시키는 훅
 * 관리자 인증과 일반 사용자 인증을 분리하여 관리하기 위함
 */
export const useAdminAutoLogout = () => {
  const { logout } = useAuth();

  useEffect(() => {
    // 관리자 페이지 접근 시 일반 사용자 로그아웃 (홈으로 리다이렉트 안함)
    logout(false);
  }, [logout]);
};