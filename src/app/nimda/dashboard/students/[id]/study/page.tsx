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

export default function StudentStudyPage() {
  const params = useParams();
  const studentId = String(params?.id || '');
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);

  // 학생 정보 가져오기
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const resp = await fetch(`/api/nimda/students/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setStudent(data);
        }
      } finally {
        setStudentLoading(false);
      }
    };
    if (studentId) fetchStudent();
  }, [studentId]);

  if (studentLoading) {
    return <div className="animate-pulse h-40 bg-muted rounded" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 학생 정보 섹션 */}
      {student && (
        <StudentInfoSection student={student} />
      )}

      {/* 공부 기록 관리 영역 */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-title mb-4">공부 기록 관리</h2>
        <div className="text-center py-12">
          <p className="text-muted">공부 기록 관리 기능이 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}








