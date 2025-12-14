'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StudentInfoSection from '@/components/admin/StudentInfoSection';
import RoadmapGrid from '@/components/admin/RoadmapGrid';

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

export default function StudentRoadmapPage() {
  const params = useParams();
  const studentId = String(params?.id || '');
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [years, setYears] = useState<number>(3);
  const [startAcademicYear, setStartAcademicYear] = useState<number>(new Date().getFullYear());
  const [startGrade, setStartGrade] = useState<number>(3);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [thinkingTypeSelection, setThinkingTypeSelection] = useState<Record<string, 'WMO' | 'GT' | 'GTA'>>({});
  const [thinkingLevelSelection, setThinkingLevelSelection] = useState<Record<string, number>>({});
  const [visibleRows, setVisibleRows] = useState<{ subject: boolean; thinking: boolean; gifted: boolean; contest: boolean; arithmetic: boolean }>({
    subject: true,
    thinking: true,
    gifted: true,
    contest: true,
    arithmetic: true,
  });
  const [subjectSelection, setSubjectSelection] = useState<Record<string, string>>({});
  const SUBJECT_CYCLE = [
    '초3-1','초3-2','초4-1','초4-2','초5-1','초5-2','초6-1','초6-2',
    '중1-1','중1-2','중2-1','중2-2','중3-1','중3-2','고등'
  ] as const;

  // 학생 정보
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const resp = await fetch(`/api/nimda/students/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setStudent(data);
          setStartGrade(Number(data?.grade ?? 3));
        }
      } finally {
        // no-op
      }
    };
    if (studentId) fetchStudent();
  }, [studentId]);

  // 로드맵 조회
  const fetchRoadmap = async (yrs = years) => {
    const token = localStorage.getItem('adminToken');
    const resp = await fetch(`/api/nimda/students/${studentId}/roadmap?years=${yrs}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (resp.ok) {
      const data = await resp.json();
      setRoadmap(data);
      setYears(yrs);
      setStartAcademicYear(Number(data?.base?.startAcademicYear ?? new Date().getFullYear()));
      setStartGrade(Number(data?.base?.startGrade ?? startGrade));
      // 초기 사고력 타입/레벨/교과 선택값
      const map: Record<string, 'WMO' | 'GT' | 'GTA'> = {};
      const extras = (data?.extras || {}) as any;
      const arr: Array<{ yearOffset: number; groupIndex: number; type: string }> = Array.isArray(extras?.thinkingTypes) ? extras.thinkingTypes : [];
      for (const it of arr) {
        const key = `${it.yearOffset}-${it.groupIndex}`;
        const t = String(it.type || 'WMO').toUpperCase();
        map[key] = (t === 'GT' || t === 'GTA' ? t : 'WMO') as 'WMO' | 'GT' | 'GTA';
      }
      setThinkingTypeSelection(map);
      const levelMap: Record<string, number> = {};
      const larr: Array<{ yearOffset: number; groupIndex: number; level: number }> = Array.isArray(extras?.thinkingLevels) ? extras.thinkingLevels : [];
      for (const it of larr) {
        const key = `${it.yearOffset}-${it.groupIndex}`;
        const lv = Number(it.level || 0);
        if (lv >= 1 && lv <= 20) levelMap[key] = lv;
      }
      setThinkingLevelSelection(levelMap);
      const subjMap: Record<string, string> = {};
      const sarr: Array<{ yearOffset: number; groupIndex: number; value: string }> = Array.isArray((data?.extras as any)?.subjectGroups) ? (data.extras as any).subjectGroups : [];
      for (const it of sarr) {
        const key = `${it.yearOffset}-${it.groupIndex}`;
        const val = String(it.value || '').trim();
        if (val) subjMap[key] = val;
      }
      setSubjectSelection(subjMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (studentId) fetchRoadmap(3);
  }, [studentId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const prevExtras = (roadmap?.extras || {}) as any;
      const thinkingTypes: Array<{ yearOffset: number; groupIndex: number; type: 'WMO' | 'GT' | 'GTA' }> = [];
      Object.entries(thinkingTypeSelection).forEach(([key, type]) => {
        const [yo, gi] = key.split('-').map((v) => Number(v));
        if (Number.isFinite(yo) && Number.isFinite(gi)) {
          thinkingTypes.push({ yearOffset: yo, groupIndex: gi, type });
        }
      });
      const thinkingLevels: Array<{ yearOffset: number; groupIndex: number; level: number }> = [];
      Object.entries(thinkingLevelSelection).forEach(([key, level]) => {
        const [yo, gi] = key.split('-').map((v) => Number(v));
        if (Number.isFinite(yo) && Number.isFinite(gi)) {
          thinkingLevels.push({ yearOffset: yo, groupIndex: gi, level: Math.min(20, Math.max(1, Number(level))) });
        }
      });
      const resp = await fetch(`/api/nimda/students/${studentId}/roadmap`, {
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
              const [yo, gi] = key.split('-').map((v) => Number(v));
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

  if (loading) {
    return <div className="animate-pulse h-40 bg-muted rounded" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {student && (
        <StudentInfoSection student={student} currentPage="roadmap" />
      )}

      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-title">학생 로드맵</h2>
          <div className="flex items-center gap-3">
            {savedAt && <span className="text-xs text-muted">저장됨</span>}
            <button
              className={`px-4 py-2 rounded bg-primary text-primary-foreground ${saving ? 'opacity-60' : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            {/* 빈 div: 좌측 정렬 유지용 */}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-title font-medium mb-1">시작 연도</label>
                <input type="number" className="w-32 px-3 py-2 border border-input rounded bg-card text-title"
                value={startAcademicYear} onChange={e => setStartAcademicYear(Number(e.target.value))} />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-title font-medium mb-1">시작 학년(숫자)</label>
                <input type="number" className="w-32 px-3 py-2 border border-input rounded bg-card text-title"
                value={startGrade} onChange={e => setStartGrade(Number(e.target.value))} />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-title font-medium mb-1">표시 연수</label>
                <select className="w-32 px-3 py-2 border border-input rounded bg-card text-title"
                value={years} onChange={e => fetchRoadmap(Number(e.target.value))}>
                  <option value={1}>1년</option>
                  <option value={2}>2년</option>
                  <option value={3}>3년</option>
                  <option value={4}>4년</option>
              </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-default pt-3">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm rounded border ${visibleRows.subject ? 'bg-primary text-white border-primary' : 'border-default'}`}
                onClick={() => setVisibleRows((v) => ({ ...v, subject: !v.subject }))}
              >
                교과
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm rounded border ${visibleRows.thinking ? 'bg-primary text-white border-primary' : 'border-default'}`}
                onClick={() => setVisibleRows((v) => ({ ...v, thinking: !v.thinking }))}
              >
                사고력
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm rounded border ${visibleRows.gifted ? 'bg-primary text-white border-primary' : 'border-default'}`}
                onClick={() => setVisibleRows((v) => ({ ...v, gifted: !v.gifted }))}
              >
                영재원
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm rounded border ${visibleRows.contest ? 'bg-primary text-white border-primary' : 'border-default'}`}
                onClick={() => setVisibleRows((v) => ({ ...v, contest: !v.contest }))}
              >
                경시대회
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm rounded border ${visibleRows.arithmetic ? 'bg-primary text-white border-primary' : 'border-default'}`}
                onClick={() => setVisibleRows((v) => ({ ...v, arithmetic: !v.arithmetic }))}
              >
                연산
              </button>
            </div>
          </div>
        </div>

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
                // 클릭 시 현재 다음 단계부터 시작 (순환: 마지막 다음은 0으로)
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
                      // 이후 칸들은 모두 '고등'으로 통일
                      idx = SUBJECT_CYCLE.length - 1;
                    } else {
                      // 이후 칸 진행: 여기서는 순환하지 않고 끝에 도달하면 '고등'으로 고정
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
    </div>
  );
}


