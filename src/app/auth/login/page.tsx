'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GoogleAuthButton from '@/components/GoogleAuthButton';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
    if (isAuthenticated) {
      router.push('/');
    }

    // URL 에러 파라미터 처리
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'user_not_found':
          setErrorMessage('등록되지 않은 사용자입니다. 회원가입을 진행해주세요.');
          break;
        case 'already_registered':
          setErrorMessage('이미 가입된 사용자입니다. 로그인을 시도해주세요.');
          break;
        case 'auth_failed':
          setErrorMessage('로그인에 실패했습니다. 다시 시도해주세요.');
          break;
        case 'login_failed':
          setErrorMessage('로그인 처리 중 오류가 발생했습니다.');
          break;
        case 'no_token':
          setErrorMessage('인증 토큰이 없습니다. 다시 로그인해주세요.');
          break;
        default:
          setErrorMessage('알 수 없는 오류가 발생했습니다.');
      }
    }
  }, [isAuthenticated, router, searchParams]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {errorMessage && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
                {errorMessage}
                {errorMessage.includes('등록되지 않은') && (
                  <div className="mt-2">
                    <button
                      onClick={() => router.push('/auth/signup')}
                      className="text-primary hover:text-blue-500 dark:hover:text-blue-300 font-medium underline"
                    >
                      회원가입 페이지로 이동
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="text-center">
              <h2 className="text-2xl font-semibold text-title mb-4">
                로그인
              </h2>
              <p className="text-sm text-body mb-8">
                Google 계정으로 간편하게 로그인하고<br />
                모고의 모든 서비스를 이용해보세요.
              </p>
              <GoogleAuthButton type="login" />
            </div>

            <div className="text-center">
              <p className="text-sm text-body">
                계정이 없으신가요?{' '}
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="text-primary hover:text-blue-500 dark:hover:text-blue-300 font-medium underline"
                >
                  회원가입
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-title mx-auto"></div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
} 