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

interface ArithmeticRecord {
  id: string;
  studentId: string;
  type: string;
  difficulty: string;
  totalProblems: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  timeSpent: number;
  averageTimePerProblem: number;
  date: string;
  student: Student;
  createdAt: string;
  updatedAt: string;
}

interface ArithmeticStatistics {
  totalRecords: number;
  averageScore: number;
  totalProblems: number;
  totalCorrectAnswers: number;
  totalTimeSpent: number;
  averageTimePerProblem: number;
  typeStatistics: Record<string, {
    count: number;
    totalScore: number;
    averageScore: number;
  }>;
  difficultyStatistics: Record<string, {
    count: number;
    totalScore: number;
    averageScore: number;
  }>;
  recentProgress: Array<{
    date: string;
    averageScore: number;
  }>;
}

export default function StudentArithmeticPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeSection] = useState<MyPageSection>('학생 연산 기록');
  const [arithmeticRecords, setArithmeticRecords] = useState<ArithmeticRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ArithmeticRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [statistics, setStatistics] = useState<ArithmeticStatistics | null>(null);

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
    const fetchData = async () => {
      if (!user?.token) return;

      try {
        setLoading(true);
        
        const headers = {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        };

        // 학생 목록 가져오기
        const studentsResponse = await fetch('/api/students', { headers });
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setStudents(studentsData.students || []);
          if (studentsData.students && studentsData.students.length > 0) {
            setSelectedStudent(studentsData.students[0]);
          }
        }

        // 연산 기록 가져오기
        const recordsResponse = await fetch('/api/arithmetic-records', { headers });
        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          setArithmeticRecords(recordsData.records || []);
          setFilteredRecords(recordsData.records || []);
        }

        // 통계 가져오기
        const statsResponse = await fetch('/api/arithmetic-records/statistics', { headers });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatistics(statsData);
        }

      } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudent) {
      const filtered = arithmeticRecords.filter(record => record.studentId === selectedStudent.id);
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(arithmeticRecords);
    }
  }, [selectedStudent, arithmeticRecords]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '쉬움':
        return 'text-green-600 bg-green-100';
      case '보통':
        return 'text-yellow-600 bg-yellow-100';
      case '어려움':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeDisplayName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'addition': '덧셈',
      'subtraction': '뺄셈',
      'multiplication': '곱셈',
      'division': '나눗셈',
      'mixed': '혼합연산'
    };
    
    return typeMap[type] || type;
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

        <div className="space-y-6">
          {/* 학생 선택 */}
          {students.length > 0 && (
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-title mb-4">학생 선택</h2>
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
            </div>
          )}

          {/* 통계 요약 */}
          {statistics && (
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-title mb-4">연산 통계</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics.totalRecords}</div>
                  <div className="text-sm text-body">총 기록</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics.averageScore.toFixed(1)}%</div>
                  <div className="text-sm text-body">평균 점수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{statistics.totalProblems}</div>
                  <div className="text-sm text-body">총 문제 수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{statistics.totalCorrectAnswers}</div>
                  <div className="text-sm text-body">정답 수</div>
                </div>
              </div>
            </div>
          )}

          {/* 연산 기록 목록 */}
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-title mb-4">연산 기록</h2>
            
            {loading && (
              <div className="text-center py-8">
                <div className="text-body">로딩 중...</div>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="text-red-600">{error}</div>
              </div>
            )}

            {!loading && !error && filteredRecords.length === 0 && (
              <div className="text-center py-8">
                <div className="text-body">연산 기록이 없습니다.</div>
              </div>
            )}

            {!loading && !error && filteredRecords.length > 0 && (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="border border-default rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-title">
                          {getTypeDisplayName(record.type)}
                        </h3>
                        <p className="text-sm text-body">{formatDate(record.date)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(record.difficulty)}`}>
                          {record.difficulty}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-body">총 문제</div>
                        <div className="font-semibold text-title">{record.totalProblems}개</div>
                      </div>
                      <div>
                        <div className="text-body">정답</div>
                        <div className="font-semibold text-green-600">{record.correctAnswers}개</div>
                      </div>
                      <div>
                        <div className="text-body">소요 시간</div>
                        <div className="font-semibold text-title">{formatTime(record.timeSpent)}</div>
                      </div>
                      <div>
                        <div className="text-body">점수</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {((record.correctAnswers / record.totalProblems) * 100).toFixed(1)}%
                        </div>
                      </div>
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