'use client';

import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface GoogleAuthButtonProps {
  type?: 'login' | 'signup';
}

export default function GoogleAuthButton({ type = 'login' }: GoogleAuthButtonProps) {
  const { login } = useAuth();

  console.log('GoogleAuthButton 렌더링됨:', { type });

  const handleGoogleAuth = () => {
    console.log('Google 인증 버튼 클릭됨:', type);
    
    // Google OAuth 인증
    const state = type; // 'login' 또는 'signup'
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/google';
    
    console.log('환경변수 확인:', { clientId, redirectUri, state });
    
    if (!clientId) {
      console.error('Google Client ID가 설정되지 않았습니다.');
      alert('Google 로그인 설정이 완료되지 않았습니다.');
      return;
    }

    // prompt=select_account를 추가하여 항상 계정 선택 화면이 나타나도록 함
    const GOOGLE_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email profile&state=${state}&prompt=select_account&access_type=offline`;
    
    console.log('Google OAuth URL:', GOOGLE_AUTH_URL);
    window.location.href = GOOGLE_AUTH_URL;
  };

  const buttonText = type === 'signup' 
    ? 'Google로 회원가입' 
    : 'Google로 로그인';

  return (
    <button
      onClick={handleGoogleAuth}
      className="w-full h-[45px] bg-white hover:bg-gray-50 border border-gray-300 rounded-md flex items-center justify-center relative transition-colors"
    >
      <div className="flex items-center justify-center w-full">
        <Image
          src="/google-logo.svg"
          alt="Google 로고"
          width={18}
          height={18}
          className="mr-2"
        />
        <span className="text-gray-700 text-[15px] font-medium">
          {buttonText}
        </span>
      </div>
    </button>
  );
} 
