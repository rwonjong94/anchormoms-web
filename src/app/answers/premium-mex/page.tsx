'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { mapPremiumMexDomain } from '@/lib/answersUtils';
import { useSearchParams, useRouter } from 'next/navigation';
import WithSidebar from '@/components/layouts/WithSidebar';
import AnswersSidebar from '@/components/sidebars/AnswersSidebar';
import { PageContainer, Card } from '@/components/ui';
import Link from 'next/link';

type DomainKey = 'arithmetic' | 'geometry' | 'pattern-data-prob';

function PremiumMexContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const domain = (searchParams.get('domain') || 'arithmetic') as DomainKey;
  const grade = Number(searchParams.get('grade') || '1');

  const grades = useMemo(() => [1, 2, 3, 4, 5, 6], []);
  const domains = useMemo(() => [
    { key: 'arithmetic' as DomainKey, label: '수와 연산' },
    { key: 'geometry' as DomainKey, label: '도형과 측정' },
    { key: 'pattern-data-prob' as DomainKey, label: '규칙성과 자료와가능성' },
  ], []);

  const setParam = (key: string, value: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set(key, value);
    router.push(`/answers/premium-mex?${sp.toString()}`);
  };

  const [answers, setAnswers] = useState<Array<string | number>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/answers/premium-mex?grade=${grade}&domain=${domain}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!aborted) {
            const apiAnswers = data.answers || [];
            if (apiAnswers.length > 0) {
              setAnswers(apiAnswers);
              return;
            }
            // API 200이지만 빈 응답 → 정적 JSON 폴백 시도
          }
        }

        // 정적 JSON 직접 폴백 (/public/answers/mex.json)
        const domainKey = mapPremiumMexDomain(domain);
        const jsonRes = await fetch('/answers/mex.json', { cache: 'no-store' });
        if (!jsonRes.ok) throw new Error(`HTTP ${jsonRes.status}`);
        const json = (await jsonRes.json()) as Record<string, Array<string | number>>;
        if (aborted) return;
        const key = `mex_elem${grade}_${domainKey}`;
        setAnswers(json[key] || []);
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
  }, [grade, domain]);

  return (
    <PageContainer maxWidth="xl">
      <WithSidebar sidebar={<AnswersSidebar />}>
        <div className="space-y-6">
          <h1 className="text-heading-3 text-title">premium mex 답지</h1>
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
              <h2 className="text-lg font-semibold text-title mb-3">영역 선택</h2>
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setParam('domain', d.key)}
                    className={`px-3 py-1.5 rounded-md text-sm border ${d.key === domain ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-title' : 'border-default text-body hover:bg-hover'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-default">
              {loading && <div className="text-sm text-muted">불러오는 중...</div>}
              {error && <div className="text-sm text-red-600">오류: {error}</div>}
              {!loading && !error && (
                <div>
                  <h3 className="text-base font-semibold text-title mb-2">정답</h3>
                  {answers.length === 0 ? (
                    <div className="text-sm text-muted">데이터가 없습니다.</div>
                  ) : (
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

export default function PremiumMexAnswersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PremiumMexContent />
    </Suspense>
  );
}


