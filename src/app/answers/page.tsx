'use client';

import WithSidebar from '@/components/layouts/WithSidebar';
import AnswersSidebar from '@/components/sidebars/AnswersSidebar';
import { PageContainer, Card } from '@/components/ui';
import Link from 'next/link';
import { useMemo } from 'react';

type CategoryKey = 'seongdae' | 'kmc' | 'premium-mex' | 'core-more';

export default function AnswersRootPage() {
  const categories = useMemo(() => (
    [
      {
        key: 'seongdae' as CategoryKey,
        title: '성대경시',
        subtitles: ['전기', '후기'],
        grades: [1, 2, 3, 4, 5, 6],
        buildHref: (grade: number, subtitle: string) => `/answers/seongdae?season=${subtitle === '전기' ? 'early' : 'late'}&grade=${grade}`,
        buttonsForGrade: (grade: number) => [
          { label: '전기', href: `/answers/seongdae?season=early&grade=${grade}` },
          { label: '후기', href: `/answers/seongdae?season=late&grade=${grade}` },
        ],
      },
      {
        key: 'kmc' as CategoryKey,
        title: 'KMC',
        subtitles: ['전기', '후기'],
        grades: [3, 4, 5, 6],
        buttonsForGrade: (grade: number) => [
          { label: '전기', href: `/answers/kmc?season=early&grade=${grade}` },
          { label: '후기', href: `/answers/kmc?season=late&grade=${grade}` },
        ],
      },
      {
        key: 'premium-mex' as CategoryKey,
        title: 'premium mex',
        grades: [1, 2, 3, 4, 5, 6],
        buttonsForGrade: (grade: number) => [
          { label: '수와 연산', href: `/answers/premium-mex?domain=arithmetic&grade=${grade}` },
          { label: '도형과 측정', href: `/answers/premium-mex?domain=geometry&grade=${grade}` },
          { label: '규칙성과 자료와가능성', href: `/answers/premium-mex?domain=pattern-data-prob&grade=${grade}` },
        ],
      },
      {
        key: 'core-more' as CategoryKey,
        title: '경시 CORE/MORE',
        grades: [1, 2, 3, 4, 5, 6],
        buttonsForGrade: (grade: number) => [
          { label: 'CORE', href: `/answers/core-more?type=CORE&grade=${grade}` },
          { label: 'MORE', href: `/answers/core-more?type=MORE&grade=${grade}` },
        ],
      },
    ]
  ), []);

  return (
    <PageContainer maxWidth="xl">
      <WithSidebar sidebar={<AnswersSidebar />}>
        <div className="space-y-8">
          {categories.map((cat) => (
            <Card key={cat.key} className="p-6">
              <h2 className="text-lg font-semibold text-title mb-4">{cat.title}</h2>
              <div className="space-y-3">
                {cat.grades.map((grade) => (
                  <div key={grade} className="border border-default rounded-md p-3">
                    <div className="text-sm font-medium text-title mb-2">{grade}학년</div>
                    <div className="flex flex-col gap-2">
                      {cat.buttonsForGrade(grade).map((btn) => (
                        <Link key={btn.label} href={btn.href} className="w-full px-3 py-2 text-sm rounded-md border border-input bg-card text-body hover:bg-hover">
                          {btn.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </WithSidebar>
    </PageContainer>
  );
}


