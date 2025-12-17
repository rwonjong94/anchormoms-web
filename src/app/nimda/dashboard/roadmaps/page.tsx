'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import RoadmapGrid from '@/components/admin/RoadmapGrid';

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

const SUBJECT_CYCLE = [
  '초3-1','초3-2','초4-1','초4-2','초5-1','초5-2','초6-1','초6-2',
  '중1-1','중1-2','중2-1','중2-2','중3-1','중3-2','고등'
] as const;

export default function RoadmapsManagementPage() {
  // Class and student selection
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  // Roadmap state
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [years, setYears] = useState<number>(3);
  const [startAcademicYear, setStartAcademicYear] = useState<number>(new Date().getFullYear());
  const [startGrade, setStartGrade] = useState<number>(3);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Roadmap selections
  const [thinkingTypeSelection, setThinkingTypeSelection] = useState<Record<string, 'WMO' | 'GT' | 'GTA'>>({});
  const [thinkingLevelSelection, setThinkingLevelSelection] = useState<Record<string, number>>({});
  const [subjectSelection, setSubjectSelection] = useState<Record<string, string>>({});
  const [visibleRows, setVisibleRows] = useState({
    subject: true,
    thinking: true,
    gifted: true,
    contest: true,
    arithmetic: true,
  });

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
      const firstStudent = selectedClass.students[0];
      setSelectedStudentId(firstStudent.id);
      setStartGrade(firstStudent.grade);
    } else {
      setSelectedStudentId('');
    }
  }, [selectedClassId, classes]);

  // Fetch roadmap when student changes
  const fetchRoadmap = async (yrs = years) => {
    if (!selectedStudentId) return;
    try {
      setRoadmapLoading(true);
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/students/${selectedStudentId}/roadmap?years=${yrs}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setRoadmap(data);
        setYears(yrs);
        setStartAcademicYear(Number(data?.base?.startAcademicYear ?? new Date().getFullYear()));
        setStartGrade(Number(data?.base?.startGrade ?? startGrade));

        // Initialize selections from roadmap data
        const extras = (data?.extras || {}) as any;

        // Thinking types
        const typeMap: Record<string, 'WMO' | 'GT' | 'GTA'> = {};
        const typeArr: Array<{ yearOffset: number; groupIndex: number; type: string }> = Array.isArray(extras?.thinkingTypes) ? extras.thinkingTypes : [];
        for (const it of typeArr) {
          const key = `${it.yearOffset}-${it.groupIndex}`;
          const t = String(it.type || 'WMO').toUpperCase();
          typeMap[key] = (t === 'GT' || t === 'GTA' ? t : 'WMO') as 'WMO' | 'GT' | 'GTA';
        }
        setThinkingTypeSelection(typeMap);

        // Thinking levels
        const levelMap: Record<string, number> = {};
        const levelArr: Array<{ yearOffset: number; groupIndex: number; level: number }> = Array.isArray(extras?.thinkingLevels) ? extras.thinkingLevels : [];
        for (const it of levelArr) {
          const key = `${it.yearOffset}-${it.groupIndex}`;
          const lv = Number(it.level || 0);
          if (lv >= 1 && lv <= 20) levelMap[key] = lv;
        }
        setThinkingLevelSelection(levelMap);

        // Subject selections
        const subjMap: Record<string, string> = {};
        const subjArr: Array<{ yearOffset: number; groupIndex: number; value: string }> = Array.isArray(extras?.subjectGroups) ? extras.subjectGroups : [];
        for (const it of subjArr) {
          const key = `${it.yearOffset}-${it.groupIndex}`;
          const val = String(it.value || '').trim();
          if (val) subjMap[key] = val;
        }
        setSubjectSelection(subjMap);
      }
    } catch (error) {
      console.error('Error fetching roadmap:', error);
    } finally {
      setRoadmapLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      // Reset selections when student changes
      setThinkingTypeSelection({});
      setThinkingLevelSelection({});
      setSubjectSelection({});
      fetchRoadmap(years);
    }
  }, [selectedStudentId]);

  const handleSave = async () => {
    if (!selectedStudentId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const prevExtras = (roadmap?.extras || {}) as any;

      const thinkingTypes: Array<{ yearOffset: number; groupIndex: number; type: 'WMO' | 'GT' | 'GTA' }> = [];
      Object.entries(thinkingTypeSelection).forEach(([key, type]) => {
        const [yo, gi] = key.split('-').map(Number);
        if (Number.isFinite(yo) && Number.isFinite(gi)) {
          thinkingTypes.push({ yearOffset: yo, groupIndex: gi, type });
        }
      });

      const thinkingLevels: Array<{ yearOffset: number; groupIndex: number; level: number }> = [];
      Object.entries(thinkingLevelSelection).forEach(([key, level]) => {
        const [yo, gi] = key.split('-').map(Number);
        if (Number.isFinite(yo) && Number.isFinite(gi)) {
          thinkingLevels.push({ yearOffset: yo, groupIndex: gi, level: Math.min(20, Math.max(1, Number(level))) });
        }
      });

      const resp = await fetch(`/api/nimda/students/${selectedStudentId}/roadmap`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          base: {
            startAcademicYear,
            startGrade,
            gradePromotionMonth: 3,
          },
          extras: {
            ...(prevExtras?.gifted ? { gifted: prevExtras.gifted } : {}),
            ...(prevExtras?.contests ? { contests: prevExtras.contests } : {}),
            thinkingTypes,
            thinkingLevels,
            subjectGroups: Object.entries(subjectSelection).map(([key, value]) => {
              const [yo, gi] = key.split('-').map(Number);
              return { yearOffset: yo, groupIndex: gi, value };
            }),
          },
        }),
      });
      if (resp.ok) {
        await fetchRoadmap(years);
        setSavedAt(Date.now());
      }
    } finally {
      setSaving(false);
    }
  };

  // Get students for selected class
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentsInClass = selectedClass?.students || [];
  const filteredStudents = studentsInClass.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const selectedStudent = studentsInClass.find(s => s.id === selectedStudentId);

  return (
    <AdminLayout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-title">로드맵 관리</h1>
          <p className="text-sm text-muted mt-1">학생별 학습 로드맵을 관리합니다</p>
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
                      onClick={() => setSelectedStudentId(student.id)}
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

          {/* Right: Roadmap Content */}
          <div className="flex-1 min-w-0">
            {!selectedStudentId ? (
              <div className="bg-card rounded-lg shadow-sm border border-default p-12 text-center">
                <div className="text-muted">학생을 선택하세요</div>
              </div>
            ) : roadmapLoading ? (
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
                  </div>
                  <div className="flex items-center gap-3">
                    {savedAt && <span className="text-xs text-green-600">저장됨</span>}
                    <button
                      className={`px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 ${saving ? 'opacity-60' : ''}`}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>

                {/* Roadmap Controls */}
                <div className="flex flex-wrap items-end gap-4 mb-6 pb-4 border-b border-default">
                  <div>
                    <label className="block text-sm text-muted mb-1">시작 연도</label>
                    <input
                      type="number"
                      className="w-28 px-3 py-2 border border-default rounded-md bg-card text-title"
                      value={startAcademicYear}
                      onChange={e => setStartAcademicYear(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">시작 학년</label>
                    <input
                      type="number"
                      className="w-28 px-3 py-2 border border-default rounded-md bg-card text-title"
                      value={startGrade}
                      onChange={e => setStartGrade(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">표시 연수</label>
                    <select
                      className="w-28 px-3 py-2 border border-default rounded-md bg-card text-title"
                      value={years}
                      onChange={e => fetchRoadmap(Number(e.target.value))}
                    >
                      <option value={1}>1년</option>
                      <option value={2}>2년</option>
                      <option value={3}>3년</option>
                      <option value={4}>4년</option>
                    </select>
                  </div>

                  {/* Row toggles */}
                  <div className="flex flex-wrap gap-2 ml-auto">
                    {[
                      { key: 'subject', label: '교과' },
                      { key: 'thinking', label: '사고력' },
                      { key: 'gifted', label: '영재원' },
                      { key: 'contest', label: '경시대회' },
                      { key: 'arithmetic', label: '연산' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        className={`px-3 py-1.5 text-sm rounded-md border ${
                          visibleRows[key as keyof typeof visibleRows]
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-default text-title'
                        }`}
                        onClick={() => setVisibleRows(v => ({ ...v, [key]: !v[key as keyof typeof v] }))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roadmap Grid */}
                {roadmap ? (
                  <RoadmapGrid
                    blocks={roadmap.blocks || []}
                    editableThinking
                    thinkingTypeSelection={thinkingTypeSelection}
                    thinkingLevelSelection={thinkingLevelSelection}
                    visibleRows={visibleRows}
                    subjectSelection={subjectSelection}
                    onThinkingTypeToggle={(key) => {
                      const [bi, gi] = key.split('-').map(Number);
                      if (!Number.isFinite(bi) || !Number.isFinite(gi)) return;
                      const nextType = (cur: 'WMO' | 'GT' | 'GTA') => (cur === 'WMO' ? 'GT' : cur === 'GT' ? 'GTA' : 'WMO');
                      const cur = thinkingTypeSelection[key] || 'WMO';
                      const nv = nextType(cur);
                      setThinkingTypeSelection((prev) => {
                        const updated = { ...prev };
                        const totalYears = (roadmap?.blocks || []).length;
                        for (let y = bi; y < totalYears; y++) {
                          const maxGroup = 4;
                          for (let g = (y === bi ? gi : 0); g < maxGroup; g++) {
                            updated[`${y}-${g}`] = nv;
                          }
                        }
                        return updated;
                      });
                    }}
                    onThinkingLevelToggle={(key) => {
                      const [bi, gi] = key.split('-').map(Number);
                      if (!Number.isFinite(bi) || !Number.isFinite(gi)) return;
                      const cur = thinkingLevelSelection[key] || 1;
                      const start = cur >= 20 ? 1 : cur + 1;
                      setThinkingLevelSelection((prev) => {
                        const updated = { ...prev };
                        const totalYears = (roadmap?.blocks || []).length;
                        let seq = 0;
                        for (let y = bi; y < totalYears; y++) {
                          const maxGroup = 4;
                          for (let g = (y === bi ? gi : 0); g < maxGroup; g++) {
                            const lv = Math.min(20, start + seq);
                            updated[`${y}-${g}`] = lv;
                            seq++;
                          }
                        }
                        return updated;
                      });
                    }}
                    onSubjectToggle={(key) => {
                      const [bi, gi] = key.split('-').map(Number);
                      if (!Number.isFinite(bi) || !Number.isFinite(gi)) return;
                      setSubjectSelection((prev) => {
                        const blocksArr = (roadmap?.blocks || []) as Array<{ months: Array<{ labels: { subject?: string } }> }>;
                        const groupDefault = (() => {
                          const months = blocksArr[bi]?.months || [];
                          const label = months[gi * 3]?.labels?.subject || '';
                          return label;
                        })();
                        const curVal = (prev[key] || groupDefault || '').trim();
                        const curIdx = Math.max(0, SUBJECT_CYCLE.indexOf(curVal as any));
                        const nextStartIdx = (curIdx + 1) % SUBJECT_CYCLE.length;
                        const totalYears = blocksArr.length;
                        const updated: Record<string, string> = { ...prev };
                        let idx = nextStartIdx;
                        for (let y = bi; y < totalYears; y++) {
                          const maxGroup = 4;
                          for (let g = (y === bi ? gi : 0); g < maxGroup; g++) {
                            const k = `${y}-${g}`;
                            const val = SUBJECT_CYCLE[Math.min(idx, SUBJECT_CYCLE.length - 1)];
                            updated[k] = val as string;
                            if (val === '고등') {
                              idx = SUBJECT_CYCLE.length - 1;
                            } else {
                              idx = Math.min(idx + 1, SUBJECT_CYCLE.length - 1);
                            }
                          }
                        }
                        return updated;
                      });
                    }}
                  />
                ) : (
                  <div className="text-center py-12 text-muted">로드맵 데이터를 불러오지 못했습니다.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
