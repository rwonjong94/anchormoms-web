'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// 트로피 타입 정의
interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: string;
  earned: boolean;
  earnedAt?: Date;
}

// 샘플 트로피 데이터
const SAMPLE_TROPHIES: Trophy[] = [
  {
    id: 'odd-even-king',
    name: '홀짝왕',
    description: '홀짝 관련 문제를 10개 이상 맞춘 왕',
    icon: '👑',
    rarity: 'rare',
    requirement: '홀짝 문제 10개 정답',
    earned: true,
    earnedAt: new Date('2024-01-15')
  },
  {
    id: 'arrangement-king',
    name: '나열왕',
    description: '순열 조합 문제를 15개 이상 맞춘 왕',
    icon: '🏆',
    rarity: 'epic',
    requirement: '순열 조합 문제 15개 정답',
    earned: true,
    earnedAt: new Date('2024-01-20')
  },
  {
    id: 'arithmetic-master',
    name: '산술 마스터',
    description: '산술 문제를 20개 이상 맞춘 마스터',
    icon: '🧮',
    rarity: 'common',
    requirement: '산술 문제 20개 정답',
    earned: false
  },
  {
    id: 'geometry-genius',
    name: '기하 천재',
    description: '기하 문제를 25개 이상 맞춘 천재',
    icon: '📐',
    rarity: 'rare',
    requirement: '기하 문제 25개 정답',
    earned: false
  },
  {
    id: 'logic-legend',
    name: '논리 전설',
    description: '논리 문제를 30개 이상 맞춘 전설',
    icon: '🧠',
    rarity: 'legendary',
    requirement: '논리 문제 30개 정답',
    earned: false
  },
  {
    id: 'perfect-score',
    name: '만점의 영광',
    description: '한 번의 퀴즈에서 모든 문제를 맞춘 영광',
    icon: '💯',
    rarity: 'epic',
    requirement: '한 퀴즈에서 모든 문제 정답',
    earned: false
  },
  {
    id: 'speed-demon',
    name: '속도의 악마',
    description: '평균 30초 이내로 문제를 해결한 악마',
    icon: '⚡',
    rarity: 'rare',
    requirement: '평균 해결 시간 30초 이내',
    earned: false
  },
  {
    id: 'persistence-champion',
    name: '끈기의 챔피언',
    description: '틀린 문제를 5번 이상 시도해서 맞춘 챔피언',
    icon: '💪',
    rarity: 'common',
    requirement: '틀린 문제 5번 이상 시도 후 정답',
    earned: false
  }
];

export default function TrophyRoom() {
  const { selectedStudent } = useAuth();
  const [trophies, setTrophies] = useState<Trophy[]>(SAMPLE_TROPHIES);
  const [filter, setFilter] = useState<'all' | 'earned' | 'not-earned'>('all');

  // 획득한 트로피와 미획득 트로피 분리
  const earnedTrophies = trophies.filter(trophy => trophy.earned);
  const notEarnedTrophies = trophies.filter(trophy => !trophy.earned);

  // 필터링된 트로피
  const filteredTrophies = filter === 'all' ? trophies :
                          filter === 'earned' ? earnedTrophies :
                          notEarnedTrophies;

  // 희귀도별 색상
  const getRarityColor = (rarity: Trophy['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
      case 'rare': return 'border-blue-300 bg-blue-50 dark:bg-blue-900/20';
      case 'epic': return 'border-purple-300 bg-purple-50 dark:bg-purple-900/20';
      case 'legendary': return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  // 희귀도별 텍스트 색상
  const getRarityTextColor = (rarity: Trophy['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 dark:text-gray-400';
      case 'rare': return 'text-blue-600 dark:text-blue-400';
      case 'epic': return 'text-purple-600 dark:text-purple-400';
      case 'legendary': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🏆 트로피 진열장
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {selectedStudent?.name}님의 퀴즈 성과를 확인해보세요!
          </p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {earnedTrophies.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              획득한 트로피
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-2">
              {notEarnedTrophies.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              미획득 트로피
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {Math.round((earnedTrophies.length / trophies.length) * 100)}%
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              달성률
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {earnedTrophies.filter(t => t.rarity === 'legendary').length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              전설 트로피
            </div>
          </div>
        </div>

        {/* 필터 버튼 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                전체 ({trophies.length})
              </button>
              <button
                onClick={() => setFilter('earned')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === 'earned'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                획득 ({earnedTrophies.length})
              </button>
              <button
                onClick={() => setFilter('not-earned')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === 'not-earned'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                미획득 ({notEarnedTrophies.length})
              </button>
            </div>
          </div>
        </div>

        {/* 트로피 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTrophies.map((trophy) => (
            <div
              key={trophy.id}
              className={`relative rounded-lg shadow-lg p-6 border-2 transition-all duration-300 ${
                trophy.earned 
                  ? getRarityColor(trophy.rarity)
                  : 'border-gray-200 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 opacity-60'
              }`}
            >
              {/* 트로피 아이콘 */}
              <div className="text-center mb-4">
                <div className={`text-6xl mb-2 ${trophy.earned ? '' : 'grayscale'}`}>
                  {trophy.icon}
                </div>
                <div className={`text-sm font-medium ${getRarityTextColor(trophy.rarity)}`}>
                  {trophy.rarity === 'common' && '일반'}
                  {trophy.rarity === 'rare' && '레어'}
                  {trophy.rarity === 'epic' && '에픽'}
                  {trophy.rarity === 'legendary' && '전설'}
                </div>
              </div>

              {/* 트로피 정보 */}
              <div className="text-center">
                <h3 className={`text-lg font-semibold mb-2 ${
                  trophy.earned 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-500 dark:text-gray-500'
                }`}>
                  {trophy.name}
                </h3>
                <p className={`text-sm mb-3 ${
                  trophy.earned 
                    ? 'text-gray-600 dark:text-gray-400' 
                    : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {trophy.description}
                </p>
                <div className={`text-xs ${
                  trophy.earned 
                    ? 'text-gray-500 dark:text-gray-500' 
                    : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {trophy.requirement}
                </div>
              </div>

              {/* 획득 날짜 */}
              {trophy.earned && trophy.earnedAt && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                    {trophy.earnedAt.toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* 미획득 오버레이 */}
              {!trophy.earned && (
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <div className="text-white text-sm font-medium">
                    미획득
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {filteredTrophies.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filter === 'earned' ? '아직 획득한 트로피가 없습니다' : '트로피가 없습니다'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              퀴즈를 풀어서 트로피를 획득해보세요!
            </p>
            <a
              href="/quiz"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              퀴즈 시작하기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}




