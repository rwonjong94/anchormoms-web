'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageContainer, Card } from '@/components/ui';
import { mapSeongdae, formatRoundKey } from '@/lib/answersUtils';
import WithSidebar from '@/components/layouts/WithSidebar';
import AnswersSidebar from '@/components/sidebars/AnswersSidebar';

export default function SeongdaeAnswersPage() {
  const grades = useMemo(() => [1, 2, 3, 4, 5, 6], []);
  const seasons = useMemo(
    () => [
      { key: 'early' as const, label: '전기' },
      { key: 'late' as const, label: '후기' },
    ],
    []
  );

  const [grade, setGrade] = useState<number>(2);
  const [season, setSeason] = useState<'early' | 'late'>('early');
  const [rounds, setRounds] = useState<Record<string, Array<string | number>>>({});
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) API 우선 시도
        const apiRes = await fetch(`/api/answers/seongdae?season=${season}&grade=${grade}`, { cache: 'no-store' });
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (aborted) return;
          const apiRounds = data.rounds || {};
          const apiKeys = Object.keys(apiRounds);
          if (apiKeys.length > 0) {
            setRounds(apiRounds);
            setSelectedRound((prev) => (apiKeys.includes(prev) ? prev : apiKeys[0] || ''));
            return;
          }
          // api 응답은 성공이지만 내용이 비어있는 경우 → 폴백 시도
        }

        // 2) API 실패(예: 404) 또는 빈 응답 시 public JSON 폴백
        const { smcSeasonNum, elem } = mapSeongdae(season as any, grade);
        const jsonRes = await fetch('/answers/smc_answers.json', { cache: 'no-store' });
        if (!jsonRes.ok) throw new Error(`HTTP ${jsonRes.status}`);
        const json = (await jsonRes.json()) as Record<string, Array<string | number>>;
        if (aborted) return;
        const mapped: Record<string, Array<string | number>> = {};
        for (let r = 29; r <= 48; r++) {
          const rk = formatRoundKey(r);
          const key = `smc${smcSeasonNum}_${elem}_${r}`;
          if (json[key]) mapped[rk] = json[key];
        }
        setRounds(mapped);
        const keys = Object.keys(mapped);
        setSelectedRound((prev) => (keys.includes(prev) ? prev : keys[0] || ''));
      } catch (e: any) {
        if (!aborted) setError(e?.message || '로드 실패');
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [grade, season]);

  const answers = rounds[selectedRound] || [];

  const fallbackRoundKeys = useMemo(() => {
    // 전기: 29..47 홀수, 후기: 30..48 짝수
    const keys: string[] = [];
    for (let r = 29; r <= 48; r++) {
      const isEarly = season === 'early';
      if ((isEarly && r % 2 === 1) || (!isEarly && r % 2 === 0)) {
        keys.push(String(r).padStart(3, '0'));
      }
    }
    return keys;
  }, [season]);

  return (
    <PageContainer maxWidth="xl">
      <WithSidebar sidebar={<AnswersSidebar />}> 
        <div className="space-y-6">
          {/* 학년/시즌 선택 - KMC와 동일한 레이아웃 */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-title mb-3">학년 선택</h2>
              <div className="flex flex-wrap gap-2">
                {grades.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`px-3 py-1.5 rounded-md text-sm border ${g === grade ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-title' : 'border-default text-body hover:bg-hover'}`}
                  >
                    초등{g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-title mb-3">시즌 선택</h2>
              <div className="flex flex-wrap gap-2">
                {seasons.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSeason(s.key)}
                    className={`px-3 py-1.5 rounded-md text-sm border ${s.key === season ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-title' : 'border-default text-body hover:bg-hover'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-title mb-3">회차 선택</h2>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(rounds).length > 0 ? Object.keys(rounds) : fallbackRoundKeys).map((rk) => (
                  <button
                    key={rk}
                    onClick={() => setSelectedRound(rk)}
                    className={`px-3 py-1.5 rounded-md text-sm border ${rk === selectedRound ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-title' : 'border-default text-body hover:bg-hover'}`}
                  >
                    {rk}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* 정답 표시 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-title">선택한 정답 (초등{grade} {season === 'early' ? '전기' : '후기'} · {selectedRound || '-'})</h2>
            </div>
            {loading && <div className="text-sm text-muted">불러오는 중...</div>}
            {error && <div className="text-sm text-red-600">오류: {error}</div>}
            {!loading && !error && (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: Math.ceil(answers.length / 5) }, (_, bi) => {
                  const block = answers.slice(bi * 5, bi * 5 + 5);
                  const startNum = bi * 5 + 1;
                  return (
                    <div key={`block-${bi}`} className="overflow-x-auto">
                      <table className="min-w-[280px] w-full border border-default text-sm">
                        <thead className="bg-hover">
                          <tr>
                            <th className="w-16 px-3 py-2 border-b border-default text-center text-title">번호</th>
                            <th className="px-3 py-2 border-b border-default text-center text-title">정답</th>
                          </tr>
                        </thead>
                        <tbody>
                          {block.map((ans, idx) => (
                            <tr key={`row-${bi}-${idx}`} className="odd:bg-card even:bg-background">
                              <td className="px-3 py-2 border-b border-default text-center text-muted">{startNum + idx}</td>
                              <td className="px-3 py-2 border-b border-default text-center text-body">{String(ans)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </WithSidebar>
    </PageContainer>
  );
}


