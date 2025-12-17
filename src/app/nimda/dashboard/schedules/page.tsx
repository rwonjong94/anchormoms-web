'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ScheduleEditor, { WeeklySchedule } from '@/components/admin/ScheduleEditor';

interface Student {
  id: string;
  name: string;
  grade: number;
  school?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  students: Student[];
}

export default function SchedulesManagementPage() {
  // Class and student selection
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  // Schedule state
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;
        const resp = await fetch('/api/nimda/classes', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setClasses(data || []);
          if (data.length > 0 && !selectedClassId) {
            setSelectedClassId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, []);

  // Auto-select first student when class changes
  useEffect(() => {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (selectedClass && selectedClass.students.length > 0) {
      setSelectedStudentId(selectedClass.students[0].id);
    } else {
      setSelectedStudentId('');
    }
  }, [selectedClassId, classes]);

  // Fetch schedule when student changes
  const fetchSchedule = async () => {
    if (!selectedStudentId) return;
    try {
      setScheduleLoading(true);
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${selectedStudentId}/schedule`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const text = await resp.text();
        try {
          const data = text ? JSON.parse(text) : {};
          setSchedule(data as WeeklySchedule);
        } catch {
          setSchedule({} as WeeklySchedule);
        }
      } else {
        setSchedule({} as WeeklySchedule);
      }
      setHasChanges(false);
      setSavedAt(null);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setSchedule({} as WeeklySchedule);
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      fetchSchedule();
    }
  }, [selectedStudentId]);

  const handleScheduleChange = (next: WeeklySchedule) => {
    setSchedule(next);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedStudentId || !schedule) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${selectedStudentId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(schedule),
      });
      if (resp.ok) {
        setSavedAt(Date.now());
        setHasChanges(false);
      } else {
        const txt = await resp.text().catch(() => '');
        alert(`저장 실패: ${txt?.slice(0, 200)}`);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate weekly stats
  const calculateStats = (sched: WeeklySchedule | null) => {
    if (!sched) return { totalHours: 0, subjects: [] as string[] };
    let totalMinutes = 0;
    const subjectSet = new Set<string>();

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
    for (const day of days) {
      const blocks = sched[day] || [];
      for (const block of blocks) {
        totalMinutes += (block.endMin - block.startMin);
        if (block.subject) subjectSet.add(block.subject);
      }
    }

    return {
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      subjects: Array.from(subjectSet),
    };
  };

  // Get students for selected class
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentsInClass = selectedClass?.students || [];
  const filteredStudents = studentsInClass.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const selectedStudent = studentsInClass.find(s => s.id === selectedStudentId);
  const stats = calculateStats(schedule);

  return (
    <AdminLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-title">스케줄 관리</h1>
          <p className="text-sm text-muted mt-1">학생별 주간 시간표를 관리합니다</p>
        </div>

        <div className="flex gap-6">
          {/* Left: Student Selector */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-card rounded-lg shadow-sm border border-default p-4 sticky top-4">
              {/* Class Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-title mb-2">반 선택</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-default rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} ({cls.students.length}명)</option>
                  ))}
                </select>
              </div>

              {/* Student Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="학생 검색..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-default rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Student List */}
              <div className="space-y-1 max-h-[calc(100vh-350px)] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-4 text-muted text-sm">학생이 없습니다</div>
                ) : (
                  filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => {
                        if (hasChanges && !confirm('저장하지 않은 변경사항이 있습니다. 다른 학생으로 이동하시겠습니까?')) {
                          return;
                        }
                        setSelectedStudentId(student.id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedStudentId === student.id
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-title'
                      }`}
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted">{student.grade}학년 · {student.school || '학교 미지정'}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Schedule Content */}
          <div className="flex-1 min-w-0">
            {!selectedStudentId ? (
              <div className="bg-card rounded-lg shadow-sm border border-default p-12 text-center">
                <div className="text-muted">학생을 선택하세요</div>
              </div>
            ) : scheduleLoading ? (
              <div className="bg-card rounded-lg shadow-sm border border-default p-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-sm border border-default p-6">
                {/* Student Info & Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-title">
                      {selectedStudent?.name}
                      <span className="text-sm font-normal text-muted ml-2">
                        {selectedStudent?.grade}학년 · {selectedStudent?.school || ''}
                      </span>
                    </h2>
                    {/* Weekly Stats */}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                      <span>주간 {stats.totalHours}시간</span>
                      {stats.subjects.length > 0 && (
                        <span>과목: {stats.subjects.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {savedAt && <span className="text-xs text-green-600">저장됨</span>}
                    {hasChanges && <span className="text-xs text-orange-500">변경됨</span>}
                    <button
                      className={`px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 ${saving ? 'opacity-60' : ''}`}
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                    >
                      {saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>

                {/* Usage Instructions */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-blue-700 dark:text-blue-300">
                  <strong>사용법:</strong> 빈 영역을 드래그하여 새 스케줄 추가 · 블록 더블클릭으로 수정 · 블록 드래그로 이동 · 상하 가장자리 드래그로 시간 조절
                </div>

                {/* Schedule Editor */}
                {schedule !== null && (
                  <ScheduleEditor
                    value={schedule}
                    onChange={handleScheduleChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
