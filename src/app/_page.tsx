'use client';

import { useState, useEffect } from 'react';
import DDayTimer from '@/components/DDayTimer';
import ExamTakerCounter from '@/components/ExamTakerCounter';
import QuickStartGuide from '@/components/QuickStartGuide';
import NoticeUpdateBanner from '@/components/NoticeUpdateBanner';
import ImprovedFAQ from '@/components/ImprovedFAQ';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page">
      {/* 메인 컨테이너 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* 1. D-day 타이머 (알림 신청 버튼 포함) */}
        <section>
          <DDayTimer />
        </section>

        {/* 2. 실시간 누적 응시자 수 */}
        <section className="max-w-md mx-auto">
          <ExamTakerCounter />
        </section>

        {/* 3. 빠른 시험 시작 가이드 */}
        <section>
          <QuickStartGuide />
        </section>

        {/* 4. 공지/업데이트 배너 */}
        <section>
          <NoticeUpdateBanner />
        </section>

        {/* 5. 자주 묻는 질문들 (FAQ) */}
        <section>
          <ImprovedFAQ />
        </section>
      </div>
    </div>
  );
}
