'use client';

import { Contest, getContestStatus, getDDay } from '@/types/contest';
import { useState } from 'react';

interface ContestNotificationBannerProps {
  urgentContests: Contest[];
}

export default function ContestNotificationBanner({ urgentContests }: ContestNotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || urgentContests.length === 0) {
    return null;
  }

  const getUrgentMessage = (contest: Contest) => {
    const status = getContestStatus(contest);
    const registrationDDay = getDDay(contest.registrationDeadline);
    const examDDay = getDDay(contest.examDate);

    if (status === 'registration' && registrationDDay <= 3) {
      return `📝 ${contest.title} 접수 마감 D-${registrationDDay}`;
    } else if (status === 'exam' && examDDay <= 3) {
      return `📅 ${contest.title} 시험일 D-${examDDay}`;
    }
    return null;
  };

  const urgentMessages = urgentContests
    .map(getUrgentMessage)
    .filter(Boolean);

  if (urgentMessages.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg shadow-lg mb-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span className="font-bold text-sm">🚨 긴급 공지</span>
          </div>
          <div className="space-y-1">
            {urgentMessages.map((message, index) => (
              <div key={index} className="text-sm font-medium">
                {message}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="공지 닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
