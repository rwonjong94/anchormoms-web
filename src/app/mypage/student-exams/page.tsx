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
}

interface Exam {
  id: string;
  examnum: number;
  grade: number;
  type: string;
  duration: number;
  isActive: boolean;
  status: string;
  targetQuestions: number;
  currentQuestions: number;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
}

interface ExamAttempt {
  id: string;
  studentId: string;
  examId: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  score?: number;
  totalQuestions: number;
  correctAnswers: number;
  exam: Exam;
  student: Student;
}

export default function StudentExamsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeSection] = useState<MyPageSection>('학생 시험 기록');
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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
      fetchStudents();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedStudent) {
      fetchExamAttempts(selectedStudent.id);
    }
  }, [selectedStudent]);

  useEffect(() => {
    filterAttempts();
  }, [examAttempts, selectedStudent]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        if (data.length > 0) {
          setSelectedStudent(data[0]);
        }
      } else {
        // 학생 목록을 불러오지 못해도 오류 알림 대신 빈 상태로 처리
        setStudents([]);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    }
  };

  const fetchExamAttempts = async (studentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/exams/attempts/student/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setExamAttempts(Array.isArray(data) ? data : []);
      } else {
        // 데이터가 없거나 권한 이슈 등 비정상 응답일 때도 빈 상태로 표시
        setExamAttempts([]);
      }
    } catch (error) {
      console.error('Failed to fetch exam attempts:', error);
      // 네트워크 오류 등도 빈 상태로 표시
      setExamAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAttempts = () => {
    let filtered = [...examAttempts];
    
    // Student filter - 선택된 학생의 시험 기록만 표시
    if (selectedStudent) {
      filtered = filtered.filter(attempt => attempt.studentId === selectedStudent.id);
    }
    
    setFilteredAttempts(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'COMPLETED': { text: '완료', className: 'bg-green-100 text-green-800' },
      'IN_PROGRESS': { text: '진행중', className: 'bg-yellow-100 text-yellow-800' },
      'ABANDONED': { text: '중단됨', className: 'bg-red-100 text-red-800' },
    };
    
    const statusInfo = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
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
              <h2 className="text-xl font-semibold text-title">학생 시험 기록</h2>
              
              {/* 학생 선택 필터 */}
              {students.length > 0 && (
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    const student = students.find(s => s.id === e.target.value);
                    setSelectedStudent(student || null);
                  }}
                  className="px-3 py-2 border border-default rounded-md bg-card text-title"
                >
                  <option value="">학생 선택</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.grade}학년)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-lg text-body">로딩 중...</div>
              </div>
            ) : !selectedStudent ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👨‍🎓</div>
                <h3 className="text-lg font-medium text-title mb-2">학생을 선택해주세요</h3>
                <p className="text-body">시험 기록을 조회할 학생을 선택해주세요.</p>
              </div>
            ) : filteredAttempts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-title mb-2">시험 기록이 없습니다</h3>
                <p className="text-body">{selectedStudent.name} 학생의 시험 응시 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAttempts.map((attempt) => (
                  <div key={attempt.id} className="border border-default rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-title">
                            {attempt.exam.type} {String(attempt.exam.examnum).padStart(3, '0')}번 시험
                          </h3>
                          {getStatusBadge(attempt.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-body">
                          <span>📅 {formatDate(attempt.startedAt)}</span>
                          <span>🕐 {formatTime(attempt.startedAt)}</span>
                          <span>⏱️ {attempt.exam.duration}분</span>
                          <span>📚 {attempt.exam.grade}학년</span>
                        </div>
                      </div>
                      
                      {attempt.status === 'COMPLETED' && attempt.score !== undefined && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(attempt.score)}`}>
                            {attempt.score}점
                          </div>
                          <div className="text-sm text-body">
                            {attempt.correctAnswers}/{attempt.totalQuestions} 정답
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {attempt.completedAt && (
                      <div className="text-sm text-body">
                        완료 시간: {formatDate(attempt.completedAt)} {formatTime(attempt.completedAt)}
                      </div>
                    )}
                    {attempt.status === 'IN_PROGRESS' && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="text-sm text-yellow-800">
                          ⏳ 시험이 진행 중입니다. 학생이 시험을 완료하면 결과가 표시됩니다.
                        </div>
                      </div>
                    )}
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
