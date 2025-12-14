'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StudentInfoSection from '@/components/admin/StudentInfoSection';

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
}

export default function StudentArithmeticPage() {
  const params = useParams();
  const studentId = String(params?.id || '');
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [records, setRecords] = useState<ArithmeticRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 학생 정보 가져오기
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          window.location.href = '/nimda';
          return;
        }

        const response = await fetch(`/api/nimda/students/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStudent(data);
        } else {
          console.error('Failed to fetch student');
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      } finally {
        setStudentLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  // 학생의 연산 기록(관리자) 조회
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        const params = new URLSearchParams({ studentId });
        const resp = await fetch(`/api/arithmetic-records/admin?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!resp.ok) {
          console.error('Failed to fetch arithmetic records');
          setRecords([]);
        } else {
          const data = await resp.json();
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Error fetching arithmetic records:', e);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchRecords();
  }, [studentId]);

  const getDifficultyBadge = (difficulty: string) => {
    const map: Record<string, { text: string; cls: string }> = {
      EASY: { text: '쉬움', cls: 'bg-green-100 text-green-800' },
      MEDIUM: { text: '보통', cls: 'bg-yellow-100 text-yellow-800' },
      HARD: { text: '어려움', cls: 'bg-red-100 text-red-800' },
    };
    const info = map[difficulty] || { text: difficulty, cls: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.cls}`}>{info.text}</span>;
  };

  if (studentLoading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-title mb-2">학생을 찾을 수 없습니다</h2>
          <p className="text-muted">요청하신 학생 정보가 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentInfoSection student={student} currentPage="arithmetic" />

        <div className="bg-card rounded-lg shadow-sm border border-default p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-title">연산 기록</h3>
          </div>

          {loading ? (
            <div className="text-center py-12">로딩 중...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted">연산 기록이 없습니다.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map(r => (
                <div key={r.id} className="border border-default rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-title">{r.type}</div>
                        {getDifficultyBadge(r.difficulty)}
                      </div>
                      <div className="text-sm text-body flex gap-4">
                        <span>문항 {r.totalProblems}개</span>
                        <span>정답 {r.correctAnswers}개</span>
                        <span>점수 {r.score}</span>
                        <span>소요 {Math.round(r.timeSpent / 60)}분</span>
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
  );
}
