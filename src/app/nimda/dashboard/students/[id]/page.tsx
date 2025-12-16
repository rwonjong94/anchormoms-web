'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import StudentInfoSection from '@/components/admin/StudentInfoSection';
import ScheduleEditor, { WeeklySchedule } from '@/components/admin/ScheduleEditor';
import RoadmapEditor from '@/components/admin/RoadmapEditor';
import { type Student, StudentSchema } from '@/dto';

export default function StudentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = String(params?.id || '');
  
  // 학생 정보 상태
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  // 시간표/로드맵 상태
  const [activeTab, setActiveTab] = useState<'schedule' | 'roadmap'>('schedule');
  const [scheduleText, setScheduleText] = useState<string>('{}');
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(true);
  const [scheduleSaving, setScheduleSaving] = useState<boolean>(false);
  const [roadmapText, setRoadmapText] = useState<string>('{}');
  const [roadmapLoading, setRoadmapLoading] = useState<boolean>(true);
  const [roadmapSaving, setRoadmapSaving] = useState<boolean>(false);

  // 쿼리 파라미터(tab)로 초기 탭 동기화
  useEffect(() => {
    const tab = (searchParams?.get('tab') || '').toLowerCase();
    if (tab === 'schedule' || tab === 'roadmap') {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
          // Validate response with Zod
          const validation = StudentSchema.safeParse(data);
          if (validation.success) {
            setStudent(validation.data);
          } else {
            console.error('[StudentDetailPage] Invalid student data:', validation.error);
            setStudent(data); // fallback to raw data
          }
        }
      } finally {
        setStudentLoading(false);
      }
    };
    if (studentId) fetchStudent();
  }, [studentId]);

  // 시간표/로드맵 가져오기
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setScheduleLoading(true);
        const token = localStorage.getItem('adminToken');
        const resp = await fetch(`/api/nimda/students/${studentId}/schedule`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const txt = await resp.text();
        if (resp.ok) {
          try {
            const json = txt ? JSON.parse(txt) : {};
            setScheduleText(JSON.stringify(json, null, 2));
          } catch {
            setScheduleText(txt || '{}');
          }
        } else {
          setScheduleText('{}');
        }
      } finally {
        setScheduleLoading(false);
      }
    };
    const fetchRoadmap = async () => {
      try {
        setRoadmapLoading(true);
        const token = localStorage.getItem('adminToken');
        const resp = await fetch(`/api/nimda/students/${studentId}/roadmap`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const txt = await resp.text();
        if (resp.ok) {
          try {
            const json = txt ? JSON.parse(txt) : {};
            setRoadmapText(JSON.stringify(json, null, 2));
          } catch {
            setRoadmapText(txt || '{}');
          }
        } else {
          setRoadmapText('{}');
        }
      } finally {
        setRoadmapLoading(false);
      }
    };
    if (studentId) {
      fetchSchedule();
      fetchRoadmap();
    }
  }, [studentId]);

  const handleSaveSchedule = async () => {
    try {
      setScheduleSaving(true);
      let payload: any;
      try {
        payload = scheduleText ? JSON.parse(scheduleText) : {};
      } catch {
        alert('시간표 JSON 형식이 올바르지 않습니다.');
        return;
      }
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${studentId}/schedule`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        alert(`시간표 저장 실패 (status ${resp.status})\n${txt?.slice(0, 500)}`);
        return;
      }
      const txt = await resp.text();
      try {
        const json = txt ? JSON.parse(txt) : {};
        setScheduleText(JSON.stringify(json, null, 2));
      } catch {
        // keep as-is
      }
      alert('시간표가 저장되었습니다.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleSaveRoadmap = async () => {
    try {
      setRoadmapSaving(true);
      let payload: any;
      try {
        payload = roadmapText ? JSON.parse(roadmapText) : {};
      } catch {
        alert('로드맵 JSON 형식이 올바르지 않습니다.');
        return;
      }
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${studentId}/roadmap`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        alert(`로드맵 저장 실패 (status ${resp.status})\n${txt?.slice(0, 500)}`);
        return;
      }
      const txt = await resp.text();
      try {
        const json = txt ? JSON.parse(txt) : {};
        setRoadmapText(JSON.stringify(json, null, 2));
      } catch {
        // keep as-is
      }
      alert('로드맵이 저장되었습니다.');
    } finally {
      setRoadmapSaving(false);
    }
  };

  if (studentLoading) {
    return <div className="animate-pulse h-40 bg-muted rounded" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 학생 정보 섹션 */}
      {student && (
        <StudentInfoSection student={student} currentPage={activeTab} />
      )}

      {/* 시간표/로드맵 편집 */}
      <div className="bg-card rounded-lg shadow p-6 mt-6">
        {/* 상단 탭 제거, 관리 메뉴에서만 전환 */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <h2 className="text-lg font-semibold text-title">{activeTab === 'schedule' ? '시간표' : '로드맵'}</h2>
          {activeTab === 'schedule' && (
            <button
              className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-60"
              onClick={handleSaveSchedule}
              disabled={scheduleSaving || scheduleLoading}
            >
              {scheduleSaving ? '저장 중...' : '시간표 저장'}
            </button>
          )}
        </div>

        {activeTab === 'schedule' && (
          <div>
            {scheduleLoading ? (
              <div className="animate-pulse h-[600px] bg-muted rounded" />
            ) : (
              <ScheduleEditor
                value={(() => {
                  try {
                    const obj = scheduleText ? JSON.parse(scheduleText) : {};
                    // 타입 보정은 컴포넌트 내부 ensureWeeklySchedule에서 수행
                    return obj as WeeklySchedule;
                  } catch {
                    return {} as WeeklySchedule;
                  }
                })()}
                onChange={(next) => {
                  setScheduleText(JSON.stringify(next, null, 2));
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div>
            {roadmapLoading ? (
              <div className="animate-pulse h-[400px] bg-muted rounded" />
            ) : (
              <>
                <RoadmapEditor
                  value={(() => {
                    try {
                      const obj = roadmapText ? JSON.parse(roadmapText) : {};
                      return obj as any;
                    } catch {
                      return { phases: [] } as any;
                    }
                  })()}
                  onChange={(next) => setRoadmapText(JSON.stringify(next, null, 2))}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-60"
                    onClick={handleSaveRoadmap}
                    disabled={roadmapSaving || roadmapLoading}
                  >
                    {roadmapSaving ? '저장 중...' : '로드맵 저장'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


