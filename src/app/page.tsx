'use client';

import { useState, useEffect } from 'react';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
const ContestList = dynamic(() => import('@/components/ContestList'), { ssr: false });
const ContestNotificationBanner = dynamic(() => import('@/components/ContestNotificationBanner'), { ssr: false });
import { CONTESTS, getUrgentContests } from '@/data/contests';
import { PageContainer, Card } from '@/components/ui';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useAuth();
  
  // 경시대회 데이터
  const urgentContests = getUrgentContests(CONTESTS);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <PageContainer maxWidth="xl">
      {/* 로그인하지 않은 사용자를 위한 회원가입 섹션 */}
      {!isAuthenticated && (
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold mb-2">Google로 회원가입</h1>
            <p className="text-white/90 mb-6">한 번의 클릭으로 시작하세요.</p>
            <div className="max-w-sm mx-auto">
              <GoogleAuthButton type="signup" />
            </div>
          </div>
        </Card>
      )}

      {/* 긴급 공지 배너 */}
      <ContestNotificationBanner urgentContests={urgentContests} />

      {/* 경시대회 섹션 */}
      <section className="mb-8">
        <ContestList 
          contests={CONTESTS} 
          title="📅 주요 경시대회 일정"
          maxItems={3}
        />
      </section>

      {/* 카카오톡 채널 연결 섹션 */}
      <section className="mb-8">
        <Card className="border-default">
          <div className="text-center py-6">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mb-3">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.48 2 11c0 2.5 1.2 4.75 3.08 6.22L4.5 21l3.78-1.08C9.75 20.8 12 22 14.5 22c5.52 0 10-3.48 10-8S17.52 3 12 3z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-title mb-2">카카오톡 채널 문의</h2>
              <p className="text-body mb-4">궁금한 점이 있으시면 언제든지 문의해주세요!</p>
            </div>
            <a 
              href="https://pf.kakao.com/_smLyC" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.48 2 11c0 2.5 1.2 4.75 3.08 6.22L4.5 21l3.78-1.08C9.75 20.8 12 22 14.5 22c5.52 0 10-3.48 10-8S17.52 3 12 3z"/>
              </svg>
              카카오톡 채널 연결하기
            </a>
          </div>
        </Card>
      </section>

      </PageContainer>
  );
}