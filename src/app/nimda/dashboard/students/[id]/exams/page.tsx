'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StudentInfoSection from '@/components/admin/StudentInfoSection';
import { type Student, StudentSchema } from '@/dto';

interface ExamInfo {
  id: string;
  examnum: number;
  grade: number;
  type: string;
  duration: number;
}

interface ExamAttemptItem {
  id: string;
  studentId: string;
  examId: string;
  startedAt: string;
  completedAt?: string | null;
  status: string;
  score?: number | null;
  totalQuestions: number;
  correctAnswers: number;
  exam: ExamInfo;
}

export default function StudentExamsPage() {
  const params = useParams();
  const studentId = String(params?.id || '');
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [attempts, setAttempts] = useState<ExamAttemptItem[]>([]);
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

  // 학생의 시험 시도 목록 가져오기 (관리자 권한으로)
  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        const resp = await fetch(`/api/exams/attempts/student/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!resp.ok) {
          console.error('Failed to fetch attempts');
          setAttempts([]);
          return;
        }
        const data = await resp.json();
        setAttempts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching attempts:', e);
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchAttempts();
  }, [studentId]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      COMPLETED: { text: '완료', className: 'bg-green-100 text-green-800' },
      IN_PROGRESS: { text: '진행중', className: 'bg-yellow-100 text-yellow-800' },
      ABANDONED: { text: '중단됨', className: 'bg-red-100 text-red-800' },
    };
    const info = map[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.className}`}>{info.text}</span>
    );
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
        <StudentInfoSection student={student} currentPage="exams" />

        <div className="bg-card rounded-lg shadow-sm border border-default p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-title">시험 시도 기록</h3>
          </div>

          {loading ? (
            <div className="text-center py-12">로딩 중...</div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted">시험 시도 기록이 없습니다.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map(attempt => (
                <div key={attempt.id} className="border border-default rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-title">
                          {attempt.exam.type} {String(attempt.exam.examnum).padStart(3, '0')}번
                        </div>
                        {getStatusBadge(attempt.status)}
                      </div>
                      <div className="text-sm text-body flex gap-4">
                        <span>학년 {attempt.exam.grade}</span>
                        <span>시간 {attempt.exam.duration}분</span>
                        <span>문항 {attempt.totalQuestions}개</span>
                        <span>정답 {attempt.correctAnswers}개</span>
                      </div>
                    </div>
                    {attempt.status === 'COMPLETED' && attempt.score != null && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{attempt.score}점</div>
                      </div>
                    )}
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
