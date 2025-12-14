'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type MyPageSection = '수업 일지' | '학생 설명 영상' | '학부모 상담 기록' | '학생 시험 기록' | '학생 연산 기록' | '기본 정보 설정';

interface Student {
  id: string;
  name: string;
  grade: number;
  school?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CounselingLog {
  id: string;
  title: string;
  content: string;
  date: string;
  student: Student;
  createdAt: string;
  updatedAt: string;
}

export default function ParentCounselingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeSection] = useState<MyPageSection>('학부모 상담 기록');
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<CounselingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 학생 필터 제거

  const myPageSections: MyPageSection[] = [
    '수업 일지',
    '학생 설명 영상',
    '학부모 상담 기록',
    '학생 시험 기록',
    '학생 연산 기록',
    '기본 정보 설정'
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCounselingLogs();
    }
  }, [isAuthenticated, user]);

  // 학생 변경 트리거 제거

  useEffect(() => {
    setFilteredLogs(counselingLogs);
  }, [counselingLogs]);

  // 학생 목록 조회 제거

  const fetchCounselingLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/counseling-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCounselingLogs(Array.isArray(data) ? data : []);
      } else {
        // 오류 시에도 사용자 경험을 위해 빈 상태로 처리
        setCounselingLogs([]);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to fetch counseling logs:', error);
      // 네트워크 오류 등도 빈 상태로 처리
      setCounselingLogs([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // 필터 로직 제거

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const handleSectionClick = (section: MyPageSection) => {
    if (section === '수업 일지') {
      router.push('/mypage/class-log');
    } else if (section === '학생 설명 영상') {
      router.push('/mypage/explanations');
    } else if (section === '학부모 상담 기록') {
      router.push('/mypage/parent-counseling');
    } else if (section === '학생 시험 기록') {
      router.push('/mypage/student-exams');
    } else if (section === '학생 연산 기록') {
      router.push('/mypage/student-arithmetic');
    } else if (section === '기본 정보 설정') {
      router.push('/mypage/settings');
    }
  };

  // 사이드바 아이템 렌더링
  const renderSidebarItem = (section: MyPageSection) => {
    const isActive = activeSection === section;
    
    return (
      <button
        key={section}
        onClick={() => handleSectionClick(section)}
        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-body hover:bg-muted dark:hover:bg-hover'
        }`}
      >
        {section}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div>
          <div className="bg-card rounded-lg shadow-sm border border-default p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-title">학부모 상담 기록</h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-lg text-body">로딩 중...</div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-title mb-2">오류가 발생했습니다</h3>
                <p className="text-body">{error}</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-title mb-2">상담 기록이 없습니다</h3>
                <p className="text-body">아직 등록된 상담 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border border-default rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-title mb-2">{log.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-body">
                          <span>📅 {formatDate(log.date)}</span>
                          <span>👨‍🎓 {log.student.name} ({log.student.grade}학년)</span>
                          {log.student.school && <span>🏫 {log.student.school}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none text-body">
                      <div className="whitespace-pre-wrap">{log.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
