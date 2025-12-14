'use client';

import { useState, useEffect } from 'react';

export default function ExamTakerCounter() {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // TODO: 실제 API에서 데이터 가져오기
    // 임시로 랜덤한 숫자 시뮬레이션
    const baseCount = 1247; // 기본 응시자 수
    const randomExtra = Math.floor(Math.random() * 50); // 0-49 추가
    const totalCount = baseCount + randomExtra;
    
    // 카운터 애니메이션
    let currentCount = 0;
    const increment = Math.ceil(totalCount / 50);
    
    const timer = setInterval(() => {
      currentCount += increment;
      if (currentCount >= totalCount) {
        currentCount = totalCount;
        clearInterval(timer);
        setIsAnimating(false);
      }
      setCount(currentCount);
    }, 50);

    setIsAnimating(true);

    // 실시간 업데이트 시뮬레이션 (30초마다)
    const updateTimer = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3)); // 0-2 증가
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(updateTimer);
    };
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            실시간 누적 응시자
          </h3>
        </div>
        
        <div className={`text-3xl font-bold text-blue-600 mb-1 ${isAnimating ? 'animate-pulse' : ''}`}>
          {formatNumber(count)}명
        </div>
        
        <p className="text-sm text-gray-500">
          이번 주 모의고사 참여자
        </p>
        
        {/* 실시간 표시 */}
        <div className="flex items-center justify-center space-x-1 mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">실시간 업데이트</span>
        </div>
      </div>
    </div>
  );
} 