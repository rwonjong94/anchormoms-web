'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function QBankLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6 border-b border-default">
          <ul className="flex -mb-px">
            <li>
              <Link href="/qbank/register" className={`inline-block px-4 py-3 border-b-2 ${pathname.includes('/qbank/register') ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted hover:text-body'}`}>문제집 등록</Link>
            </li>
            <li>
              <Link href="/qbank/chapters" className={`inline-block px-4 py-3 border-b-2 ${pathname.includes('/qbank/chapters') ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted hover:text-body'}`}>단원 등록</Link>
            </li>
            <li>
              <Link href="/qbank/extract" className={`inline-block px-4 py-3 border-b-2 ${pathname.includes('/qbank/extract') ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted hover:text-body'}`}>문제 추출</Link>
            </li>
            <li>
              <Link href="/qbank/viewer" className={`inline-block px-4 py-3 border-b-2 ${pathname.includes('/qbank/viewer') ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted hover:text-body'}`}>문제 뷰어</Link>
            </li>
            <li>
              <Link href="/qbank/arithmetic-generator" className={`inline-block px-4 py-3 border-b-2 ${pathname.includes('/qbank/arithmetic-generator') ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted hover:text-body'}`}>연산 문제 생성</Link>
            </li>
          </ul>
        </nav>
        {children}
      </div>
    </div>
  );
}


