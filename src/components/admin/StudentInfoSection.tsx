'use client';

import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
  grade: number;
  school?: string;
  phone?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    googleId?: string;
    kakaoId?: string;
  };
}

interface StudentInfoSectionProps {
  student: Student;
  currentPage?: 'counselings' | 'exams' | 'explanations' | 'arithmetic' | 'schedule' | 'roadmap' | 'scores';
}

export default function StudentInfoSection({ student, currentPage }: StudentInfoSectionProps) {
  const router = useRouter();

  const menuItems = [
    {
      key: 'schedule',
      label: '시간표',
      icon: '🗓️',
      path: `/nimda/dashboard/students/${student.id}?tab=schedule`,
      bgColor: 'bg-cyan-50',
      hoverColor: 'hover:bg-cyan-100',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-700'
    },
    {
      key: 'roadmap',
      label: '로드맵',
      icon: '🗺️',
      path: `/nimda/dashboard/students/${student.id}/roadmap`,
      bgColor: 'bg-amber-50',
      hoverColor: 'hover:bg-amber-100',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700'
    },
    {
      key: 'scores',
      label: '성적 관리',
      icon: '📈',
      path: `/nimda/dashboard/students/${student.id}/scores`,
      bgColor: 'bg-rose-50',
      hoverColor: 'hover:bg-rose-100',
      borderColor: 'border-rose-200',
      textColor: 'text-rose-700'
    },
    {
      key: 'counselings',
      label: '상담 관리',
      icon: '💬',
      path: `/nimda/dashboard/students/${student.id}/counselings`,
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    },
    {
      key: 'exams',
      label: '시험 관리',
      icon: '📊',
      path: `/nimda/dashboard/students/${student.id}/exams`,
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    },
    {
      key: 'explanations',
      label: '설명 관리',
      icon: '🎥',
      path: `/nimda/dashboard/students/${student.id}/explanations`,
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      key: 'arithmetic',
      label: '연산 관리',
      icon: '🧮',
      path: `/nimda/dashboard/students/${student.id}/arithmetic`,
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700'
    }
  ];

  return (
    <>
      {/* 상단 네비게이션 */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => router.push('/nimda/dashboard/students')}
          className="text-indigo-600 hover:text-indigo-800 text-sm"
        >
          ← 목록으로 돌아가기
        </button>
      </div>

      {/* 학생 정보 섹션 */}
      <div className="bg-card rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 학생 정보 */}
          <div>
            <h3 className="text-base font-semibold text-title mb-2 border-b border-default pb-1">학생 정보</h3>
            <div className="space-y-2">
              {/* 윗줄: 이름, 핸드폰 번호 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-medium text-muted">이름</span>
                  <p className="text-sm text-title">{student.name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted">핸드폰 번호</span>
                  <p className="text-sm text-title">{student.phone || '미등록'}</p>
                </div>
              </div>
              
              {/* 아랫줄: 학교, 학년 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-medium text-muted">학교</span>
                  <p className="text-sm text-title">{student.school || '미등록'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted">학년</span>
                  <p className="text-sm text-title">{student.grade}학년</p>
                </div>
              </div>
            </div>
          </div>

          {/* 부모 정보 */}
          <div>
            <h3 className="text-base font-semibold text-title mb-2 border-b border-default pb-1">부모 정보</h3>
            {student.user ? (
              <div className="space-y-2">
                {/* 윗줄: 이름, 핸드폰 번호 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-medium text-muted">이름</span>
                    <p className="text-sm text-title">{student.user.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted">핸드폰 번호</span>
                    <p className="text-sm text-title">{student.user.phone || '미등록'}</p>
                  </div>
                </div>
                
                {/* 아랫줄: 이메일 */}
                <div>
                  <span className="text-xs font-medium text-muted">이메일</span>
                  <p className="text-sm text-title">{student.user.email?.trim() || '미등록'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted italic">등록된 부모 정보가 없습니다</p>
            )}
          </div>
        </div>

        {/* 관리 메뉴 - 학생/부모 정보 아래로 이동 */}
        <div className="mt-6 pt-6 border-t border-default">
          <h3 className="text-base font-semibold text-title mb-4">관리 메뉴</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center p-3 ${item.bgColor} ${item.hoverColor} border ${item.borderColor} rounded-md transition-colors ${
                  currentPage === item.key ? 'ring-2 ring-offset-1 ring-indigo-500' : ''
                }`}
              >
                <span className="text-lg mb-1">{item.icon}</span>
                <span className={`text-xs font-medium ${item.textColor} text-center`}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}