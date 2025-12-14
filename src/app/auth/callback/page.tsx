'use client';

import { useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const handleLogin = useCallback(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const name = searchParams.get('name');
    const profileImage = searchParams.get('profileImage');
    
    if (error) {
      console.error('OAuth 로그인 에러:', error);
      router.push('/auth/login?error=login_failed');
      return;
    }
    
    if (!token) {
      console.error('토큰이 없습니다');
      router.push('/auth/login?error=no_token');
      return;
    }

    // 토큰과 사용자 정보로 로그인 처리
    const userData = {
      token,
      user: {
        name,
        profileImage,
      }
    };
    
    login(userData);
    router.push('/');
  }, [searchParams, router, login]);

  useEffect(() => {
    handleLogin();
  }, []); // 의존성 배열을 비워서 한 번만 실행되도록 함

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">로그인 처리 중...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}

export default function OAuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
} 