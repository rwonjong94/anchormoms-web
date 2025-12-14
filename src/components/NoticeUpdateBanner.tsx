'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Notice {
  id: string;
  type: 'release' | 'event';
  title: string;
  content: string;
  date: string;
  isNew: boolean;
  link?: string;
}

export default function NoticeUpdateBanner() {
  const [notices] = useState<Notice[]>([
    {
      id: '1',
      type: 'release',
      title: '모고 플랫폼 v2.0 업데이트',
      content: '새로운 AI 분석 리포트와 개선된 사용자 인터페이스가 추가되었습니다.',
      date: '2024-01-15',
      isNew: true,
      link: undefined
    },
    {
      id: '2',
      type: 'event',
      title: '신규 회원 특별 이벤트',
      content: '1월 신규 가입자 대상 3개월 무료 체험 이벤트를 진행합니다.',
      date: '2024-01-10',
      isNew: true,
      link: undefined
    },
    {
      id: '3',
      type: 'release',
      title: '모바일 앱 출시 예정',
      content: '더 편리한 모의고사 응시를 위한 모바일 앱이 곧 출시될 예정입니다.',
      date: '2024-01-05',
      isNew: false,
      link: undefined
    }
  ]);

  const getTypeLabel = (type: Notice['type']) => {
    return type === 'release' ? '업데이트' : '이벤트';
  };

  const getTypeColor = (type: Notice['type']) => {
    return type === 'release' 
      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
      : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}.${day}`;
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-default overflow-hidden">
      <div className="bg-muted px-6 py-4 border-b border-default">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-title flex items-center space-x-2">
            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <span>공지 · 업데이트</span>
          </h2>
          <span className="text-sm text-muted cursor-not-allowed">
            전체보기 →
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {notices.map((notice) => (
          <div key={notice.id} className="p-4 hover:bg-muted dark:hover:bg-hover transition-colors group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(notice.type)}`}>
                    {getTypeLabel(notice.type)}
                  </span>
                  {notice.isNew && (
                    <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 animate-pulse">
                      NEW
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    {formatDate(notice.date)}
                  </span>
                </div>
                
                <h3 className="font-medium text-title mb-1 line-clamp-1 group-hover:text-title">
                  {notice.title}
                </h3>
                
                <p className="text-sm text-body line-clamp-2 group-hover:text-body">
                  {notice.content}
                </p>
              </div>
              
              {notice.link && (
                <Link 
                  href={notice.link}
                  prefetch={false}
                  className="ml-4 text-primary hover:text-primary-hover transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 