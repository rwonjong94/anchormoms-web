'use client';

import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface GoogleLoginButtonProps {
  type?: 'login' | 'signup';
}

export default function GoogleLoginButton({ type = 'login' }: GoogleLoginButtonProps) {
  const { login } = useAuth();

  const handleGoogleLogin = () => {
    // Google OAuth 로그인
    const state = type; // 'login' 또는 'signup'
    const GOOGLE_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile&state=${state}`;
    window.location.href = GOOGLE_AUTH_URL;
  };

  const buttonText = type === 'signup' 
    ? 'Google로 회원가입' 
    : 'Google로 로그인';

  return (
    <button
      onClick={handleGoogleLogin}
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
