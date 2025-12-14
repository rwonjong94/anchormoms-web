'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageLayout from '@/components/admin/AdminPageLayout';

// 퀴즈 통계 타입 정의
interface QuizStats {
  totalAttempts: number;
  totalCorrect: number;
  totalPoints: number;
  averageTime: number;
  difficultyStats: {
    [key: string]: {
      attempts: number;
      correct: number;
      points: number;
    };
  };
  typeStats: {
    [key: string]: {
      attempts: number;
      correct: number;
      points: number;
    };
  };
  studentStats: Array<{
    studentId: string;
    studentName: string;
    attempts: number;
    correct: number;
    points: number;
    accuracy: number;
  }>;
  recentActivity: Array<{
    id: string;
    studentName: string;
    question: string;
    isCorrect: boolean;
    points: number;
    timestamp: Date;
  }>;
}

// 샘플 통계 데이터
const SAMPLE_STATS: QuizStats = {
  totalAttempts: 1250,
  totalCorrect: 890,
  totalPoints: 12450,
  averageTime: 45.2,
  difficultyStats: {
    초급: { attempts: 500, correct: 450, points: 4500 },
    중급: { attempts: 400, correct: 280, points: 4200 },
    고급: { attempts: 350, correct: 160, points: 3750 }
  },
  typeStats: {
    'number-theory': { attempts: 300, correct: 220, points: 2200 },
    'combinatorics': { attempts: 250, correct: 150, points: 3000 },
    'arithmetic': { attempts: 400, correct: 350, points: 3500 },
    'geometry': { attempts: 200, correct: 120, points: 1800 },
    'logic': { attempts: 100, correct: 50, points: 1950 }
  },
  studentStats: [
    { studentId: '1', studentName: '김철수', attempts: 45, correct: 38, points: 380, accuracy: 84.4 },
    { studentId: '2', studentName: '이영희', attempts: 52, correct: 41, points: 410, accuracy: 78.8 },
    { studentId: '3', studentName: '박민수', attempts: 38, correct: 32, points: 320, accuracy: 84.2 },
    { studentId: '4', studentName: '최지영', attempts: 41, correct: 35, points: 350, accuracy: 85.4 },
    { studentId: '5', studentName: '정현우', attempts: 35, correct: 28, points: 280, accuracy: 80.0 }
  ],
  recentActivity: [
    {
      id: '1',
      studentName: '김철수',
      question: '100부터 200까지의 수 중에서 홀수의 개수를 구하세요.',
      isCorrect: true,
      points: 10,
      timestamp: new Date('2024-01-20T15:30:00')
    },
    {
      id: '2',
      studentName: '이영희',
      question: '숫자 카드 1, 2, 3, 4를 이용해 만든 수 중 10번째 수는 무엇인지 구하세요.',
      isCorrect: false,
      points: 0,
      timestamp: new Date('2024-01-20T15:25:00')
    },
    {
      id: '3',
      studentName: '박민수',
      question: '1+2+3+...+100의 합을 구하세요.',
      isCorrect: true,
      points: 10,
      timestamp: new Date('2024-01-20T14:20:00')
    }
  ]
};

export default function QuizStatsPage() {
  const [stats, setStats] = useState<QuizStats>(SAMPLE_STATS);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // 정확도 계산
  const accuracy = stats.totalAttempts > 0 ? (stats.totalCorrect / stats.totalAttempts) * 100 : 0;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminPageLayout
          title="퀴즈 통계"
          description="퀴즈 참여 현황과 성과를 분석합니다."
          headerActions={
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="week">최근 1주</option>
              <option value="month">최근 1개월</option>
              <option value="year">최근 1년</option>
            </select>
          }
        >

          {/* 전체 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 시도 횟수</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalAttempts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 정답 수</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalCorrect}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">정확도</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{accuracy.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 포인트</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalPoints}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 난이도별 통계 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                난이도별 통계
              </h3>
              <div className="space-y-4">
                {Object.entries(stats.difficultyStats).map(([difficulty, data]) => {
                  const accuracy = data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0;
                  return (
                    <div key={difficulty} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{difficulty}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {data.attempts}회 시도, {data.correct}회 정답
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {accuracy.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {data.points}점
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 유형별 통계 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                유형별 통계
              </h3>
              <div className="space-y-4">
                {Object.entries(stats.typeStats).map(([type, data]) => {
                  const accuracy = data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0;
                  const typeNames: { [key: string]: string } = {
                    'number-theory': '수론',
                    'combinatorics': '조합론',
                    'arithmetic': '산술',
                    'geometry': '기하',
                    'logic': '논리'
                  };
                  return (
                    <div key={type} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{typeNames[type]}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {data.attempts}회 시도, {data.correct}회 정답
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {accuracy.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {data.points}점
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 학생별 성과 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                학생별 성과
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-sm font-medium text-gray-500 dark:text-gray-400">학생</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500 dark:text-gray-400">시도</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500 dark:text-gray-400">정확도</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500 dark:text-gray-400">포인트</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.studentStats.map((student) => (
                      <tr key={student.studentId} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-2 text-sm font-medium text-gray-900 dark:text-white">
                          {student.studentName}
                        </td>
                        <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                          {student.attempts}
                        </td>
                        <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                          {student.accuracy.toFixed(1)}%
                        </td>
                        <td className="py-2 text-sm text-gray-600 dark:text-gray-400">
                          {student.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                최근 활동
              </h3>
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.studentName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {activity.question}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {activity.timestamp.toLocaleString()} • {activity.points}점
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminPageLayout>
      </div>
    </AdminLayout>
  );
}