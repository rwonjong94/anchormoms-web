'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// ============================================
// Types
// ============================================

interface Student {
  id: string;
  name: string;
  grade: number;
  school?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  students: { id: string; name: string }[];
}

interface ScoreRecord {
  id: string;
  studentId: string;
  score: number;
  takenAt: string | null;
  memo?: string;
  exam?: {
    id: string;
    title?: string | null;
    course?: string | null;
    examnum?: number | null;
  };
}

interface ExamInfo {
  id: string;
  title?: string | null;
  course?: string | null;
  examnum?: number | null;
}

// ============================================
// Main Component
// ============================================

export default function ScoresDashboardPage() {
  const { requireAuth } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'matrix'>('student');

  // Common state
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      try {
        const resp = await fetch('/api/nimda/classes', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          const list: ClassInfo[] = (Array.isArray(data) ? data : []).map((c: any) => ({
            id: c.id,
            name: c.name,
            students: (c.students || []).map((s: any) => ({ id: s.id, name: s.name })),
          }));
          setClasses(list);
          if (list.length > 0 && !selectedClassId) {
            setSelectedClassId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    };

    loadClasses();
  }, []);

  // Load students when class changes
  useEffect(() => {
    const loadStudents = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      setLoading(true);
      try {
        let studentList: Student[] = [];

        if (selectedClassId) {
          // Get students from selected class
          const classInfo = classes.find(c => c.id === selectedClassId);
          if (classInfo) {
            // Fetch full student info
            const resp = await fetch('/api/nimda/students?limit=500', {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (resp.ok) {
              const data = await resp.json();
              const allStudents: Student[] = (data?.students || []).map((s: any) => ({
                id: s.id,
                name: s.name,
                grade: s.grade,
                school: s.school,
              }));

              // Filter to class students
              const classStudentIds = new Set(classInfo.students.map(s => s.id));
              studentList = allStudents.filter(s => classStudentIds.has(s.id));
            }
          }
        }

        setStudents(studentList);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedClassId) {
      loadStudents();
    }
  }, [selectedClassId, classes]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-title">성적 관리</h1>
            <div className="flex items-center gap-3">
              {/* Class selector */}
              <select
                className="px-3 py-2 border border-input rounded bg-card text-title"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">반 선택</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 border-b border-default">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('student')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'student'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-body'
                }`}
              >
                👤 학생별 보기
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'matrix'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-body'
                }`}
              >
                📊 반별 매트릭스
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {!selectedClassId ? (
          <div className="bg-card border border-default rounded-lg p-12 text-center">
            <p className="text-muted">반을 선택해주세요.</p>
          </div>
        ) : loading ? (
          <div className="bg-card border border-default rounded-lg p-12 text-center">
            <div className="inline-flex items-center gap-2 text-muted">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              불러오는 중...
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'student' && (
              <StudentView
                students={students}
                classId={selectedClassId}
                className={classes.find(c => c.id === selectedClassId)?.name || ''}
              />
            )}
            {activeTab === 'matrix' && (
              <MatrixView
                students={students}
                classId={selectedClassId}
                className={classes.find(c => c.id === selectedClassId)?.name || ''}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// ============================================
// Student View Component
// ============================================

function StudentView({
  students,
  classId,
  className
}: {
  students: Student[];
  classId: string;
  className: string;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [examAverages, setExamAverages] = useState<Record<string, number>>({});

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Auto-select first student
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Load scores for selected student
  useEffect(() => {
    const loadScores = async () => {
      if (!selectedStudentId) return;

      const token = localStorage.getItem('adminToken');
      if (!token) return;

      setScoresLoading(true);
      try {
        const resp = await fetch('/api/nimda/scores/students/list-with-meta', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentIds: [selectedStudentId] }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const records: ScoreRecord[] = (data || []).map((r: any) => ({
            id: r.id,
            studentId: r.studentId,
            score: Number(r.score ?? 0),
            takenAt: r.takenAt || null,
            memo: r.memo,
            exam: r.exam ? {
              id: r.exam.id,
              title: r.exam.title,
              course: r.exam.course,
              examnum: r.exam.examnum,
            } : undefined,
          })).sort((a: ScoreRecord, b: ScoreRecord) => {
            const ta = a.takenAt ? new Date(a.takenAt).getTime() : 0;
            const tb = b.takenAt ? new Date(b.takenAt).getTime() : 0;
            return tb - ta;
          });

          setScores(records);

          // Load exam averages for recent exams
          const examIds = [...new Set(records.slice(0, 10).map(r => r.exam?.id).filter(Boolean))] as string[];
          const averages: Record<string, number> = {};

          for (const examId of examIds.slice(0, 5)) {
            try {
              const statsResp = await fetch(`/api/nimda/exams/${examId}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (statsResp.ok) {
                const stats = await statsResp.json();
                if (typeof stats?.average === 'number') {
                  averages[examId] = stats.average;
                }
              }
            } catch {}
          }

          setExamAverages(averages);
        }
      } catch (err) {
        console.error('Failed to load scores:', err);
      } finally {
        setScoresLoading(false);
      }
    };

    loadScores();
  }, [selectedStudentId]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Calculate stats
  const stats = useMemo(() => {
    if (scores.length === 0) return { avg: 0, max: 0, min: 0, count: 0, trend: 0 };

    const scoreValues = scores.map(s => s.score);
    const avg = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
    const max = Math.max(...scoreValues);
    const min = Math.min(...scoreValues);

    // Trend: compare last 3 vs previous 3
    let trend = 0;
    if (scores.length >= 6) {
      const recent = scores.slice(0, 3).reduce((a, b) => a + b.score, 0) / 3;
      const previous = scores.slice(3, 6).reduce((a, b) => a + b.score, 0) / 3;
      trend = recent - previous;
    }

    return { avg: Math.round(avg * 10) / 10, max, min, count: scores.length, trend };
  }, [scores]);

  return (
    <div className="flex gap-6">
      {/* Left: Student List */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-card border border-default rounded-lg">
          <div className="p-3 border-b border-default">
            <input
              type="text"
              placeholder="학생 검색..."
              className="w-full px-3 py-2 text-sm border border-input rounded bg-card text-title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted">
                학생이 없습니다.
              </div>
            ) : (
              filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-hover transition-colors border-b border-default last:border-b-0 ${
                    selectedStudentId === student.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="font-medium text-title">{student.name}</div>
                  <div className="text-xs text-muted">
                    {student.grade}학년 · {student.school || '학교 미등록'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: Score Details */}
      <div className="flex-1">
        {!selectedStudent ? (
          <div className="bg-card border border-default rounded-lg p-12 text-center">
            <p className="text-muted">학생을 선택해주세요.</p>
          </div>
        ) : scoresLoading ? (
          <div className="bg-card border border-default rounded-lg p-12 text-center">
            <div className="inline-flex items-center gap-2 text-muted">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              불러오는 중...
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="bg-card border border-default rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-title">{selectedStudent.name}</h2>
                  <p className="text-sm text-muted">
                    {selectedStudent.grade}학년 · {selectedStudent.school || '학교 미등록'} · {className}
                  </p>
                </div>
                <a
                  href={`/nimda/dashboard/students/${selectedStudent.id}?tab=scores`}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
                >
                  상세 페이지 →
                </a>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card border border-default rounded-lg p-4">
                <div className="text-xs text-muted mb-1">평균 점수</div>
                <div className="text-2xl font-bold text-title">{stats.avg}</div>
              </div>
              <div className="bg-card border border-default rounded-lg p-4">
                <div className="text-xs text-muted mb-1">최고 점수</div>
                <div className="text-2xl font-bold text-green-600">{stats.max || '-'}</div>
              </div>
              <div className="bg-card border border-default rounded-lg p-4">
                <div className="text-xs text-muted mb-1">최저 점수</div>
                <div className="text-2xl font-bold text-red-600">{stats.min || '-'}</div>
              </div>
              <div className="bg-card border border-default rounded-lg p-4">
                <div className="text-xs text-muted mb-1">추이</div>
                <div className={`text-2xl font-bold ${stats.trend > 0 ? 'text-green-600' : stats.trend < 0 ? 'text-red-600' : 'text-muted'}`}>
                  {stats.trend > 0 ? `+${stats.trend.toFixed(1)}` : stats.trend < 0 ? stats.trend.toFixed(1) : '-'}
                </div>
              </div>
            </div>

            {/* Score Chart */}
            <div className="bg-card border border-default rounded-lg p-6">
              <h3 className="text-sm font-medium text-title mb-4">성적 추이</h3>
              <ScoreChart
                scores={scores.slice(0, 10).reverse()}
                averages={examAverages}
              />
            </div>

            {/* Score Table */}
            <div className="bg-card border border-default rounded-lg">
              <div className="px-6 py-4 border-b border-default">
                <h3 className="text-sm font-medium text-title">성적 기록 ({scores.length}건)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">시험</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">점수</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">평균</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">날짜</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">메모</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {scores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                          성적 기록이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      scores.map((score) => {
                        const examLabel = score.exam?.title ||
                          (score.exam?.course ? `${score.exam.course} #${score.exam.examnum || '?'}` : '시험');
                        const avg = score.exam?.id ? examAverages[score.exam.id] : undefined;
                        const memoClean = (score.memo || '').replace(/\[(?:exam|course):[^\]]+\]/gi, '').trim();

                        return (
                          <tr key={score.id} className="hover:bg-hover">
                            <td className="px-4 py-3 text-sm text-title">{examLabel}</td>
                            <td className="px-4 py-3 text-sm font-semibold">{score.score}</td>
                            <td className="px-4 py-3 text-sm text-muted">
                              {avg ? Math.round(avg * 10) / 10 : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted">
                              {score.takenAt ? new Date(score.takenAt).toLocaleDateString('ko-KR') : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted max-w-[200px] truncate" title={memoClean}>
                              {memoClean || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Matrix View Component
// ============================================

function MatrixView({
  students,
  classId,
  className
}: {
  students: Student[];
  classId: string;
  className: string;
}) {
  const [allScores, setAllScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all scores for class students
  useEffect(() => {
    const loadAllScores = async () => {
      if (students.length === 0) return;

      const token = localStorage.getItem('adminToken');
      if (!token) return;

      setLoading(true);
      try {
        const studentIds = students.map(s => s.id);
        const resp = await fetch('/api/nimda/scores/students/list-with-meta', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentIds }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const records: ScoreRecord[] = (data || []).map((r: any) => ({
            id: r.id,
            studentId: r.studentId,
            score: Number(r.score ?? 0),
            takenAt: r.takenAt || null,
            memo: r.memo,
            exam: r.exam ? {
              id: r.exam.id,
              title: r.exam.title,
              course: r.exam.course,
              examnum: r.exam.examnum,
            } : undefined,
          }));

          setAllScores(records);
        }
      } catch (err) {
        console.error('Failed to load scores:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllScores();
  }, [students]);

  // Group scores by exam
  const { exams, scoreMatrix, examAverages, studentAverages, studentTrends } = useMemo(() => {
    // Collect unique exams
    const examMap = new Map<string, ExamInfo>();
    allScores.forEach(s => {
      if (s.exam?.id && !examMap.has(s.exam.id)) {
        examMap.set(s.exam.id, s.exam);
      }
    });

    // Sort exams by date (most recent first based on scores)
    const examDateMap = new Map<string, number>();
    allScores.forEach(s => {
      if (s.exam?.id && s.takenAt) {
        const date = new Date(s.takenAt).getTime();
        const existing = examDateMap.get(s.exam.id) || 0;
        if (date > existing) examDateMap.set(s.exam.id, date);
      }
    });

    const sortedExams = Array.from(examMap.values()).sort((a, b) => {
      const dateA = examDateMap.get(a.id) || 0;
      const dateB = examDateMap.get(b.id) || 0;
      return dateB - dateA;
    }).slice(0, 10); // Limit to 10 most recent exams

    // Build score matrix: studentId -> examId -> score
    const matrix = new Map<string, Map<string, number>>();
    students.forEach(s => matrix.set(s.id, new Map()));

    allScores.forEach(s => {
      if (s.exam?.id && matrix.has(s.studentId)) {
        matrix.get(s.studentId)!.set(s.exam.id, s.score);
      }
    });

    // Calculate exam averages
    const examAvgs: Record<string, number> = {};
    sortedExams.forEach(exam => {
      const scores = allScores.filter(s => s.exam?.id === exam.id).map(s => s.score);
      if (scores.length > 0) {
        examAvgs[exam.id] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
      }
    });

    // Calculate student averages
    const studentAvgs: Record<string, number> = {};
    students.forEach(student => {
      const studentScores = allScores.filter(s => s.studentId === student.id).map(s => s.score);
      if (studentScores.length > 0) {
        studentAvgs[student.id] = Math.round(studentScores.reduce((a, b) => a + b, 0) / studentScores.length * 10) / 10;
      }
    });

    // Calculate student trends (compare recent vs previous)
    const trends: Record<string, 'up' | 'down' | 'stable'> = {};
    students.forEach(student => {
      const studentScores = allScores
        .filter(s => s.studentId === student.id)
        .sort((a, b) => {
          const ta = a.takenAt ? new Date(a.takenAt).getTime() : 0;
          const tb = b.takenAt ? new Date(b.takenAt).getTime() : 0;
          return tb - ta;
        });

      if (studentScores.length >= 4) {
        const recent = studentScores.slice(0, 2).reduce((a, b) => a + b.score, 0) / 2;
        const previous = studentScores.slice(2, 4).reduce((a, b) => a + b.score, 0) / 2;
        if (recent - previous > 3) trends[student.id] = 'up';
        else if (previous - recent > 3) trends[student.id] = 'down';
        else trends[student.id] = 'stable';
      } else {
        trends[student.id] = 'stable';
      }
    });

    return {
      exams: sortedExams,
      scoreMatrix: matrix,
      examAverages: examAvgs,
      studentAverages: studentAvgs,
      studentTrends: trends,
    };
  }, [allScores, students]);

  // Sort students by average (descending)
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const avgA = studentAverages[a.id] || 0;
      const avgB = studentAverages[b.id] || 0;
      return avgB - avgA;
    });
  }, [students, studentAverages]);

  if (loading) {
    return (
      <div className="bg-card border border-default rounded-lg p-12 text-center">
        <div className="inline-flex items-center gap-2 text-muted">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <div className="bg-card border border-default rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-title">{className}</h2>
            <p className="text-sm text-muted">{students.length}명 · 최근 시험 {exams.length}개</p>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-card border border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase sticky left-0 bg-muted z-10 min-w-[120px]">
                  학생
                </th>
                {exams.map((exam) => (
                  <th key={exam.id} className="px-3 py-3 text-center text-xs font-medium text-muted uppercase min-w-[80px]">
                    <div className="truncate max-w-[80px]" title={exam.title || exam.course || '시험'}>
                      {exam.title || (exam.course ? `${exam.course}` : '시험')}
                    </div>
                    {exam.examnum && (
                      <div className="text-[10px] text-muted">#{exam.examnum}</div>
                    )}
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-medium text-muted uppercase min-w-[60px]">평균</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-muted uppercase min-w-[50px]">추이</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={exams.length + 3} className="px-4 py-8 text-center text-sm text-muted">
                    학생이 없습니다.
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student, idx) => {
                  const studentScores = scoreMatrix.get(student.id);
                  const avg = studentAverages[student.id];
                  const trend = studentTrends[student.id];

                  return (
                    <tr key={student.id} className="hover:bg-hover">
                      <td className="px-4 py-3 text-sm font-medium text-title sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted w-5">{idx + 1}</span>
                          <a
                            href={`/nimda/dashboard/students/${student.id}?tab=scores`}
                            className="hover:underline"
                          >
                            {student.name}
                          </a>
                        </div>
                      </td>
                      {exams.map((exam) => {
                        const score = studentScores?.get(exam.id);
                        const examAvg = examAverages[exam.id];

                        // Color based on comparison to average
                        let colorClass = 'text-body';
                        if (score !== undefined && examAvg !== undefined) {
                          if (score >= examAvg + 10) colorClass = 'text-green-600 font-semibold';
                          else if (score >= examAvg) colorClass = 'text-green-600';
                          else if (score <= examAvg - 10) colorClass = 'text-red-600';
                          else colorClass = 'text-orange-500';
                        }

                        return (
                          <td key={exam.id} className={`px-3 py-3 text-center text-sm ${colorClass}`}>
                            {score !== undefined ? score : '-'}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center text-sm font-semibold text-title">
                        {avg || '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {trend === 'up' && <span className="text-green-600">↑</span>}
                        {trend === 'down' && <span className="text-red-600">↓</span>}
                        {trend === 'stable' && <span className="text-muted">→</span>}
                      </td>
                    </tr>
                  );
                })
              )}
              {/* Average row */}
              {sortedStudents.length > 0 && (
                <tr className="bg-muted font-medium">
                  <td className="px-4 py-3 text-sm text-title sticky left-0 bg-muted z-10">
                    반 평균
                  </td>
                  {exams.map((exam) => (
                    <td key={exam.id} className="px-3 py-3 text-center text-sm text-title">
                      {examAverages[exam.id] || '-'}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center text-sm text-title">
                    {sortedStudents.length > 0
                      ? Math.round(
                          Object.values(studentAverages).reduce((a, b) => a + b, 0) /
                          Object.values(studentAverages).length * 10
                        ) / 10
                      : '-'
                    }
                  </td>
                  <td className="px-3 py-3"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted">
        <span>색상 기준:</span>
        <span className="text-green-600 font-semibold">■ 평균+10 이상</span>
        <span className="text-green-600">■ 평균 이상</span>
        <span className="text-orange-500">■ 평균 미만</span>
        <span className="text-red-600">■ 평균-10 이하</span>
      </div>
    </div>
  );
}

// ============================================
// Score Chart Component
// ============================================

function ScoreChart({
  scores,
  averages
}: {
  scores: ScoreRecord[];
  averages: Record<string, number>;
}) {
  if (scores.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted">
        차트를 표시할 데이터가 없습니다.
      </div>
    );
  }

  const width = 700;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const yMin = 0;
  const yMax = 100;

  const xScale = (i: number) => {
    if (scores.length <= 1) return padding.left + innerW / 2;
    return padding.left + (i / (scores.length - 1)) * innerW;
  };

  const yScale = (v: number) => {
    return padding.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  };

  // Build paths
  const studentPoints = scores.map((s, i) => [xScale(i), yScale(s.score)] as const);
  const avgPoints = scores.map((s, i) => {
    const avg = s.exam?.id ? averages[s.exam.id] : undefined;
    return avg !== undefined ? [xScale(i), yScale(avg)] as const : null;
  });

  const studentPath = studentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const avgPath = avgPoints
    .map((p, i) => p ? `${i === 0 || !avgPoints[i - 1] ? 'M' : 'L'} ${p[0]} ${p[1]}` : '')
    .filter(Boolean)
    .join(' ');

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="block mx-auto">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={yScale(v)}
              x2={padding.left + innerW}
              y2={yScale(v)}
              stroke="#e5e7eb"
            />
            <text
              x={padding.left - 8}
              y={yScale(v)}
              textAnchor="end"
              alignmentBaseline="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {v}
            </text>
          </g>
        ))}

        {/* Average line */}
        {avgPath && (
          <path d={avgPath} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" />
        )}

        {/* Student score line */}
        <path d={studentPath} fill="none" stroke="#3b82f6" strokeWidth={2} />

        {/* Points */}
        {studentPoints.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="#3b82f6" />
        ))}

        {/* X-axis labels */}
        {scores.map((s, i) => {
          const label = s.exam?.title?.slice(0, 6) ||
            (s.exam?.course ? `${s.exam.course.slice(0, 3)}` : '') ||
            `#${i + 1}`;
          return (
            <text
              key={i}
              x={xScale(i)}
              y={height - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {label}
            </text>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${width - 150}, 10)`}>
          <line x1={0} y1={6} x2={20} y2={6} stroke="#3b82f6" strokeWidth={2} />
          <text x={25} y={10} fontSize="10" fill="#6b7280">학생 점수</text>
          <line x1={80} y1={6} x2={100} y2={6} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" />
          <text x={105} y={10} fontSize="10" fill="#6b7280">평균</text>
        </g>
      </svg>
    </div>
  );
}
