'use client';

import { Contest, getContestStatus, getDDay, formatDate } from '@/types/contest';
import Link from 'next/link';

interface ContestCardProps {
  contest: Contest;
  showDetail?: boolean;
}

export default function ContestCard({ contest, showDetail = false }: ContestCardProps) {
  const status = getContestStatus(contest);
  const examDDay = getDDay(contest.examDate);

  // 상태별 스타일
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'registration':
        return 'bg-red-100 text-red-800';
      case 'exam':
        return 'bg-orange-100 text-orange-800';
      case 'result':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '접수 예정';
      case 'registration':
        return '접수 중';
      case 'exam':
        return '시험 임박';
      case 'result':
        return '성적 발표';
      default:
        return '종료';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-200">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            {contest.title}
          </h3>
          <div className="flex items-center gap-2">
            {examDDay > 0 && (
              <span className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-full animate-pulse">
                D-{examDDay}
              </span>
            )}
            {examDDay === 0 && (
              <span className="px-2 py-1 text-xs font-bold bg-green-600 text-white rounded-full">
                오늘
              </span>
            )}
            {examDDay < 0 && (
              <span className="px-2 py-1 text-xs font-bold bg-gray-500 text-white rounded-full">
                종료
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <a
            href={contest.website.startsWith('http') ? contest.website : `https://${contest.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            홈페이지
          </a>
        </div>
      </div>

      {/* 일정 정보 */}
      <div className="space-y-3 mb-4">
        {/* 대상 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">대상</span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {contest.target}
          </div>
        </div>

        {/* 접수 마감 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">접수 마감</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {formatDate(contest.registrationDeadline)}
            </div>
            {contest.registrationDeadlineTime && (
              <div className="text-xs text-gray-500">
                {contest.registrationDeadlineTime}
              </div>
            )}
          </div>
        </div>

        {/* 시험일 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">시험일</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {formatDate(contest.examDate)}
            </div>
            {contest.examTime && (
              <div className="text-xs text-gray-500">
                {contest.examTime}
              </div>
            )}
          </div>
        </div>


        {/* 성적 발표 */}
        {contest.resultDate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">성적 발표</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {formatDate(contest.resultDate)}
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      {showDetail && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Link
            href={`/contests/${contest.id}`}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            자세히 보기
          </Link>
        </div>
      )}
    </div>
  );
}
