'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

export type MyPageSection =
  | '수업 일지'
  | '학부모 상담 기록'
  | '학생 시험 기록'
  | '학생 연산 기록'
  | '기본 정보 설정';

interface MyPageSidebarProps {
  active?: MyPageSection;
}

const sections: MyPageSection[] = [
  '수업 일지',
  '학부모 상담 기록',
  '학생 시험 기록',
  '학생 연산 기록',
  '기본 정보 설정',
];

export default function MyPageSidebar({ active }: MyPageSidebarProps) {
  const router = useRouter();

  const handleClick = (section: MyPageSection) => {
    if (section === '수업 일지') router.push('/mypage/class-log');
    else if (section === '학부모 상담 기록') router.push('/mypage/parent-counseling');
    else if (section === '학생 시험 기록') router.push('/mypage/student-exams');
    else if (section === '학생 연산 기록') router.push('/mypage/student-arithmetic');
    else if (section === '기본 정보 설정') router.push('/mypage/settings');
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-default p-4 sticky top-8">
      <nav className="space-y-2">
        {sections.map((section) => {
          const isActive = active === section;
          return (
            <button
              key={section}
              onClick={() => handleClick(section)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-body hover:bg-muted dark:hover:bg-hover'
              }`}
            >
              {section}
            </button>
          );
        })}
      </nav>
    </div>
  );
}


