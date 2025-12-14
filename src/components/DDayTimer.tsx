'use client';

import { useState, useEffect } from 'react';
import ExamReservationButton from './ExamReservationButton';

export default function DDayTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [nextExamDate, setNextExamDate] = useState<Date | null>(null);

  // 다음 토요일 14:00 계산
  const getNextSaturday = () => {
    const now = new Date();
    const nextSaturday = new Date();
    
    // 바로 시험을 볼 수 있도록 현재 시간에서 10초 후로 설정
    nextSaturday.setTime(now.getTime() + (10 * 1000)); // 10초 후
    
    return nextSaturday;
  };

  useEffect(() => {
    const targetDate = getNextSaturday();
    setNextExamDate(targetDate);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        // 시험 시간이 지나면 다음 토요일로 재설정
        const newTargetDate = getNextSaturday();
        setNextExamDate(newTargetDate);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    
    return `${year}.${month}.${day}(${weekday}) 14:00`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 px-6 rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* 상단: 알림 신청 버튼 */}
        <div className="max-w-md mx-auto">
          <ExamReservationButton variant="dark" />
        </div>

        {/* 하단: 타이머 */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">다음 정기 모의고사</h2>
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-bold">{timeLeft.days}</div>
              <div className="text-sm opacity-90">일</div>
            </div>
            <div className="text-2xl font-bold opacity-70">:</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-bold">{timeLeft.hours}</div>
              <div className="text-sm opacity-90">시간</div>
            </div>
            <div className="text-2xl font-bold opacity-70">:</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-bold">{timeLeft.minutes}</div>
              <div className="text-sm opacity-90">분</div>
            </div>
            <div className="text-2xl font-bold opacity-70">:</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-bold">{timeLeft.seconds}</div>
              <div className="text-sm opacity-90">초</div>
            </div>
          </div>
          {nextExamDate && (
            <p className="text-lg opacity-90">
              {formatDate(nextExamDate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 