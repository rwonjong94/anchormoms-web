'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import WithSidebar from '@/components/layouts/WithSidebar';
import AnswersSidebar from '@/components/sidebars/AnswersSidebar';
import { PageContainer, Card } from '@/components/ui';
import Link from 'next/link';

function KmcContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const season = (searchParams.get('season') || 'early') as 'early' | 'late';
  const grade = Number(searchParams.get('grade') || '3');

  const grades = useMemo(() => [3, 4, 5, 6], []);
  const seasons = useMemo(() => [
    { key: 'early', label: '전기' },
    { key: 'late', label: '후기' },
  ] as const, []);

  const setParam = (key: string, value: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set(key, value);
    router.push(`/answers/kmc?${sp.toString()}`);
  };

  const [answers, setAnswers] = useState<Array<string | number>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<string>('');

  const fallbackRoundKeys = useMemo(() => {
    // KMC 데이터 준비 전까지 01..10 회차 버튼 제공
    return Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'));
  }, []);

  useEffect(() => {
    // 현재는 성대경시 JSON(smc_answers.json)에 회차 데이터가 있으므로
    // KMC는 별도 소스가 준비되면 교체. 우선 season/grade를 유지해 빈 배열 노출.
    let aborted = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // placeholder: 데이터 준비 전까지 빈 배열 유지
        if (!aborted) setAnswers([]);
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

  return (
    <PageContainer maxWidth="xl">
      <WithSidebar sidebar={<AnswersSidebar />}>
        <div className="space-y-6">
          <h1 className="text-heading-3 text-title">KMC 답지</h1>
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-title mb-3">학년 선택</h2>
              <div className="flex flex-wrap gap-2">
                {grades.map((g) => (
                  <button
                    key={g}
                    onClick={() => setParam('grade', String(g))}
                    className={`px-3 py-1.5 rounded-md text-sm border ${g === grade ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-title' : 'border-default text-body hover:bg-hover'}`}
                  >
                    {g}학년
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
                    onClick={() => setParam('season', s.key)}
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
                {fallbackRoundKeys.map((rk) => (
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

            <div className="pt-4 border-t border-default">
              {loading && <div className="text-sm text-muted">불러오는 중...</div>}
              {error && <div className="text-sm text-red-600">오류: {error}</div>}
              {!loading && !error && (
                <div>
                  <h3 className="text-base font-semibold text-title mb-2">정답{selectedRound ? ` (회차 ${selectedRound})` : ''}</h3>
                  {answers.length === 0 ? (
                    <div className="text-sm text-muted">데이터가 없습니다.</div>
                  ) : (
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                      {answers.map((ans, idx) => (
                        <div key={idx} className="text-sm border border-input rounded-md p-2 text-center">
                          <div className="text-muted text-xs mb-1">{idx + 1}</div>
                          <div className="font-medium break-words">{String(ans)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <div>
            <Link href="/answers" className="text-sm text-primary hover:underline">← 답지 홈으로</Link>
          </div>
        </div>
      </WithSidebar>
    </PageContainer>
  );
}

export default function KmcAnswersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KmcContent />
    </Suspense>
  );
}


