'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
  };

  const getActiveTab = () => {
    if (pathname.includes('/exams')) return 'exams';
    if (pathname.includes('/scores')) return 'scores';
    if (pathname.includes('/lectures')) return 'lectures';
    if (pathname.includes('/classes')) return 'classes';
    if (pathname.includes('/counselings')) return 'counselings';
    if (pathname.includes('/columns')) return 'columns';
    if (pathname.includes('/stores')) return 'stores';
    if (pathname.includes('/schedules')) return 'schedules';
    if (pathname.includes('/roadmaps')) return 'roadmaps';
    if (pathname.includes('/students')) return 'students';
    if (pathname.includes('/problems')) return 'problems';
    return 'students';
  };

  // 탭은 Link로 렌더링하여 prefetch 및 즉각 반응

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-page">
      {/* 헤더 */}
      <div className="bg-card shadow border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/nimda/dashboard/students"
                prefetch
                className="text-2xl font-bold text-title hover:text-indigo-600"
              >
                Mogo 관리자
              </Link>
              <span className="text-sm text-muted">관리자: {user?.username}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-card border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
          {/* 1줄: 학생/수업/성적/상담/설명 */}
          <nav className="flex flex-wrap gap-x-8">
            <Link
              href="/nimda/dashboard/students"
              prefetch
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">👥</span> 학생 관리
            </Link>
            <Link
              href="/nimda/dashboard/classes"
              prefetch
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'classes'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">📚</span> 수업 관리
            </Link>
            <Link
              href="/nimda/dashboard/scores"
              prefetch
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scores'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">💯</span> 성적 관리
            </Link>
            <Link
              href="/nimda/dashboard/counselings"
              prefetch
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'counselings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">💬</span> 상담 관리
            </Link>
          </nav>
          {/* 2줄: 강의/시험/칼럼/문제/자료/퀴즈 */}
          <nav className="flex flex-wrap gap-x-8 border-t border-default/60">
            <Link
              href="/nimda/dashboard/lectures"
              prefetch
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lectures'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">🎓</span> 강의 관리
            </Link>
            <Link
              href="/nimda/dashboard/exams"
              prefetch
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'exams'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">📝</span> 시험 관리
            </Link>
            <Link
              href="/nimda/dashboard/columns"
              prefetch
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'columns'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">📰</span> 칼럼 관리
            </Link>
            <Link
              href="/nimda/dashboard/problems"
              prefetch
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'problems'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">🧩</span> 문제 관리
            </Link>
            <Link
              href="/nimda/dashboard/stores"
              prefetch
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stores'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">📦</span> 자료 관리
            </Link>
            <Link
              href="/nimda/dashboard/schedules"
              prefetch
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedules'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">📅</span> 시간표 관리
            </Link>
            <Link
              href="/nimda/dashboard/roadmaps"
              prefetch
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roadmaps'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-muted hover:text-body hover:border-default'
              }`}
            >
              <span className="mr-1">🗺️</span> 로드맵 관리
            </Link>
          </nav>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      {children}
    </div>
  );
}