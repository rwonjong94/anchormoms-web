'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface RankingData {
  rank: number;
  name: string;
  grade: string;
  score: number;
  change: number;
}

interface PerformanceData {
  date: string;
  score: number;
  type: 'full' | 'half' | 'beginner';
}

export default function CoachingPage() {
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'full' | 'half' | 'beginner'>('full');

  // 임시 데이터 (나중에 API로 대체)
  const rankings: RankingData[] = [
    { rank: 1, name: '김수학', grade: '1등급', score: 98, change: 0 },
    { rank: 2, name: '이수학', grade: '1등급', score: 96, change: 2 },
    { rank: 3, name: '박수학', grade: '2등급', score: 92, change: -1 },
    { rank: 4, name: '최수학', grade: '2등급', score: 90, change: 1 },
    { rank: 5, name: '정수학', grade: '3등급', score: 85, change: 3 },
  ];

  const performanceData: PerformanceData[] = [
    { date: '2025-06-28', score: 85, type: 'full' },
    { date: '2025-07-05', score: 88, type: 'half' },
    { date: '2025-07-12', score: 92, type: 'full' },
    { date: '2025-07-19', score: 90, type: 'beginner' },
    { date: '2025-07-26', score: 95, type: 'full' },
  ];

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="flex justify-end mb-8">
          <div className="flex space-x-4">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 등급</option>
              <option value="1">1등급</option>
              <option value="2">2등급</option>
              <option value="3">3등급</option>
              <option value="4">4등급</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'full' | 'half' | 'beginner')}
              className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full">풀 모고</option>
              <option value="half">하프 모고</option>
              <option value="beginner">비기너 모고</option>
            </select>
          </div>
        </div>

        {/* 메인 컨텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 랭킹 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">랭킹</h2>
              <Link
                href="/coaching/ranking"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                전체 보기
              </Link>
            </div>
            <div className="space-y-4">
              {rankings.map((student) => (
                <div
                  key={student.rank}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      student.rank <= 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {student.rank}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.grade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{student.score}점</p>
                    <p className={`text-sm ${
                      student.change > 0 ? 'text-green-600' : 
                      student.change < 0 ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {student.change > 0 ? '↑' : student.change < 0 ? '↓' : '→'} {Math.abs(student.change)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 성적 추이 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">성적 추이</h2>
              <Link
                href="/coaching/performance"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                상세 분석
              </Link>
            </div>
            <div className="h-64 flex items-end space-x-2">
              {performanceData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(data.score / 100) * 100}%` }}
                  />
                  <p className="text-xs text-gray-500 mt-2">{formatDate(data.date)}</p>
                  <p className="text-xs font-medium text-gray-700">{data.score}점</p>
                </div>
              ))}
            </div>
          </div>

          {/* 오답 노트 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">오답 노트</h2>
              <Link
                href="/coaching/wrong-notes"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                전체 보기
              </Link>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">최근 오답한 문제가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-1">모의고사를 응시하면 오답 노트가 자동으로 생성됩니다.</p>
              </div>
            </div>
          </div>

          {/* 상담 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">온라인 상담</h2>
              <Link
                href="/coaching/consultation"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                상담 신청
              </Link>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">예정된 상담이 없습니다.</p>
                <p className="text-sm text-gray-500 mt-1">온라인 상담을 신청하여 학습 상담을 받아보세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 