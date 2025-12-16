'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  type Student,
  type Counseling,
  CreateCounselingDtoSchema,
  formatZodError,
} from '@/dto';

// CounselingLog 타입 (Counseling 확장)
interface CounselingLog extends Omit<Counseling, 'studentId'> {
  student: Student;
}

export default function CounselingsManagePage() {
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCounseling, setNewCounseling] = useState({
    studentId: '',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { requireAuth } = useAdminAuth();

  useEffect(() => {
    requireAuth();
  }, []); // requireAuth 초기 호출

  useEffect(() => {
    fetchCounselingLogs();
  }, [studentFilter, parentFilter, startDate, endDate]); // fetchCounselingLogs는 의존성에서 제거

  const fetchCounselingLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (studentFilter) params.append('studentName', studentFilter);
      if (parentFilter) params.append('parentName', parentFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/nimda/counselings?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCounselingLogs(data);
      } else {
        console.error('Failed to fetch counseling logs:', response.status);
        setCounselingLogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch counseling logs:', error);
      setCounselingLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 학생 검색 함수
  const searchStudents = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(`/api/nimda/students?search=${encodeURIComponent(searchTerm)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.students || []);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('학생 검색 오류:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // 학생 선택 함수
  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setNewCounseling({...newCounseling, studentId: student.id});
    setStudentSearch(student.name);
    setShowSearchResults(false);
  };

  const handleAddCounseling = async () => {
    try {
      const response = await fetch('/api/nimda/counselings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(newCounseling),
      });

      if (response.ok) {
        await fetchCounselingLogs();
        setShowAddModal(false);
        setNewCounseling({
          studentId: '',
          title: '',
          content: '',
          date: new Date().toISOString().split('T')[0]
        });
        setStudentSearch('');
        setSearchResults([]);
        setSelectedStudent(null);
        setShowSearchResults(false);
      } else {
        console.error('Failed to add counseling log');
      }
    } catch (error) {
      console.error('Failed to add counseling log:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 헤더 */}
          <div className="mb-8 flex justify-between items-start">
            <h1 className="sr-only">상담 관리</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>상담 기록 추가</span>
            </button>
          </div>

          {/* 필터 섹션 */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-default mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 학생 검색 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  학생 이름 검색
                </label>
                <input
                  type="text"
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  placeholder="학생 이름으로 검색"
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 부모 검색 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  부모 이름 검색
                </label>
                <input
                  type="text"
                  value={parentFilter}
                  onChange={(e) => setParentFilter(e.target.value)}
                  placeholder="부모 이름으로 검색"
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 시작 날짜 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  시작 날짜
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 종료 날짜 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  종료 날짜
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 필터 초기화 버튼 */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setStudentFilter('');
                  setParentFilter('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 text-sm text-body bg-muted rounded-md hover:bg-hover transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>

          {/* 상담 기록 목록 */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : counselingLogs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-default">
              <h3 className="text-lg font-medium text-title mb-2">상담 기록이 없습니다</h3>
              <p className="text-body">
                {studentFilter || parentFilter || startDate || endDate 
                  ? '해당 조건에 맞는 상담 기록이 없습니다.'
                  : '아직 등록된 상담 기록이 없습니다.'
                }
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-sm border border-default">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-default">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        학생 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        상담 제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        내용 미리보기
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        상담 날짜
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        작성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-default">
                    {counselingLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-title">
                              {log.student.name} ({log.student.grade}학년)
                            </div>
                            <div className="text-sm text-muted">
                              부모: {log.student.user?.name || '미등록'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-title">
                            {log.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-body max-w-xs">
                            {truncateContent(log.content.replace(/[#*_`]/g, ''))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-body">
                          {new Date(log.date).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-body">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => window.open(`/nimda/dashboard/students/${log.student.id}/counselings`, '_blank')}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            상세 보기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 새 상담 기록 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-title">상담 기록 추가</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setStudentSearch('');
                  setSearchResults([]);
                  setSelectedStudent(null);
                  setShowSearchResults(false);
                  setNewCounseling({
                    studentId: '',
                    title: '',
                    content: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
                className="text-muted hover:text-body"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 학생 검색 및 선택 */}
              <div className="relative">
                <label className="block text-sm font-medium text-body mb-2">
                  학생 검색 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    searchStudents(e.target.value);
                  }}
                  placeholder="학생 이름을 입력하세요"
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />

                {/* 검색 결과 드롭다운 */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => selectStudent(student)}
                        className="px-3 py-2 hover:bg-hover cursor-pointer border-b border-default last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-title">{student.name}</div>
                            <div className="text-sm text-muted">
                              {student.grade}학년 {student.school && `• ${student.school}`}
                            </div>
                          </div>
                          <div className="text-xs text-muted">
                            {student.user?.name && `부모: ${student.user.name}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 선택된 학생 정보 표시 */}
                {selectedStudent && (
                  <div className="mt-2 p-3 bg-muted rounded-md border border-input">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-title">{selectedStudent.name}</div>
                        <div className="text-sm text-body">
                          {selectedStudent.grade}학년 {selectedStudent.school && `• ${selectedStudent.school}`}
                        </div>
                        {selectedStudent.user && (
                          <div className="text-sm text-muted">
                            부모: {selectedStudent.user.name} ({selectedStudent.user.email})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedStudent(null);
                          setStudentSearch('');
                          setNewCounseling({...newCounseling, studentId: ''});
                        }}
                        className="text-muted hover:text-body"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 상담 제목 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  상담 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCounseling.title}
                  onChange={(e) => setNewCounseling({...newCounseling, title: e.target.value})}
                  placeholder="상담 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* 상담 날짜 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  상담 날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newCounseling.date}
                  onChange={(e) => setNewCounseling({...newCounseling, date: e.target.value})}
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* 상담 내용 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  상담 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newCounseling.content}
                  onChange={(e) => setNewCounseling({...newCounseling, content: e.target.value})}
                  placeholder="상담 내용을 입력하세요 (마크다운 지원)"
                  rows={8}
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  required
                />
                <p className="text-xs text-muted mt-1">
                  마크다운 문법을 사용할 수 있습니다. (# 제목, **굵게**, - 목록 등)
                </p>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setStudentSearch('');
                  setSearchResults([]);
                  setSelectedStudent(null);
                  setShowSearchResults(false);
                  setNewCounseling({
                    studentId: '',
                    title: '',
                    content: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
                className="px-4 py-2 border border-input text-body hover:bg-hover rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddCounseling}
                disabled={!selectedStudent || !newCounseling.title || !newCounseling.content}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
