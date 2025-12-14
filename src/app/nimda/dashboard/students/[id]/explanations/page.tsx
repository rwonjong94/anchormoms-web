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

export default function StudentExplanationsPage() {
  const params = useParams();
  const studentId = String(params?.id || '');
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);

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
        <StudentInfoSection student={student} currentPage="explanations" />

        <div className="bg-card rounded-lg shadow-sm border border-default p-6">
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-title mb-2">설명 관리</h3>
            <p className="text-muted mb-6">학생을 위한 설명 영상과 답지를 관리하는 페이지입니다.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-700">
                이 기능은 현재 개발 중입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
