'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ScheduleEditor, { WeeklySchedule } from '@/components/admin/ScheduleEditor';
import RoadmapGrid from '@/components/admin/RoadmapGrid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Types
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
  };
}

interface Score {
  id: string;
  studentId: string;
  examId: string;
  score: number;
  maxScore: number;
  createdAt: string;
  exam?: {
    id: string;
    title: string;
    type: string;
    examnum: number;
    grade: number;
  };
}

interface CounselingLog {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
}

interface ExamAttempt {
  id: string;
  examId: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  score?: number;
  totalQuestions: number;
  correctAnswers: number;
  exam: {
    id: string;
    examnum: number;
    grade: number;
    type: string;
    duration: number;
  };
}

type TabKey = 'overview' | 'schedule' | 'roadmap' | 'scores' | 'counselings' | 'exams';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: '개요', icon: '📋' },
  { key: 'schedule', label: '시간표', icon: '🗓️' },
  { key: 'roadmap', label: '로드맵', icon: '🗺️' },
  { key: 'scores', label: '성적', icon: '📈' },
  { key: 'counselings', label: '상담', icon: '💬' },
  { key: 'exams', label: '시험기록', icon: '📊' },
];

const SUBJECT_CYCLE = [
  '초3-1','초3-2','초4-1','초4-2','초5-1','초5-2','초6-1','초6-2',
  '중1-1','중1-2','중2-1','중2-2','중3-1','중3-2','고등'
] as const;

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = String(params?.id || '');

  // Active tab
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Student info
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);

  // Schedule state
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleHasChanges, setScheduleHasChanges] = useState(false);

  // Roadmap state
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapSaving, setRoadmapSaving] = useState(false);
  const [years, setYears] = useState(3);
  const [startAcademicYear, setStartAcademicYear] = useState(new Date().getFullYear());
  const [startGrade, setStartGrade] = useState(3);
  const [thinkingTypeSelection, setThinkingTypeSelection] = useState<Record<string, 'WMO' | 'GT' | 'GTA'>>({});
  const [thinkingLevelSelection, setThinkingLevelSelection] = useState<Record<string, number>>({});
  const [subjectSelection, setSubjectSelection] = useState<Record<string, string>>({});
  const [visibleRows, setVisibleRows] = useState({ subject: true, thinking: true, gifted: true, contest: true, arithmetic: true });

  // Scores state
  const [scores, setScores] = useState<Score[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);

  // Counselings state
  const [counselings, setCounselings] = useState<CounselingLog[]>([]);
  const [counselingsLoading, setCounselingsLoading] = useState(false);
  const [selectedCounseling, setSelectedCounseling] = useState<CounselingLog | null>(null);
  const [counselingModal, setCounselingModal] = useState<{ open: boolean; editing: CounselingLog | null }>({ open: false, editing: null });
  const [counselingForm, setCounselingForm] = useState({ title: '', content: '', date: new Date().toISOString().slice(0, 10) });

  // Exams state
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams?.get('tab') as TabKey;
    if (tab && TABS.some(t => t.key === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    router.push(`/nimda/dashboard/students/${studentId}?tab=${tab}`, { scroll: false });
  };

  // Fetch student info
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/nimda');
          return;
        }
        const resp = await fetch(`/api/nimda/students/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setStudent(data);
          setStartGrade(data.grade);
        }
      } finally {
        setStudentLoading(false);
      }
    };
    if (studentId) fetchStudent();
  }, [studentId]);

  // Fetch schedule
  const fetchSchedule = async () => {
    if (scheduleLoading) return;
    setScheduleLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${studentId}/schedule`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const text = await resp.text();
        const data = text ? JSON.parse(text) : {};
        setSchedule(data);
        setScheduleHasChanges(false);
      }
    } catch (e) {
      setSchedule({} as WeeklySchedule);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Fetch roadmap
  const fetchRoadmap = async (yrs = years) => {
    if (roadmapLoading) return;
    setRoadmapLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${studentId}/roadmap?years=${yrs}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setRoadmap(data);
        setYears(yrs);
        setStartAcademicYear(Number(data?.base?.startAcademicYear ?? new Date().getFullYear()));
        setStartGrade(Number(data?.base?.startGrade ?? student?.grade ?? 3));

        // Initialize selections
        const extras = data?.extras || {};
        const typeMap: Record<string, 'WMO' | 'GT' | 'GTA'> = {};
        for (const it of (extras.thinkingTypes || [])) {
          typeMap[`${it.yearOffset}-${it.groupIndex}`] = it.type?.toUpperCase() as any || 'WMO';
        }
        setThinkingTypeSelection(typeMap);

        const levelMap: Record<string, number> = {};
        for (const it of (extras.thinkingLevels || [])) {
          if (it.level >= 1 && it.level <= 20) levelMap[`${it.yearOffset}-${it.groupIndex}`] = it.level;
        }
        setThinkingLevelSelection(levelMap);

        const subjMap: Record<string, string> = {};
        for (const it of (extras.subjectGroups || [])) {
          if (it.value) subjMap[`${it.yearOffset}-${it.groupIndex}`] = it.value;
        }
        setSubjectSelection(subjMap);
      }
    } finally {
      setRoadmapLoading(false);
    }
  };

  // Fetch scores
  const fetchScores = async () => {
    if (scoresLoading) return;
    setScoresLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${studentId}/scores`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setScores(Array.isArray(data) ? data : []);
      }
    } finally {
      setScoresLoading(false);
    }
  };

  // Fetch counselings
  const fetchCounselings = async () => {
    if (counselingsLoading) return;
    setCounselingsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${studentId}/counselings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setCounselings(Array.isArray(data) ? data : []);
      }
    } finally {
      setCounselingsLoading(false);
    }
  };

  // Fetch exam attempts
  const fetchExamAttempts = async () => {
    if (examsLoading) return;
    setExamsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/exams/attempts/student/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setExamAttempts(Array.isArray(data) ? data : []);
      }
    } finally {
      setExamsLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (!studentId) return;
    if (activeTab === 'schedule' && !schedule) fetchSchedule();
    if (activeTab === 'roadmap' && !roadmap) fetchRoadmap();
    if (activeTab === 'scores' && scores.length === 0) fetchScores();
    if (activeTab === 'counselings' && counselings.length === 0) fetchCounselings();
    if (activeTab === 'exams' && examAttempts.length === 0) fetchExamAttempts();
    if (activeTab === 'overview') {
      // Load all for overview stats
      if (scores.length === 0) fetchScores();
      if (counselings.length === 0) fetchCounselings();
      if (examAttempts.length === 0) fetchExamAttempts();
    }
  }, [activeTab, studentId]);

  // Save schedule
  const handleSaveSchedule = async () => {
    if (!schedule) return;
    setScheduleSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${studentId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(schedule),
      });
      if (resp.ok) {
        setScheduleHasChanges(false);
      }
    } finally {
      setScheduleSaving(false);
    }
  };

  // Save roadmap
  const handleSaveRoadmap = async () => {
    setRoadmapSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const prevExtras = roadmap?.extras || {};
      const resp = await fetch(`/api/nimda/students/${studentId}/roadmap`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          base: { startAcademicYear, startGrade, gradePromotionMonth: 3 },
          extras: {
            ...(prevExtras.gifted ? { gifted: prevExtras.gifted } : {}),
            ...(prevExtras.contests ? { contests: prevExtras.contests } : {}),
            thinkingTypes: Object.entries(thinkingTypeSelection).map(([k, t]) => {
              const [yo, gi] = k.split('-').map(Number);
              return { yearOffset: yo, groupIndex: gi, type: t };
            }),
            thinkingLevels: Object.entries(thinkingLevelSelection).map(([k, l]) => {
              const [yo, gi] = k.split('-').map(Number);
              return { yearOffset: yo, groupIndex: gi, level: l };
            }),
            subjectGroups: Object.entries(subjectSelection).map(([k, v]) => {
              const [yo, gi] = k.split('-').map(Number);
              return { yearOffset: yo, groupIndex: gi, value: v };
            }),
          },
        }),
      });
      if (resp.ok) {
        await fetchRoadmap(years);
      }
    } finally {
      setRoadmapSaving(false);
    }
  };

  // Save counseling
  const handleSaveCounseling = async () => {
    const token = localStorage.getItem('adminToken');
    const body = { title: counselingForm.title, content: counselingForm.content, date: counselingForm.date };
    let resp;
    if (counselingModal.editing) {
      resp = await fetch(`/api/nimda/students/${studentId}/counselings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ counselingId: counselingModal.editing.id, ...body }),
      });
    } else {
      resp = await fetch(`/api/nimda/students/${studentId}/counselings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId, ...body }),
      });
    }
    if (resp.ok) {
      await fetchCounselings();
      setCounselingModal({ open: false, editing: null });
    }
  };

  // Calculate overview stats
  const stats = useMemo(() => {
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0) / scores.length)
      : null;
    const totalExams = examAttempts.length;
    const completedExams = examAttempts.filter(a => a.status === 'COMPLETED').length;
    const totalCounselings = counselings.length;

    // Weekly hours from schedule
    let weeklyMinutes = 0;
    if (schedule) {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
      for (const day of days) {
        for (const block of (schedule[day] || [])) {
          weeklyMinutes += (block.endMin - block.startMin);
        }
      }
    }

    return { avgScore, totalExams, completedExams, totalCounselings, weeklyHours: Math.round(weeklyMinutes / 60 * 10) / 10 };
  }, [scores, examAttempts, counselings, schedule]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities: { type: string; date: string; text: string }[] = [];

    for (const s of scores.slice(0, 5)) {
      activities.push({
        type: 'score',
        date: s.createdAt,
        text: `${s.exam?.title || '시험'} - ${s.score}/${s.maxScore}점`
      });
    }
    for (const c of counselings.slice(0, 5)) {
      activities.push({
        type: 'counseling',
        date: c.createdAt,
        text: `상담: ${c.title}`
      });
    }
    for (const e of examAttempts.filter(a => a.status === 'COMPLETED').slice(0, 5)) {
      activities.push({
        type: 'exam',
        date: e.completedAt || e.startedAt,
        text: `${e.exam.type} ${e.exam.examnum}번 완료 - ${e.score}점`
      });
    }

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [scores, counselings, examAttempts]);

  if (studentLoading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-title mb-2">학생을 찾을 수 없습니다</h2>
          <button onClick={() => router.push('/nimda/dashboard/students')} className="text-indigo-600 hover:underline">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/nimda/dashboard/students')}
            className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
          >
            <span>←</span> 목록으로 돌아가기
          </button>
        </div>

        {/* Student Info Header */}
        <div className="bg-card rounded-lg shadow-sm border border-default p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                👨‍🎓
              </div>
              <div>
                <h1 className="text-xl font-bold text-title">{student.name}</h1>
                <div className="text-sm text-muted">
                  {student.grade}학년 · {student.school || '학교 미지정'}
                  {student.phone && ` · ${student.phone}`}
                </div>
              </div>
            </div>
            {student.user && (
              <div className="text-sm text-muted lg:text-right">
                <div>학부모: {student.user.name}</div>
                <div>{student.user.email}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg shadow-sm border border-default mb-4">
          <div className="flex overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-muted hover:text-title hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-card rounded-lg shadow-sm border border-default p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-700">{stats.avgScore !== null ? `${stats.avgScore}%` : '-'}</div>
                  <div className="text-sm text-blue-600">평균 성적</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-700">{stats.completedExams}/{stats.totalExams}</div>
                  <div className="text-sm text-green-600">완료/전체 시험</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-700">{stats.totalCounselings}</div>
                  <div className="text-sm text-purple-600">상담 기록</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-700">{stats.weeklyHours}h</div>
                  <div className="text-sm text-orange-600">주간 수업시간</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-title mb-3">빠른 액션</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setCounselingModal({ open: true, editing: null }); setCounselingForm({ title: '', content: '', date: new Date().toISOString().slice(0, 10) }); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    + 상담 추가
                  </button>
                  <button
                    onClick={() => handleTabChange('schedule')}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 text-sm"
                  >
                    시간표 편집
                  </button>
                  <button
                    onClick={() => handleTabChange('roadmap')}
                    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm"
                  >
                    로드맵 편집
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-title mb-3">최근 활동</h3>
                {recentActivity.length === 0 ? (
                  <div className="text-muted text-sm">아직 활동 기록이 없습니다.</div>
                ) : (
                  <div className="space-y-2">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-default last:border-0">
                        <span className="text-lg">
                          {activity.type === 'score' && '📈'}
                          {activity.type === 'counseling' && '💬'}
                          {activity.type === 'exam' && '📊'}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm text-title">{activity.text}</div>
                          <div className="text-xs text-muted">{new Date(activity.date).toLocaleDateString('ko-KR')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-title">주간 시간표</h3>
                  <p className="text-sm text-muted">드래그로 스케줄 추가, 더블클릭으로 수정</p>
                </div>
                <div className="flex items-center gap-2">
                  {scheduleHasChanges && <span className="text-xs text-orange-500">변경됨</span>}
                  <button
                    onClick={handleSaveSchedule}
                    disabled={scheduleSaving || !scheduleHasChanges}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
                  >
                    {scheduleSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
              {scheduleLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : schedule !== null ? (
                <ScheduleEditor value={schedule} onChange={(next) => { setSchedule(next); setScheduleHasChanges(true); }} />
              ) : null}
            </div>
          )}

          {/* Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-title">학습 로드맵</h3>
                <button
                  onClick={handleSaveRoadmap}
                  disabled={roadmapSaving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
                >
                  {roadmapSaving ? '저장 중...' : '저장'}
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-4 mb-4 pb-4 border-b border-default">
                <div>
                  <label className="block text-sm text-muted mb-1">시작 연도</label>
                  <input type="number" className="w-24 px-2 py-1.5 border border-default rounded text-sm" value={startAcademicYear} onChange={e => setStartAcademicYear(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">시작 학년</label>
                  <input type="number" className="w-20 px-2 py-1.5 border border-default rounded text-sm" value={startGrade} onChange={e => setStartGrade(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">표시 연수</label>
                  <select className="w-20 px-2 py-1.5 border border-default rounded text-sm" value={years} onChange={e => fetchRoadmap(Number(e.target.value))}>
                    <option value={1}>1년</option>
                    <option value={2}>2년</option>
                    <option value={3}>3년</option>
                    <option value={4}>4년</option>
                  </select>
                </div>
                <div className="flex gap-1 ml-auto">
                  {['subject', 'thinking', 'gifted', 'contest', 'arithmetic'].map(key => (
                    <button
                      key={key}
                      className={`px-2 py-1 text-xs rounded border ${visibleRows[key as keyof typeof visibleRows] ? 'bg-indigo-600 text-white border-indigo-600' : 'border-default'}`}
                      onClick={() => setVisibleRows(v => ({ ...v, [key]: !v[key as keyof typeof v] }))}
                    >
                      {{ subject: '교과', thinking: '사고력', gifted: '영재원', contest: '경시', arithmetic: '연산' }[key]}
                    </button>
                  ))}
                </div>
              </div>

              {roadmapLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : roadmap ? (
                <RoadmapGrid
                  blocks={roadmap.blocks || []}
                  editableThinking
                  thinkingTypeSelection={thinkingTypeSelection}
                  thinkingLevelSelection={thinkingLevelSelection}
                  visibleRows={visibleRows}
                  subjectSelection={subjectSelection}
                  onThinkingTypeToggle={(key) => {
                    const [bi, gi] = key.split('-').map(Number);
                    const cur = thinkingTypeSelection[key] || 'WMO';
                    const nv = cur === 'WMO' ? 'GT' : cur === 'GT' ? 'GTA' : 'WMO';
                    setThinkingTypeSelection(prev => {
                      const updated = { ...prev };
                      for (let y = bi; y < (roadmap?.blocks || []).length; y++) {
                        for (let g = (y === bi ? gi : 0); g < 4; g++) updated[`${y}-${g}`] = nv;
                      }
                      return updated;
                    });
                  }}
                  onThinkingLevelToggle={(key) => {
                    const [bi, gi] = key.split('-').map(Number);
                    const cur = thinkingLevelSelection[key] || 1;
                    const start = cur >= 20 ? 1 : cur + 1;
                    setThinkingLevelSelection(prev => {
                      const updated = { ...prev };
                      let seq = 0;
                      for (let y = bi; y < (roadmap?.blocks || []).length; y++) {
                        for (let g = (y === bi ? gi : 0); g < 4; g++) {
                          updated[`${y}-${g}`] = Math.min(20, start + seq++);
                        }
                      }
                      return updated;
                    });
                  }}
                  onSubjectToggle={(key) => {
                    const [bi, gi] = key.split('-').map(Number);
                    setSubjectSelection(prev => {
                      const blocksArr = roadmap?.blocks || [];
                      const curVal = prev[key] || blocksArr[bi]?.months?.[gi * 3]?.labels?.subject || '';
                      const curIdx = Math.max(0, SUBJECT_CYCLE.indexOf(curVal as any));
                      const nextIdx = (curIdx + 1) % SUBJECT_CYCLE.length;
                      const updated = { ...prev };
                      let idx = nextIdx;
                      for (let y = bi; y < blocksArr.length; y++) {
                        for (let g = (y === bi ? gi : 0); g < 4; g++) {
                          updated[`${y}-${g}`] = SUBJECT_CYCLE[Math.min(idx, SUBJECT_CYCLE.length - 1)];
                          if (SUBJECT_CYCLE[idx] !== '고등') idx = Math.min(idx + 1, SUBJECT_CYCLE.length - 1);
                        }
                      }
                      return updated;
                    });
                  }}
                />
              ) : (
                <div className="text-center py-12 text-muted">로드맵 데이터가 없습니다.</div>
              )}
            </div>
          )}

          {/* Scores Tab */}
          {activeTab === 'scores' && (
            <div>
              <h3 className="text-lg font-semibold text-title mb-4">성적 기록</h3>
              {scoresLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : scores.length === 0 ? (
                <div className="text-center py-12 text-muted">성적 기록이 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-default">
                        <th className="text-left py-2 px-3">시험</th>
                        <th className="text-center py-2 px-3">점수</th>
                        <th className="text-center py-2 px-3">백분율</th>
                        <th className="text-right py-2 px-3">날짜</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map(score => (
                        <tr key={score.id} className="border-b border-default hover:bg-gray-50">
                          <td className="py-2 px-3">{score.exam?.title || '시험'}</td>
                          <td className="text-center py-2 px-3">{score.score}/{score.maxScore}</td>
                          <td className="text-center py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              (score.score / score.maxScore) >= 0.8 ? 'bg-green-100 text-green-700' :
                              (score.score / score.maxScore) >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {Math.round((score.score / score.maxScore) * 100)}%
                            </span>
                          </td>
                          <td className="text-right py-2 px-3 text-muted">{new Date(score.createdAt).toLocaleDateString('ko-KR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Counselings Tab */}
          {activeTab === 'counselings' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-title">상담 기록</h3>
                <button
                  onClick={() => { setCounselingModal({ open: true, editing: null }); setCounselingForm({ title: '', content: '', date: new Date().toISOString().slice(0, 10) }); }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  + 상담 추가
                </button>
              </div>
              {counselingsLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : counselings.length === 0 ? (
                <div className="text-center py-12 text-muted">상담 기록이 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {counselings.map(log => (
                    <div
                      key={log.id}
                      className="border border-default rounded-lg p-4 hover:shadow-sm cursor-pointer"
                      onClick={() => setSelectedCounseling(selectedCounseling?.id === log.id ? null : log)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-title">{log.title}</h4>
                          <div className="text-xs text-muted">{new Date(log.date).toLocaleDateString('ko-KR')}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCounselingModal({ open: true, editing: log });
                            setCounselingForm({ title: log.title, content: log.content, date: log.date });
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          수정
                        </button>
                      </div>
                      {selectedCounseling?.id === log.id && (
                        <div className="mt-3 pt-3 border-t border-default prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {log.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div>
              <h3 className="text-lg font-semibold text-title mb-4">시험 기록</h3>
              {examsLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : examAttempts.length === 0 ? (
                <div className="text-center py-12 text-muted">시험 기록이 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {examAttempts.map(attempt => (
                    <div key={attempt.id} className="border border-default rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-title">
                              {attempt.exam.type} {String(attempt.exam.examnum).padStart(3, '0')}번
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              attempt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              attempt.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {attempt.status === 'COMPLETED' ? '완료' : attempt.status === 'IN_PROGRESS' ? '진행중' : '중단'}
                            </span>
                          </div>
                          <div className="text-sm text-muted mt-1">
                            {attempt.exam.grade}학년 · {attempt.exam.duration}분 · {attempt.totalQuestions}문항 중 {attempt.correctAnswers}개 정답
                          </div>
                        </div>
                        {attempt.status === 'COMPLETED' && attempt.score != null && (
                          <div className="text-2xl font-bold text-green-600">{attempt.score}점</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Counseling Modal */}
      {counselingModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{counselingModal.editing ? '상담 수정' : '상담 추가'}</h3>
              <button onClick={() => setCounselingModal({ open: false, editing: null })} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">제목</label>
                  <input
                    type="text"
                    value={counselingForm.title}
                    onChange={e => setCounselingForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">날짜</label>
                  <input
                    type="date"
                    value={counselingForm.date}
                    onChange={e => setCounselingForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">내용 (마크다운 지원)</label>
                <textarea
                  value={counselingForm.content}
                  onChange={e => setCounselingForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-3 py-2 border rounded h-64 font-mono text-sm"
                  placeholder="상담 내용을 입력하세요..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setCounselingModal({ open: false, editing: null })} className="px-4 py-2 border rounded hover:bg-gray-50">
                취소
              </button>
              <button
                onClick={handleSaveCounseling}
                disabled={!counselingForm.title.trim() || !counselingForm.content.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
