'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CONTESTS } from '@/data/contests';
import { Contest, getContestStatus, getDDay, formatDate } from '@/types/contest';
import ContestCard from '@/components/ContestCard';

export default function ContestDetailPage() {
  const params = useParams();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const contestId = params.id as string;
    const foundContest = CONTESTS.find(c => c.id === contestId);
    setContest(foundContest || null);
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            경시대회를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            요청하신 경시대회 정보가 존재하지 않습니다.
          </p>
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  const status = getContestStatus(contest);
  const registrationDDay = getDDay(contest.registrationDeadline);
  const examDDay = getDDay(contest.examDate);
  const resultDDay = contest.resultDate ? getDDay(contest.resultDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </a>
        </div>

        {/* 경시대회 상세 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4">{contest.title}</h1>
                <div className="flex items-center gap-4 text-blue-100">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    대상: {contest.target}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    상태: {status === 'upcoming' ? '접수 예정' : 
                           status === 'registration' ? '접수 중' :
                           status === 'exam' ? '시험 임박' :
                           status === 'result' ? '성적 발표' : '종료'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {status === 'registration' && registrationDDay <= 7 && (
                  <div className="text-2xl font-bold text-red-200">
                    D-{registrationDDay}
                  </div>
                )}
                {status === 'exam' && examDDay <= 7 && (
                  <div className="text-2xl font-bold text-orange-200">
                    D-{examDDay}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 상세 내용 */}
          <div className="p-8">
            {/* 설명 */}
            {contest.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  대회 소개
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {contest.description}
                </p>
              </div>
            )}

            {/* 일정 정보 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                📅 일정 정보
              </h2>
              <div className="grid gap-6">
                {/* 접수 마감 */}
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-gray-900 dark:text-white">접수 마감</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(contest.registrationDeadline)}
                    </div>
                    {contest.registrationDeadlineTime && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {contest.registrationDeadlineTime}
                      </div>
                    )}
                    {registrationDDay > 0 && (
                      <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                        D-{registrationDDay}
                      </div>
                    )}
                  </div>
                </div>

                {/* 시험일 */}
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-gray-900 dark:text-white">시험일</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(contest.examDate)}
                    </div>
                    {contest.examTime && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {contest.examTime}
                      </div>
                    )}
                    {examDDay > 0 && (
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        D-{examDDay}
                      </div>
                    )}
                  </div>
                </div>

                {/* 예선시험 (있는 경우) */}
                {contest.hasPreliminary && contest.preliminaryDate && (
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 dark:text-white">예선시험</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(contest.preliminaryDate)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 본선시험 (있는 경우) */}
                {contest.hasPreliminary && contest.finalDate && (
                  <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 dark:text-white">본선시험</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(contest.finalDate)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 성적 발표 */}
                {contest.resultDate && (
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 dark:text-white">성적 발표</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(contest.resultDate)}
                      </div>
                      {resultDDay && resultDDay > 0 && (
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                          D-{resultDDay}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={contest.website.startsWith('http') ? contest.website : `https://${contest.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                🏠 공식 홈페이지 방문
              </a>
              <button className="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                🔔 알림 설정
              </button>
              <button className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                📅 캘린더에 추가
              </button>
            </div>
          </div>
        </div>

        {/* 다른 경시대회 추천 */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            다른 경시대회 보기
          </h2>
          <div className="grid gap-4">
            {CONTESTS.filter(c => c.id !== contest.id).slice(0, 2).map((otherContest) => (
              <ContestCard key={otherContest.id} contest={otherContest} showDetail={true} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
