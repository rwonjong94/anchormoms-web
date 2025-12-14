'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ExamOption {
  id: string;
  number?: number | null;
  title?: string | null;
  course?: string | null;
  grade: number;
  type: 'FULL' | 'HALF' | 'BEGINNER' | string;
  duration?: number;
  questionCount?: number;
}

interface Student {
  id: string;
  name: string;
  grade: number;
  school?: string;
}

interface ClassLecture {
  id: string;
  name: string;
  students: { id: string; name: string }[];
}

interface Attempt {
  id: string;
  studentId: string;
  score: number;
  correctAnswers?: number | null;
  submittedAt?: string | null;
  exam: {
    id: string;
    examnum: number;
    grade: number;
    type: string;
    duration: number;
    course?: string | null;
    title?: string | null;
    questionCount?: number;
  };
}

export default function ScoresDashboardPage() {
  const { requireAuth } = useAdminAuth();
  // 이 페이지는 시험 관리 페이지로 기능이 이전되었습니다.
  useEffect(() => { requireAuth(); }, [requireAuth]);
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card border border-default rounded p-8 text-center">
          <h1 className="text-xl font-semibold text-title mb-2">성적 관리 페이지 이동 안내</h1>
          <p className="text-body">
            성적 관리 기능은 시험 관리 페이지로 통합되었습니다.
            시험 관리에서 각 시험을 펼치면 반별 점수와 히스토그램, 점수 추가를 사용할 수 있습니다.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [classes, setClasses] = useState<ClassLecture[]>([]);
  const [error, setError] = useState<string>('');
  // 필터: 과정, 반만 사용
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('');
  const [coursesForFilter, setCoursesForFilter] = useState<string[]>([]);
  // 시험 메타 캐시 (examId -> meta)
  const examMetaCacheRef = useRef<Map<string, { course?: string | null; title?: string | null; examnum?: number | null; duration?: number | null; type?: string | null; grade?: number | null }>>(new Map());

  // 성적 추가 모달 상태
  const [addOpen, setAddOpen] = useState(false);
  const [addClassId, setAddClassId] = useState<string>('');
  const [addDate, setAddDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [addMemo, setAddMemo] = useState<string>('');
  const [addScores, setAddScores] = useState<Record<string, string>>({});
  const [addExamId, setAddExamId] = useState<string>('');
  const [examsForSelect, setExamsForSelect] = useState<ExamOption[]>([]);

  // 과도한 동시 요청으로 인한 503(nginx rate limiting) 방지: 배치 처리 유틸
  async function fetchInBatches<T, R>(
    items: T[],
    batchSize: number,
    worker: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const slice = items.slice(i, i + batchSize);
      const settled = await Promise.allSettled(slice.map(worker));
      for (const s of settled) {
        if (s.status === 'fulfilled') {
          results.push(s.value);
        }
      }
    }
    return results;
  }

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      requireAuth();
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      // 반(클래스) 목록
      const respClasses = await fetch('/api/classes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      let listClasses: ClassLecture[] = [];
      if (respClasses.ok) {
        const cls = await respClasses.json();
        listClasses = (Array.isArray(cls) ? cls : []).map((c: any) => ({
          id: c.id,
          name: c.name,
          students: (c.students || []).map((s: any) => ({ id: s.id, name: s.name })),
        }));
        setClasses(listClasses);
      } else {
        setClasses([]);
      }
      // 학생 목록
      const respStudents = await fetch('/api/nimda/students?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const dataStudents = await respStudents.json();
      const list: Student[] = (dataStudents?.students || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        school: s.school ?? undefined,
      }));
      // 반 필터 반영: '전체 반'일 때도 모든 반의 학생을 포함하도록 보강
      let baseStudents: Student[] = [];
      if (classFilter) {
        const target = listClasses.find((c) => c.id === classFilter)?.students || [];
        baseStudents = target.map(st => {
          const found = list.find(ls => ls.id === st.id);
          return found ? found : { id: st.id, name: st.name, grade: 0 };
        });
      } else {
        // 모든 등록 학생 + 모든 반 소속 학생을 합집합으로 구성
        const allIds = new Set<string>([
          ...list.map(s => s.id),
          ...listClasses.flatMap(c => c.students.map(s => s.id)),
        ]);
        baseStudents = Array.from(allIds).map(id => {
          const found = list.find(s => s.id === id);
          if (found) return found;
          // fall back to name from classes if available
          let name = '학생';
          for (const c of listClasses) {
            const hit = c.students.find(st => st.id === id);
            if (hit) { name = hit.name; break; }
          }
          return { id, name, grade: 0 };
        });
      }
      // 학년 필터 제거: 모든 학생 사용
      const filteredStudents = baseStudents;
      setStudents(filteredStudents);
      // 반이 선택되지 않으면 대량 호출을 피하기 위해 로딩 중단
      if (!classFilter) {
        setAttempts([]);
        setCoursesForFilter([]);
        return;
      }
      // 수동 성적 집계 API로 한 번에 조회
      const studentIds = filteredStudents.map(s => s.id);
      const manualResp = await fetch('/api/nimda/scores/students/list-with-meta', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds }),
      });
      const manualRows = manualResp.ok ? await manualResp.json() : [];
      // 메모 태그에서 시험 ID/제목 힌트 추출
      const tagRegex = /\[exam:([a-z0-9-]+)(?::([^\]]+))?\]/i;
      const candidateExamIds = new Set<string>();
      const idToTitleHint = new Map<string, string | null>();
      for (const row of manualRows) {
        if (typeof row?.memo === 'string') {
          const m = row.memo.match(tagRegex);
          if (m && m[1]) {
            const eid = m[1];
            candidateExamIds.add(eid);
            idToTitleHint.set(eid, m[2] || null);
          }
        }
      }
      // 수동 성적에 필요한 시험 메타 일괄 조회(캐시 사용, 동시 2개)
      const idToExamMeta = new Map<string, { course?: string | null; title?: string | null; examnum?: number | null; duration?: number | null; type?: string | null; grade?: number | null }>();
      const cache = examMetaCacheRef.current;
      const idsAll = Array.from(candidateExamIds);
      const ids = idsAll.filter(id => !cache.has(id));
      for (let i = 0; i < ids.length; i += 2) {
        const slice = ids.slice(i, i + 10);
        const settled = await Promise.allSettled(
          slice.map(async (eid) => {
            const r = await fetch(`/api/nimda/exams/${eid}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!r.ok) return { id: eid, meta: null as any };
            const j = await r.json().catch(() => ({}));
            return {
              id: eid,
              meta: {
                course: j?.course ?? null,
                title: j?.title ?? (idToTitleHint.get(eid) ?? null),
                examnum: j?.examnum ?? j?.number ?? null,
                duration: j?.duration ?? null,
                type: j?.type ?? null,
                grade: j?.grade ?? null,
              },
            };
          })
        );
        for (const s of settled) {
          if (s.status === 'fulfilled' && s.value?.id) {
            const meta = s.value.meta || { course: null, title: idToTitleHint.get(s.value.id) ?? null, examnum: null, duration: null, type: null, grade: null };
            cache.set(s.value.id, meta);
          }
        }
      }
      // 캐시에 있는 메타도 병합
      for (const id of idsAll) {
        const cached = cache.get(id);
        if (cached) idToExamMeta.set(id, cached);
      }
      const manual: Attempt[] = (manualRows || []).map((row: any) => ({
        id: row.id,
        studentId: row.studentId,
        score: Number(row.score ?? 0),
        correctAnswers: null,
        submittedAt: row.takenAt ?? null,
        exam: {
          id: row?.exam?.id || `manual:${row.id}`,
          examnum: row?.exam?.examnum ?? 0,
          grade: row?.exam?.grade ?? 0,
          type: row?.exam?.type ?? 'MANUAL',
          duration: row?.exam?.duration ?? 0,
          course: row?.exam?.course ?? null,
          title: row?.exam?.title ?? null,
          questionCount: undefined,
        },
      }));

      // 과정 목록(필터 옵션) 수집: 시도 데이터 + 전체 시험 목록의 과정 값 합집합
      const courseSet = new Set<string>();
      for (const a of manual) {
        if (a?.exam?.course) courseSet.add(String(a.exam.course));
      }
      try {
        const examsResp = await fetch(`/api/nimda/exams?${new URLSearchParams({ page: '1', limit: '1000' })}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (examsResp.ok) {
          const exData = await examsResp.json();
          const exams: any[] = Array.isArray(exData?.exams) ? exData.exams : [];
          for (const e of exams) {
            if (e?.course) courseSet.add(String(e.course));
          }
        }
      } catch {}
      setCoursesForFilter(Array.from(courseSet).sort());

      let all: any[] = [...manual];
      // 과정 필터 적용 (ALL이면 전체 표시, 수동 성적은 과정이 없으므로 과정 선택 시 제외)
      if (courseFilter !== 'ALL') {
        all = all.filter((a) => (a.exam?.course ? String(a.exam.course) === courseFilter : false));
      }
      // 최신순 정렬
      all.sort((a, b) => {
        const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return tb - ta;
      });
      setAttempts(all);
    } catch (e: any) {
      setError(e?.message || '데이터 로딩 중 오류가 발생했습니다.');
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경/초기 진입 시 자동 로드
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, courseFilter]);

  // 마운트 시 한 번 더 보장 호출 (일부 환경에서 초기 의존성 트리거 이전에 확실히 로드)
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="sr-only">성적 관리</h1>
              <div className="flex items-center gap-2">
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors inline-flex items-center whitespace-nowrap"
                onClick={async () => {
                    // 모달 오픈 전 클래스가 없으면 로드
                    if (classes.length === 0) {
                      try {
                        const token = localStorage.getItem('adminToken');
                        if (!token) return;
                        const resp = await fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } });
                        if (resp.ok) {
                          const data = await resp.json();
                          const normalized: ClassLecture[] = (Array.isArray(data) ? data : []).map((c: any) => ({
                            id: c.id,
                            name: c.name,
                            students: (c.students || c.Student || []).map((s: any) => ({ id: s.id, name: s.name })),
                          }));
                          setClasses(normalized);
                        }
                      } catch {}
                    }
                    setAddClassId('');
                    setAddDate(new Date().toISOString().slice(0, 10));
                    setAddMemo('');
                    setAddScores({});
                  setAddExamId('');
                  // 시험 목록 미리 로드
                  try {
                    const token = localStorage.getItem('adminToken');
                    if (token) {
                      // 시험 목록은 관리 페이지 API 재사용
                      const params = new URLSearchParams({ page: '1', limit: '1000' });
                      const respExams = await fetch(`/api/nimda/exams?${params}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                      });
                      if (respExams.ok) {
                        const data = await respExams.json();
                        const items: ExamOption[] = (data?.exams || []).map((e: any) => ({
                          id: e.id,
                          number: e.number ?? e.examnum ?? null,
                          title: e.title ?? null,
                          course: e.course ?? null,
                          grade: e.grade,
                          type: e.type,
                          duration: e.duration,
                          questionCount: e.questionCount,
                        }));
                        setExamsForSelect(items);
                      } else {
                        setExamsForSelect([]);
                      }
                    }
                  } catch {
                    setExamsForSelect([]);
                  }
                    setAddOpen(true);
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>성적 추가</span>
                </button>
                {loading && (
                  <div className="inline-flex items-center justify-center h-9 w-9 text-body" title="불러오는 중">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-card rounded-lg border border-default p-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  className="px-3 py-2 border border-input rounded bg-card text-title"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  title="과정"
                >
                  <option value="ALL">전체 과정</option>
                  {coursesForFilter.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 border border-input rounded bg-card text-title"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  title="반/그룹 선택"
                >
                  <option value="">전체 반</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 시험별 아코디언 테이블 */}
          <ExamAccordion
            attempts={attempts}
            students={students}
            classes={classes}
            activeClassId={classFilter}
          />

          {error && (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          )}
        </div>
      </div>
    </AdminLayout>
    {/* 성적 추가 모달 */}
    {addOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onMouseDown={() => setAddOpen(false)}>
        <div className="bg-card border border-default rounded-lg w-full max-w-2xl mx-4 p-4" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-title">성적 추가</h3>
            <button className="text-muted hover:text-body" onClick={() => setAddOpen(false)}>✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1">시험 선택 (등록된 시험에서 선택)</label>
              <select
                className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                value={addExamId}
                onChange={(e) => {
                  const id = e.target.value;
                  setAddExamId(id);
                }}
              >
                <option value="">시험 선택</option>
                {examsForSelect.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.course ? `${e.course} · ` : ''}{e.title || '무제'}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1">반/그룹</label>
              <select
                className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                value={addClassId}
                onChange={(e) => {
                  setAddClassId(e.target.value);
                  setAddScores({});
                }}
              >
                <option value="">반 선택</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">응시일</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1">시험 메모</label>
              <textarea
                className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                rows={3}
                value={addMemo}
                onChange={(e) => setAddMemo(e.target.value)}
                placeholder="시험 특징/메모를 입력하세요"
              />
            </div>
          </div>
          {/* 선택된 반 학생 점수 입력 */}
          <div className="mt-4 border-t border-default pt-3">
            {!addClassId ? (
              <div className="text-xs text-muted">반을 먼저 선택하세요.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                {(classes.find((c) => c.id === addClassId)?.students || []).map((st) => (
                  <div key={st.id} className="flex items-center gap-2">
                    <div className="flex-1 text-sm text-title truncate">{st.name}</div>
                    <input
                      className="w-24 px-2 py-1 border border-input bg-card text-title rounded"
                      placeholder="점수"
                      value={addScores[st.id] ?? ''}
                      onChange={(e) => setAddScores((prev) => ({ ...prev, [st.id]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-2 rounded border border-input hover:bg-hover" onClick={() => setAddOpen(false)}>취소</button>
            <button
              className="px-4 py-2 rounded bg-primary text-primary-foreground"
              onClick={async () => {
                try {
                  const token = localStorage.getItem('adminToken');
                  if (!token) return;
                  if (!addClassId) {
                    alert('반을 선택하세요.');
                    return;
                  }
                  if (!addExamId) {
                    alert('시험을 선택하세요.');
                    return;
                  }
                  const selectedExam = examsForSelect.find((x) => x.id === addExamId);
                  if (!selectedExam) {
                    alert('유효한 시험을 선택하세요.');
                    return;
                  }
                  const studentsInClass = classes.find((c) => c.id === addClassId)?.students || [];
                  const entries = studentsInClass
                    .map((st) => ({
                      studentId: st.id,
                      scoreStr: (addScores[st.id] ?? '').trim(),
                    }))
                    .filter((x) => x.scoreStr !== '')
                    .map((x) => ({ studentId: x.studentId, score: Number(x.scoreStr) }))
                    .filter((x) => !Number.isNaN(x.score));
                  if (entries.length === 0) {
                    alert('입력된 점수가 없습니다.');
                    return;
                  }
                  // memo에 시험 선택 태그가 없고 시험이 선택된 경우 태그 추가
                  let memoToSend = addMemo || '';
                  if (selectedExam && !memoToSend.includes('[exam:')) {
                    const tag = `[exam:${selectedExam.id}${selectedExam.title ? `:${selectedExam.title}` : ''}]`;
                    memoToSend = memoToSend ? `${memoToSend} ${tag}` : tag;
                  }
                  // 과정 태그 자동 추가
                  if (selectedExam?.course && !/\[course:[^\]]+\]/i.test(memoToSend)) {
                    memoToSend = memoToSend ? `${memoToSend} [course:${selectedExam.course}]` : `[course:${selectedExam.course}]`;
                  }
                  // 수동 성적 전용 관리자 API
                  const resp = await fetch('/api/nimda/scores/bulk', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      classId: addClassId || undefined,
                      // 선택된 시험에서 종류/학년을 자동으로 추출
                      examType: selectedExam.type,
                      grade: selectedExam.grade,
                      takenAt: addDate ? `${addDate}T00:00:00` : undefined,
                      memo: memoToSend || undefined,
                      entries,
                    }),
                  });
                  if (!resp.ok) {
                    const txt = await resp.text().catch(() => '');
                    alert(`저장 실패 (status ${resp.status})\n${txt?.slice(0, 500)}`);
                    return;
                  }
                  setAddOpen(false);
                  // 저장 후 즉시 새로고침
                  await fetchAll();
                } catch (e: any) {
                  alert(e?.message || '저장 중 오류가 발생했습니다.');
                }
              }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function ExamAccordion({
  attempts,
  students,
  classes,
  activeClassId,
}: {
  attempts: Array<{
    studentId: string;
    score: number;
    exam: { id: string; type: string; grade: number; examnum?: number; duration?: number; questionCount?: number; course?: string | null; title?: string | null };
  }>;
  students: Student[];
  classes: ClassLecture[];
  activeClassId: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const studentsById = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const activeClass = useMemo(() => classes.find(c => c.id === activeClassId) || null, [classes, activeClassId]);
  const classStudentIdSet = useMemo(() => new Set((activeClass?.students || []).map(s => s.id)), [activeClass]);

  type Group = {
    id: string;
    label: string;
    meta: {
      course?: string | null;
      examnum?: number;
      title?: string | null;
      isManual: boolean;
    };
    items: typeof attempts;
  };

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    attempts.forEach(a => {
      const isManual = String(a.exam?.id || '').startsWith('manual:') || String(a.exam?.type || '').toUpperCase() === 'MANUAL';
      const c = a.exam?.course ?? null;
      const n = a.exam?.examnum ?? 0;
      const t = a.exam?.title ?? null;
      const groupId = isManual ? `manual:${(c || 'UNKNOWN')}::${(t || 'UNTITLED')}` : `official:${c ?? 'UNKNOWN'}:${n}`;
      if (!map.has(groupId)) {
        const label = isManual
          ? `${c ?? '과정 없음'} · ${t ?? '무제'}`
          : `${c ?? '과정 없음'} · #${String(n).padStart(3, '0')}`;
        map.set(groupId, {
          id: groupId,
          label,
          meta: {
            course: c,
            examnum: n,
            title: t,
            isManual,
          },
          items: [],
        });
      }
      map.get(groupId)!.items.push(a);
    });
    // 정렬: 공식 그룹 먼저→회차 오름차순, 수동 그룹은 과정/제목 사전순
    return Array.from(map.values()).sort((g1, g2) => {
      if (g1.meta.isManual !== g2.meta.isManual) return g1.meta.isManual ? 1 : -1;
      if (!g1.meta.isManual && !g2.meta.isManual) {
        const n1 = g1.meta.examnum ?? 0, n2 = g2.meta.examnum ?? 0;
        return n1 - n2;
      }
      const c1 = (g1.meta.course || '').toString();
      const c2 = (g2.meta.course || '').toString();
      if (c1 !== c2) return c1.localeCompare(c2, 'ko');
      const t1 = (g1.meta.title || '').toString();
      const t2 = (g2.meta.title || '').toString();
      return t1.localeCompare(t2, 'ko');
    });
  }, [attempts]);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const Average = ({ values }: { values: number[] }) => {
    const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    return <span className="font-semibold">{Math.round(avg * 10) / 10}</span>;
  };

  const Histogram = ({ values }: { values: number[] }) => {
    if (!values.length) return <span className="text-xs text-muted">-</span>;
    const bins = new Array(10).fill(0);
    values.forEach(raw => {
      const v = Math.max(0, Math.min(100, raw));
      let idx: number;
      if (v === 0) {
        idx = 0;
      } else {
        idx = Math.ceil(v / 10) - 1; // (0,10] -> 0, (10,20] -> 1, ..., (90,100] -> 9
        if (idx < 0) idx = 0;
        if (idx > 9) idx = 9;
      }
      bins[idx] += 1;
    });
    const maxCount = Math.max(...bins, 1);
    return (
      <div className="flex items-end gap-1 h-16">
        {bins.map((c, i) => {
          const h = Math.round((c / maxCount) * 100);
          const lower = i === 0 ? 0 : i * 10 + 1; // [0,10], (10,20], ...
          const upper = (i + 1) * 10;
          return (
            <div
              key={i}
              className="w-4 bg-indigo-500/20 border border-indigo-500/40 rounded-sm"
              style={{ height: `${Math.max(8, h)}%` }}
              title={`${lower}~${upper}점: ${c}명`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-card border border-default rounded mb-6">
      <div className="divide-y divide-default">
        {groups.map(g => {
          const allScores = g.items.map(x => x.score).filter(x => typeof x === 'number');
          const classScores = g.items.filter(x => classStudentIdSet.has(x.studentId)).map(x => x.score);
          return (
            <div key={g.id}>
              {/* 요약 행 */}
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-hover"
                onClick={() => toggle(g.id)}
                aria-expanded={!!expanded[g.id]}
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-sm text-muted">{activeClass ? activeClass.name : '전체 반'}</span>
                  <span className="text-title">{g.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-body">
                    전체 평균: <Average values={allScores} />
                  </div>
                  <div className="text-sm text-body">
                    학급 평균: <Average values={classScores} />
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${expanded[g.id] ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              {/* 확장 영역 */}
              {expanded[g.id] && (
                <div className="px-4 pb-4">
                  {/* 상세 시험 정보 + 히스토그램 (수동: 과정/시험명, 공식: 과정/회차) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3">
                    <div className="bg-card border border-default rounded p-3">
                      <div className="text-xs text-muted mb-1">시험 정보</div>
                      <div className="text-sm text-body">
                        과정: {g.meta.course ?? '과정 없음'}<br />
                        {g.meta.isManagedByTitle || g.meta.isManual ? (
                          <>시험: {g.meta.title ?? '무제'}</>
                        ) : (
                          <>회차: {g.meta.examnum != null ? `#${String(g.meta.examnum).padStart(3, '0')}` : '-'}</>
                        )}
                      </div>
                    </div>
                    <div className="bg-card border border-default rounded p-3">
                      <div className="text-xs text-muted mb-1">평균</div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm">전체: <Average values={allScores} /></div>
                        <div className="text-sm">학급: <Average values={classScores} /></div>
                      </div>
                      <div className="text-xs text-muted mt-1">참고: 전체 평균은 현재 조회 범위 내 표본 기준입니다.</div>
                    </div>
                    <div className="bg-card border border-default rounded p-3">
                      <div className="text-xs text-muted mb-1">분포(히스토그램)</div>
                      <Histogram values={allScores} />
                    </div>
                  </div>
                  {/* 학생별 점수 테이블 */}
                  <div className="overflow-x-auto border border-default rounded">
                    <table className="min-w-full divide-y divide-default">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">학생</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">점수</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">학급 소속</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-default">
                        {g.items.map((it, idx) => {
                          const st = studentsById.get(it.studentId);
                          const inClass = classStudentIdSet.has(it.studentId);
                          return (
                            <tr key={`${it.studentId}-${idx}`} className="hover:bg-hover">
                              <td className="px-4 py-2 text-sm text-title">{st?.name ?? it.studentId}</td>
                              <td className="px-4 py-2 text-sm">{it.score}</td>
                              <td className="px-4 py-2 text-sm">
                                {inClass ? (activeClass?.name || '선택 반') : '-'}
                              </td>
                            </tr>
                          );
                        })}
                        {g.items.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted">데이터가 없습니다.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted">표시할 시험이 없습니다. 상단에서 필터를 조정하거나 데이터를 불러오세요.</div>
        )}
      </div>
    </div>
  );
}



