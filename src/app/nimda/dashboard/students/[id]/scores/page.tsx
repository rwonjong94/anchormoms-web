'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import StudentInfoSection from '@/components/admin/StudentInfoSection';

interface Attempt {
  id: string;
  score: number | null;
  submittedAt?: string | null;
  exam?: {
    id: string;
    course?: string | null;
    title?: string | null;
    examnum?: number | null;
    memo?: string | null;
  };
}

interface Student {
  id: string;
  name: string;
  grade: number;
  school?: string;
}

export default function StudentScoresPage() {
  const params = useParams();
  const studentId = String(params?.id || '');

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [examAverages, setExamAverages] = useState<Record<string, number>>({});
  const examMetaCacheRef = useRef<Map<string, { course?: string | null; title?: string | null; examnum?: number | null }>>(new Map());

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const fetchStudent = async () => {
      const resp = await fetch(`/api/nimda/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setStudent({ id: data.id, name: data.name, grade: data.grade, school: data.school });
      }
    };
    const fetchAttempts = async () => {
      // 수동 성적만 집계 API로 조회
      const manualResp = await fetch('/api/nimda/scores/students/list-with-meta', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: [studentId] }),
      });
      if (!manualResp.ok) {
        setAttempts([]);
        return;
      }
      const manualRows = await manualResp.json();
      const manualMapped: Attempt[] = (manualRows || []).map((row: any) => ({
        id: row.id,
        score: typeof row.score === 'number' ? row.score : Number(row.score ?? 0),
        submittedAt: row.takenAt || null,
        exam: {
          id: row?.exam?.id || `manual:${row.id}`,
          course: row?.exam?.course ?? null,
          title: row?.exam?.title ?? null,
          examnum: row?.exam?.examnum ?? null,
          memo: typeof row.memo === 'string' ? row.memo : null,
        },
      })).sort((a: any, b: any) => {
        const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return tb - ta;
      });
      setAttempts(manualMapped);
      // 최근 5개 평균 점수 조회
      const recent5 = manualMapped.slice(0, 5);
      const uniqExamIds = Array.from(new Set(recent5.map(a => a.exam?.id).filter(Boolean))) as string[];
      const headers = { 'Authorization': `Bearer ${token}` };
      const results: Record<string, number> = {};
      for (let i = 0; i < uniqExamIds.length; i += 2) {
        const slice = uniqExamIds.slice(i, i + 2);
        const settled = await Promise.allSettled(
          slice.map(async (eid) => {
            const r = await fetch(`/api/nimda/exams/${eid}/stats`, { headers });
            if (!r.ok) return { id: eid, avg: NaN };
            const j = await r.json().catch(() => ({}));
            return { id: eid, avg: typeof j?.average === 'number' ? j.average : NaN };
          })
        );
        for (const s of settled) {
          if (s.status === 'fulfilled') {
            const { id, avg } = s.value;
            if (Number.isFinite(avg)) results[id] = avg;
          }
        }
      }
      setExamAverages(results);
    };
    if (studentId) {
      setLoading(true);
      Promise.all([fetchStudent(), fetchAttempts()]).finally(() => setLoading(false));
    }
  }, [studentId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {student && <StudentInfoSection student={student} currentPage="scores" />}

      <div className="bg-card rounded-lg shadow p-6 mt-6">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <h2 className="text-lg font-semibold text-title">성적 관리</h2>
        </div>
        {loading ? (
          <div className="animate-pulse h-48 bg-muted rounded" />
        ) : (
          <>
            <ScoreLineChart
              data={attempts.slice(0, 10).reverse().map(a => ({
                examId: a.exam?.id || '',
                label: (a.exam?.title || `#${String(a.exam?.examnum ?? '').padStart(3, '0')}`).slice(0, 12),
                student: typeof a.score === 'number' ? a.score : null,
                average: a.exam?.id ? (Number.isFinite(examAverages[a.exam.id]) ? examAverages[a.exam.id] : null) : null,
              }))}
            />
            <div className="bg-card border border-default rounded mt-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-default">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">과정</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">시험 이름</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">학생 점수</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">평균 점수</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">메모</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-default">
                    {attempts.map((a) => (
                      <tr key={a.id} className="hover:bg-hover">
                        <td className="px-4 py-3 text-sm text-title">{a.exam?.course ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-body">{a.exam?.title ?? (a.exam?.examnum != null ? `#${String(a.exam?.examnum).padStart(3, '0')}` : '무제')}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{a.score ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-body">
                          {a.exam?.id && Number.isFinite(examAverages[a.exam.id]) ? Math.round(examAverages[a.exam.id] * 10) / 10 : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-body">
                          {(() => {
                            const raw = a.exam?.memo || '';
                            // 기술 태그([exam:...], [course:...]) 제거
                            const cleaned = raw.replace(/\[(?:exam|course):[^\]]+\]/gi, '').trim();
                            return cleaned ? <span title={cleaned}>{cleaned.slice(0, 50)}{cleaned.length > 50 ? '…' : ''}</span> : '-';
                          })()}
                        </td>
                      </tr>
                    ))}
                    {attempts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">성적 기록이 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreLineChart({
  data,
}: {
  data: Array<{ examId: string; label: string; student: number | null; average: number | null }>;
}) {
  const width = 800;
  const height = 220;
  const padding = { top: 16, right: 24, bottom: 32, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const xs = data.map((_, i) => i);
  const ys = data.flatMap(d => [d.student ?? null, d.average ?? null]).filter((v): v is number => typeof v === 'number');
  const yMin = 0;
  const yMax = 100; // 고정 범위 0~100
  const xScale = (i: number) => padding.left + (xs.length <= 1 ? innerW / 2 : (i * innerW) / (xs.length - 1));
  const yScale = (v: number) => padding.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const pathFrom = (values: Array<number | null>) => {
    const points = values.map((v, i) => (v == null ? null : [xScale(i), yScale(v)] as const));
    let d = '';
    points.forEach((pt) => {
      if (!pt) return;
      d += d ? ` L ${pt[0]} ${pt[1]}` : `M ${pt[0]} ${pt[1]}`;
    });
    return d;
  };
  const studentPath = pathFrom(data.map(d => d.student));
  const avgPath = pathFrom(data.map(d => d.average));
  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="block">
        <line x1={padding.left} y1={padding.top + innerH} x2={padding.left + innerW} y2={padding.top + innerH} stroke="#ddd" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerH} stroke="#ddd" />
        {Array.from({ length: 6 }).map((_, i) => {
          const yVal = yMin + ((yMax - yMin) / 5) * i;
          const y = yScale(yVal);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={padding.left + innerW} y2={y} stroke="#f2f2f2" />
              <text x={padding.left - 8} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="#666">
                {Math.round(yVal)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => (
          <text key={i} x={xScale(i)} y={padding.top + innerH + 16} textAnchor="middle" alignmentBaseline="hanging" fontSize="10" fill="#666">
            {d.label}
          </text>
        ))}
        {avgPath && <path d={avgPath} fill="none" stroke="#94a3b8" strokeWidth={2} />}
        {studentPath && <path d={studentPath} fill="none" stroke="#2563eb" strokeWidth={2} />}
        <g>
          <rect x={width - 170} y={8} width={160} height={20} fill="white" opacity="0.8" />
          <circle cx={width - 155} cy={18} r={3} fill="#2563eb" />
          <text x={width - 147} y={18} alignmentBaseline="middle" fontSize="11" fill="#2563eb">학생 점수</text>
          <circle cx={width - 85} cy={18} r={3} fill="#94a3b8" />
          <text x={width - 77} y={18} alignmentBaseline="middle" fontSize="11" fill="#94a3b8">평균 점수</text>
        </g>
      </svg>
    </div>
  );
}

