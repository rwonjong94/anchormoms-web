'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Student, ClassLecture, ClassLog } from '@/types/class';

const formatSchedule = (schedule: any) => {
  try {
    let scheduleData = schedule;
    if (typeof schedule === 'string') {
      scheduleData = JSON.parse(schedule);
    }
    
    if (Array.isArray(scheduleData) && scheduleData.length > 0) {
      return scheduleData
        .filter(s => s.day && s.start && s.end)
        .map(s => `${s.day} ${s.start}-${s.end}`)
        .join(', ');
    }
    
    return '시간 미설정';
  } catch (error) {
    return typeof schedule === 'string' ? schedule : '시간 미설정';
  }
};

export default function ClassLogPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([] as unknown as Student[]);
  const [classLogs, setClassLogs] = useState<ClassLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filterStudentId, setFilterStudentId] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // 학생 목록 조회 (드롭다운용)
      fetchStudents();
      fetchClassLogs();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // 필터 변경 시 다시 조회
    fetchClassLogs();
  }, [filterStudentId]);

  const fetchClassLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      
      // 로컬 필터가 설정된 경우에만 학생 기준 조회
      if (filterStudentId) {
        params.append('studentId', filterStudentId);
      }
      
      const response = await fetch(`/api/class-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClassLogs(Array.isArray(data) ? data : []);
      } else {
        setClassLogs([]);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to fetch class logs:', error);
      setClassLogs([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

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
        setStudents(data as unknown as Student[]);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  // API에서 이미 필터링되므로 별도 필터링 함수 불필요

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
    <div className="bg-card rounded-lg shadow-sm border border-default p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-title">수업 일지</h2>
        {students.length > 0 && (
          <select
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            className="px-3 py-2 border border-default rounded-md bg-card text-title"
          >
            <option value="">전체 학생</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({(s as any).grade}학년)
              </option>
            ))}
          </select>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-error rounded-lg p-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      ) : classLogs.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-title">수업 일지가 없습니다</h3>
          <p className="mt-2 text-muted">아직 등록된 수업 일지가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classLogs.map((log) => (
            <div key={log.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-default overflow-hidden">
              {/* 클릭 가능한 헤더 */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-title">{log.classLecture.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {formatSchedule(log.classLecture.schedule)}
                          </span>
                          <span className="text-sm text-muted">
                            {new Date(log.date).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 펼치기/접기 아이콘 */}
                  <svg 
                    className={`w-5 h-5 text-muted transition-transform ${
                      expandedLogId === log.id ? 'transform rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* 펼쳐지는 내용 */}
              {expandedLogId === log.id && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-600">
                  <div className="pt-4 space-y-4">
                    {/* 수업 내용 */}
                    <div className="rounded-md border border-default bg-card p-4">
                      <h4 className="text-sm font-semibold text-title mb-2">📚 수업 내용</h4>
                      <div className="text-sm text-body whitespace-pre-wrap leading-relaxed">
                        {log.content}
                      </div>
                    </div>
                    
                    {/* 과제 (있는 경우만 표시) */}
                    {log.homework && (
                      <div className="rounded-md border border-default bg-card p-4">
                        <h4 className="text-sm font-semibold text-title mb-2">📝 과제</h4>
                        <div className="text-sm text-body whitespace-pre-wrap leading-relaxed">
                          {log.homework}
                        </div>
                      </div>
                    )}
                    
                    {/* 안내 사항 (있는 경우만 표시) */}
                    {log.notice && (
                      <div className="rounded-md border border-default bg-card p-4">
                        <h4 className="text-sm font-semibold text-title mb-2">📌 안내 사항</h4>
                        <div className="text-sm text-body whitespace-pre-wrap leading-relaxed">
                          {log.notice}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
