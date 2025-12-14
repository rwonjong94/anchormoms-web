'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function MyPage() {
  const { user } = useAuth();

  return (
    <div className="bg-card rounded-lg shadow-sm border border-default p-6">
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-title mb-2">
            안녕하세요, {user?.name || user?.email || '회원'}님!
          </h2>
          <p className="text-muted">
            마이페이지에서 다양한 기능을 이용해보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📚 학습 관리</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              수업 일지, 시험 기록, 연산 기록을 확인하세요.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">🛒 구매 관리</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              구매 내역과 트로피를 확인하세요.
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">💬 상담 기록</h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              학부모 상담 기록을 관리하세요.
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">⚙️ 설정</h3>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              계정 정보와 기본 설정을 관리하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}