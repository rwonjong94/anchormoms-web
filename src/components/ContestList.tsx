'use client';

import { Contest } from '@/types/contest';
import ContestCard from './ContestCard';

interface ContestListProps {
  contests: Contest[];
  title?: string;
  showDetail?: boolean;
  maxItems?: number;
}

export default function ContestList({ 
  contests, 
  title = "경시대회 일정", 
  showDetail = false,
  maxItems 
}: ContestListProps) {
  // 최대 개수 제한
  const displayedContests = maxItems ? contests.slice(0, maxItems) : contests;

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
      </div>

      {/* 경시대회 카드 리스트 */}
      <div className="space-y-4">
        {displayedContests.length > 0 ? (
          displayedContests.map((contest) => (
            <ContestCard 
              key={contest.id} 
              contest={contest} 
              showDetail={showDetail}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 text-lg mb-2">
              등록된 경시대회가 없습니다.
            </div>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              새로운 경시대회 정보를 곧 업데이트할 예정입니다.
            </p>
          </div>
        )}
      </div>

      {/* 더 보기 버튼 (maxItems가 설정된 경우) */}
      {maxItems && contests.length > maxItems && (
        <div className="mt-6 text-center">
          <button className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            전체 일정 보기 ({contests.length}개)
          </button>
        </div>
      )}
    </div>
  );
}
