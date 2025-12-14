'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ExamReservationButtonProps {
  onReservationComplete?: () => void;
  variant?: 'default' | 'dark';
}

export default function ExamReservationButton({ onReservationComplete, variant = 'default' }: ExamReservationButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleReservation = async () => {
    setIsLoading(true);
    
    try {
      if (!isAuthenticated) {
        // 로그인하지 않은 사용자는 회원가입으로 이동
        router.push('/auth/signup');
        return;
      }

      // TODO: API 호출로 test_alarm을 true로 설정
      // await api.updateUserTestAlarm(user.id, true);
      
      // 임시로 성공 처리
      if (onReservationComplete) {
        onReservationComplete();
      }
      
    } catch (error) {
      console.error('예약 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClass = variant === 'dark' 
    ? "w-full bg-white/20 backdrop-blur-sm text-white border border-white/30 py-2 px-6 rounded-xl font-semibold text-base hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    : "w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2";

  return (
    <button
      onClick={handleReservation}
      disabled={isLoading}
      className={buttonClass}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>처리 중...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {isAuthenticated ? '온라인 모의고사 신청' : '온라인 모의고사 신청하기'}
          </span>
        </>
      )}
    </button>
  );
} 