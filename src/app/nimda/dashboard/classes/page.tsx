'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  type Student,
  type ClassLog,
  CreateClassDtoSchema,
  CreateClassLogDtoSchema,
  formatZodError,
} from '@/dto';

// 로컬 타입 (기존 types/class.ts 대체)
type TabType = '수업 관리' | '수업 일지';

interface ClassLecture {
  id: string;
  name: string;
  description: string;
  subject: string;
  grade: number;
  schedule: any;
  students: Array<{ id: string; name: string; grade: number; school?: string }>;
  createdAt: string;
  updatedAt: string;
}

type ScheduleEntry = { day: string; start: string; end: string };
type NewClassForm = {
  name: string;
  description: string;
  subject?: string;
  grade?: number;
  schedule: ScheduleEntry[];
  studentIds: string[];
};

export default function ClassesManagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('수업 관리');
  const [classes, setClasses] = useState<ClassLecture[]>([]);
  const [classLogs, setClassLogs] = useState<ClassLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassLecture | null>(null);
  const [editingLog, setEditingLog] = useState<ClassLog | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [apiAvailable, setApiAvailable] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  // 학생 검색 및 빠른 추가
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showQuickAddStudent, setShowQuickAddStudent] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: '', grade: 1, school: '' });
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [newClass, setNewClass] = useState<NewClassForm>({
    name: '',
    description: '',
    subject: '',
    grade: 1,
    schedule: [{ day: '월', start: '', end: '' }],
    studentIds: []
  });
  const [newLog, setNewLog] = useState({
    classLectureId: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    homework: '',
    notice: ''
  });
  
  const { requireAuth } = useAdminAuth();

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  useEffect(() => {
    fetchClasses();
    fetchAllStudents();
    if (activeTab === '수업 일지') {
      fetchClassLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === '수업 일지') {
      fetchClassLogs();
    }
  }, [activeTab, selectedClassFilter]);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClasses(Array.isArray(data) ? data : []);
        setApiAvailable(true);
      } else {
        // 501 또는 기타 실패는 기능 미구현/오류로 간주하고 빈 상태로 표시
        setClasses([]);
        setApiAvailable(false);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([]);
      setApiAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllStudents = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setAllStudents([]);
        return;
      }

      const params = new URLSearchParams({ page: '1', limit: '1000' });
      const response = await fetch(`/api/nimda/students?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch students:', response.status);
        setAllStudents([]);
        return;
      }

      const data = await response.json();
      // 백엔드 응답은 { students, total, page, ... } 형태
      const students: Student[] = Array.isArray(data?.students)
        ? data.students.map((s: { id: number; name: string; grade: string; school?: string; user: any }) => ({
            id: s.id,
            name: s.name,
            grade: s.grade,
            school: s.school ?? undefined,
            user: s.user
              ? { id: s.user.id, name: s.user.name, email: s.user.email }
              : undefined,
          }))
        : [];
      setAllStudents(students);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setAllStudents([]);
    }
  };

  const fetchClassLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (selectedClassFilter) params.append('classLectureId', selectedClassFilter);

      const response = await fetch(`/api/class-logs/admin?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch class logs:', response.status);
        setClassLogs([]);
      } else {
        const data = await response.json();
        setClassLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch class logs:', error);
      setClassLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [selectedClassFilter]);

  const handleAddClass = async () => {
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(newClass),
      });

      if (response.ok) {
        await fetchClasses();
        setShowAddModal(false);
        resetForm();
        alert('수업이 성공적으로 추가되었습니다.');
      } else {
        setApiAvailable(false);
        alert('수업 관리 기능이 아직 준비 중이거나 일시적으로 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to add class:', error);
      setApiAvailable(false);
      alert('수업 관리 기능이 아직 준비 중이거나 일시적으로 사용할 수 없습니다.');
    }
  };

  const handleEditClass = (classLecture: ClassLecture) => {
    setEditingClass(classLecture);
    let scheduleEntries: ScheduleEntry[] = [{ day: '월', start: '', end: '' }];
    try {
      const parsed = JSON.parse(classLecture.schedule as unknown as string);
      if (Array.isArray(parsed)) {
        scheduleEntries = parsed as ScheduleEntry[];
      }
    } catch {}
    setNewClass({
      name: classLecture.name,
      description: classLecture.description,
      subject: classLecture.subject,
      grade: classLecture.grade,
      schedule: scheduleEntries,
      studentIds: classLecture.students.map(s => s.id)
    });
    setShowAddModal(true);
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;
    
    try {
      const response = await fetch(`/api/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(newClass),
      });

      if (response.ok) {
        await fetchClasses();
        setShowAddModal(false);
        setEditingClass(null);
        resetForm();
        alert('수업이 성공적으로 수정되었습니다.');
      } else {
        setApiAvailable(false);
        alert('수업 관리 기능이 아직 준비 중이거나 일시적으로 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to update class:', error);
      setApiAvailable(false);
      alert('수업 관리 기능이 아직 준비 중이거나 일시적으로 사용할 수 없습니다.');
    }
  };

  const resetForm = () => {
    setNewClass({
      name: '',
      description: '',
      subject: '',
      grade: 1,
      schedule: [{ day: '월', start: '', end: '' }],
      studentIds: []
    });
    setEditingClass(null);
    // 학생 검색 및 빠른 추가 상태 초기화
    setStudentSearchTerm('');
    setShowQuickAddStudent(false);
    setQuickAddForm({ name: '', grade: 1, school: '' });
  };

  const addScheduleEntry = () => {
    setNewClass(prev => ({
      ...prev,
      schedule: [...prev.schedule, { day: '월', start: '', end: '' }],
    }));
  };

  const updateScheduleEntry = (index: number, key: keyof ScheduleEntry, value: string) => {
    setNewClass(prev => {
      const next = [...prev.schedule];
      next[index] = { ...next[index], [key]: value } as ScheduleEntry;
      return { ...prev, schedule: next };
    });
  };

  const removeScheduleEntry = (index: number) => {
    setNewClass(prev => {
      const next = prev.schedule.filter((_, i) => i !== index);
      return { ...prev, schedule: next.length > 0 ? next : [{ day: '월', start: '', end: '' }] };
    });
  };

  const handleAddLog = async () => {
    try {
      const response = await fetch('/api/class-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(newLog),
      });

      if (response.ok) {
        await fetchClassLogs();
        setShowLogModal(false);
        resetLogForm();
      } else {
        console.error('Failed to add class log');
      }
    } catch (error) {
      console.error('Failed to add class log:', error);
    }
  };

  const handleEditLog = (log: ClassLog) => {
    setEditingLog(log);
    setNewLog({
      classLectureId: log.classLecture.id,
      date: log.date,
      content: log.content,
      homework: log.homework || '',
      notice: log.notice || ''
    });
    setShowLogModal(true);
  };

  const handleUpdateLog = async () => {
    if (!editingLog) return;
    
    try {
      const response = await fetch(`/api/class-logs/${editingLog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(newLog),
      });

      if (response.ok) {
        await fetchClassLogs();
        setShowLogModal(false);
        setEditingLog(null);
        resetLogForm();
      } else {
        console.error('Failed to update class log');
      }
    } catch (error) {
      console.error('Failed to update class log:', error);
    }
  };

  const handleDeleteLog = async (logId: string, logTitle: string) => {
    if (!confirm(`"${logTitle}" 수업 일지를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/class-logs/${logId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        await fetchClassLogs();
        alert('수업 일지가 성공적으로 삭제되었습니다.');
      } else {
        alert('수업 일지 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete class log:', error);
      alert('수업 일지 삭제 중 오류가 발생했습니다.');
    }
  };

  const resetLogForm = () => {
    setNewLog({
      classLectureId: '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      homework: '',
      notice: ''
    });
    setEditingLog(null);
  };

  const handleStudentToggle = (studentId: string) => {
    setNewClass(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId]
    }));
  };

  // 학생 검색 필터링
  const filteredStudents = allStudents.filter(student => {
    const term = studentSearchTerm.toLowerCase();
    return student.name.toLowerCase().includes(term) ||
           student.school?.toLowerCase().includes(term) ||
           student.user?.name?.toLowerCase().includes(term);
  });

  // 학생 빠른 추가
  const handleQuickAddStudent = async () => {
    if (!quickAddForm.name.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }
    setQuickAddLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/nimda/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: quickAddForm.name,
          grade: quickAddForm.grade,
          school: quickAddForm.school || '',
        }),
      });
      if (response.ok) {
        const newStudent = await response.json();
        // 학생 목록에 추가하고 자동 선택
        setAllStudents(prev => [newStudent, ...prev]);
        setNewClass(prev => ({
          ...prev,
          studentIds: [...prev.studentIds, newStudent.id]
        }));
        // 폼 초기화
        setQuickAddForm({ name: '', grade: 1, school: '' });
        setShowQuickAddStudent(false);
      } else {
        const error = await response.json();
        alert(error.message || '학생 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('학생 빠른 추가 오류:', error);
      alert('학생 추가 중 오류가 발생했습니다.');
    } finally {
      setQuickAddLoading(false);
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

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`"${className}" 수업을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        await fetchClasses();
        alert('수업이 성공적으로 삭제되었습니다.');
      } else {
        setApiAvailable(false);
        alert('수업 관리 기능이 아직 준비 중이거나 일시적으로 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to delete class:', error);
      setApiAvailable(false);
      alert('수업 관리 기능이 아직 준비 중이거나 일시적으로 사용할 수 없습니다.');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 헤더 */}
          <div className="mb-8 flex justify-between items-start">
            <h1 className="sr-only">수업 관리</h1>
            <button
              onClick={() => {
                if (activeTab === '수업 관리') {
                  setShowAddModal(true);
                } else {
                  setShowLogModal(true);
                }
              }}
              className={"bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {activeTab === '수업 관리' ? '수업 추가' : '수업 일지 추가'}
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-6">
            <div className="border-b border-default">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('수업 관리')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === '수업 관리'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-muted hover:text-body hover:border-default'
                  }`}
                >
                  수업 목록
                </button>
                <button
                  onClick={() => setActiveTab('수업 일지')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === '수업 일지'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-muted hover:text-body hover:border-default'
                  }`}
                >
                  수업 일지
                </button>
              </nav>
            </div>
          </div>

          {/* 탭별 콘텐츠 */}
          {activeTab === '수업 관리' ? (
            // 수업 관리 탭
            loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : !apiAvailable ? (
              <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-default">
                <h3 className="text-lg font-medium text-title mb-2">수업 관리 기능이 준비 중입니다</h3>
                <p className="text-body">추후 백엔드 연동 완료 후 이용하실 수 있습니다.</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-default">
                <svg className="w-24 h-24 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-title mb-2">수업이 없습니다</h3>
                <p className="text-body mb-4">첫 번째 수업을 추가해보세요.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  수업 추가
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classLecture) => (
                  <div key={classLecture.id} className="bg-card rounded-lg shadow-sm border border-default p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-title mb-2">{classLecture.name}</h3>
                        <p className="text-sm text-body mb-2">{classLecture.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            {formatSchedule(classLecture.schedule)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 학생 목록 - 전체 2열 그리드로 표시 */}
                    <div className="mb-4">
                      {classLecture.students.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {classLecture.students.map((student) => (
                            <div key={student.id} className="text-xs text-muted">
                              {student.name} ({student.grade}학년{student.school ? `, ${student.school}` : ''})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted">등록된 학생이 없습니다.</div>
                      )}
                    </div>

                    {/* 하단 고정 영역: 액션 + 생성일 */}
                    <div className="mt-auto">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClass(classLecture)}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteClass(classLecture.id, classLecture.name)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="mt-3 pt-3 border-t border-default text-xs text-muted">
                        생성일: {formatDate(classLecture.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // 수업 일지 탭
            <div>
              {/* 필터 섹션 */}
              <div className="bg-card p-6 rounded-lg shadow-sm border border-default mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-body mb-2">
                      수업 선택
                    </label>
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">전체 수업</option>
                      {classes.map((classLecture) => (
                        <option key={classLecture.id} value={classLecture.id}>
                          {classLecture.name} ({classLecture.subject}, {classLecture.grade}학년)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 수업 일지 목록 */}
              {logsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : classLogs.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-default">
                  <svg className="w-24 h-24 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-title mb-2">수업 일지가 없습니다</h3>
                  <p className="text-body mb-4">
                    {selectedClassFilter ? '선택한 수업의 일지가 없습니다.' : '첫 번째 수업 일지를 추가해보세요.'}
                  </p>
                  <button
                    onClick={() => setShowLogModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    수업 일지 추가
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {classLogs.map((log) => (
                    <div key={log.id} className="bg-card rounded-lg shadow-sm border border-default overflow-hidden">
                      {/* 클릭 가능한 헤더 */}
                      <div 
                        className="p-6 cursor-pointer hover:bg-hover transition-colors"
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <h3 className="text-lg font-semibold text-title">{log.classLecture.name}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                    {formatSchedule(log.classLecture.schedule)}
                                  </span>
                                  <span className="text-sm text-muted">
                                    수업일: {new Date(log.date).toLocaleDateString('ko-KR', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  <span className="text-xs text-muted">
                                    수강생: {log.classLecture.students.length}명
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {/* 관리 버튼들 */}
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleEditLog(log)}
                                className="px-3 py-1 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteLog(log.id, log.title || '수업 일지')}
                                className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-md transition-colors"
                              >
                                삭제
                              </button>
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
                      </div>
                      
                      {/* 펼쳐지는 내용 */}
                      {expandedLogId === log.id && (
                        <div className="px-6 pb-6 border-t border-default">
                          <div className="pt-4 space-y-4">
                            {/* 수업 내용 */}
                            <div>
                              <h4 className="text-sm font-medium text-title mb-2">📚 수업 내용</h4>
                              <div className="text-sm text-body whitespace-pre-wrap leading-relaxed bg-hover p-3 rounded-md">
                                {log.content}
                              </div>
                            </div>
                            
                            {/* 과제 (있는 경우만 표시) */}
                            {log.homework && (
                              <div>
                                <h4 className="text-sm font-medium text-title mb-2">📝 과제</h4>
                                <div className="text-sm text-body whitespace-pre-wrap leading-relaxed bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                                  {log.homework}
                                </div>
                              </div>
                            )}
                            
                            {/* 안내 사항 (있는 경우만 표시) */}
                            {log.notice && (
                              <div>
                                <h4 className="text-sm font-medium text-title mb-2">📌 안내 사항</h4>
                                <div className="text-sm text-body whitespace-pre-wrap leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                                  {log.notice}
                                </div>
                              </div>
                            )}
                            
                            {/* 작성일 */}
                            <div className="pt-2 text-xs text-muted text-right">
                              작성일: {formatDate(log.createdAt)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 수업 추가/수정 모달 - 완전한 버전 */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-title">
                    {editingClass ? '수업 수정' : '수업 추가'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="text-muted hover:text-body"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 수업명 */}
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      수업명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newClass.name}
                      onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                      placeholder="수업명을 입력하세요"
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  {/* 설명 */}
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">설명</label>
                    <textarea
                      value={newClass.description}
                      onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                      placeholder="수업 설명을 입력하세요"
                      rows={3}
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    />
                  </div>

                  {/* 수업 시간: 요일 + 시작/종료, 다중 추가 */}
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      수업 시간 <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {newClass.schedule.map((sch, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-3">
                            <label className="block text-xs text-muted mb-1">요일</label>
                            <select
                              value={sch.day}
                              onChange={(e) => updateScheduleEntry(idx, 'day', e.target.value)}
                              className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {['월','화','수','목','금','토','일'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-4">
                            <label className="block text-xs text-muted mb-1">시작</label>
                            <input
                              type="time"
                              value={sch.start}
                              onChange={(e) => updateScheduleEntry(idx, 'start', e.target.value)}
                              className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <label className="block text-xs text-muted mb-1">종료</label>
                            <input
                              type="time"
                              value={sch.end}
                              onChange={(e) => updateScheduleEntry(idx, 'end', e.target.value)}
                              className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="sm:col-span-1 flex gap-2">
                            {newClass.schedule.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeScheduleEntry(idx)}
                                className="px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="이 시간대 삭제"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            ) : (
                              <div className="px-3 py-2 text-muted text-sm">
                                최소 1개
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div>
                        <button
                          type="button"
                          onClick={addScheduleEntry}
                          className="px-3 py-2 border border-input text-body hover:bg-hover rounded-md"
                        >
                          + 시간 추가
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 수강 학생 선택 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-body">수강 학생 선택</label>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddStudent(!showQuickAddStudent)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        {showQuickAddStudent ? '취소' : '+ 학생 빠른 추가'}
                      </button>
                    </div>

                    {/* 학생 빠른 추가 폼 */}
                    {showQuickAddStudent && (
                      <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-200 dark:border-indigo-800">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="학생명 *"
                            value={quickAddForm.name}
                            onChange={(e) => setQuickAddForm(prev => ({ ...prev, name: e.target.value }))}
                            className="px-2 py-1 text-sm border border-input rounded bg-card text-title"
                          />
                          <select
                            value={quickAddForm.grade}
                            onChange={(e) => setQuickAddForm(prev => ({ ...prev, grade: Number(e.target.value) }))}
                            className="px-2 py-1 text-sm border border-input rounded bg-card text-title"
                          >
                            {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>{g}학년</option>)}
                          </select>
                          <input
                            type="text"
                            placeholder="학교"
                            value={quickAddForm.school}
                            onChange={(e) => setQuickAddForm(prev => ({ ...prev, school: e.target.value }))}
                            className="px-2 py-1 text-sm border border-input rounded bg-card text-title"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleQuickAddStudent}
                          disabled={quickAddLoading || !quickAddForm.name.trim()}
                          className="w-full px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                          {quickAddLoading ? '추가 중...' : '추가 후 선택'}
                        </button>
                      </div>
                    )}

                    {/* 학생 검색 */}
                    <input
                      type="text"
                      placeholder="학생 이름, 학교, 부모명으로 검색..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 mb-2 border border-input rounded-md bg-card text-title text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <div className="max-h-40 overflow-y-auto border border-input rounded-md p-3 bg-card">
                      {filteredStudents.length === 0 ? (
                        <div className="text-center text-muted py-4">
                          {studentSearchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredStudents.map((student) => (
                            <label key={student.id} className="flex items-center space-x-3 p-2 hover:bg-hover rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newClass.studentIds.includes(student.id)}
                                onChange={() => handleStudentToggle(student.id)}
                                className="form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-input rounded"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-title">
                                  {student.name} ({student.grade}학년)
                                </div>
                                <div className="text-xs text-muted">
                                  {student.school} | 부모: {student.user?.name || '미등록'}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-body mt-2">
                      선택된 학생: {newClass.studentIds.length}명
                      {studentSearchTerm && ` (검색 결과: ${filteredStudents.length}명)`}
                    </div>
                  </div>
                </div>

                {/* 버튼 영역 */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-input text-body hover:bg-hover rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={editingClass ? handleUpdateClass : handleAddClass}
                    disabled={
                      !newClass.name ||
                      newClass.schedule.length === 0 ||
                      newClass.schedule.some(s => !s.start || !s.end)
                    }
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {editingClass ? '수정' : '추가'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 수업 일지 추가/수정 모달 - 간단한 버전 */}
          {showLogModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-title">
                    {editingLog ? '수업 일지 수정' : '수업 일지 추가'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowLogModal(false);
                      resetLogForm();
                    }}
                    className="text-muted hover:text-body"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      수업 선택 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newLog.classLectureId}
                      onChange={(e) => setNewLog({...newLog, classLectureId: e.target.value})}
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">수업 선택</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      수업 날짜 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newLog.date}
                      onChange={(e) => setNewLog({...newLog, date: e.target.value})}
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      수업 내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newLog.content}
                      onChange={(e) => setNewLog({...newLog, content: e.target.value})}
                      rows={4}
                      placeholder="오늘 수업에서 다룬 내용을 입력하세요"
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">과제</label>
                    <textarea
                      value={newLog.homework}
                      onChange={(e) => setNewLog({...newLog, homework: e.target.value})}
                      rows={3}
                      placeholder="학생들에게 주어진 과제가 있다면 입력하세요"
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">안내 사항</label>
                    <textarea
                      value={newLog.notice}
                      onChange={(e) => setNewLog({...newLog, notice: e.target.value})}
                      rows={3}
                      placeholder="학부모님께 전달할 안내 사항이 있다면 입력하세요"
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowLogModal(false);
                      resetLogForm();
                    }}
                    className="px-4 py-2 border border-input text-body hover:bg-hover rounded-lg"
                  >
                    취소
                  </button>
                  <button
                    onClick={editingLog ? handleUpdateLog : handleAddLog}
                    disabled={
                      !newLog.classLectureId || 
                      !newLog.date || 
                      !newLog.content
                    }
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {editingLog ? '수정' : '추가'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}