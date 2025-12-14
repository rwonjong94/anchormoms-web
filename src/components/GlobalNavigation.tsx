'use client';

import { usePathname } from 'next/navigation';
import NavigationBar from '@/components/NavigationBar';

export default function GlobalNavigation() {
  const pathname = usePathname();

  // 관리자 경로에서는 전역 네비게이션 바 숨김
  if (pathname.startsWith('/nimda')) {
    return null;
  }

  // 답지 전용 페이지에서는 네비게이션 바 숨김 (단순 페이지 요구)
  // if (pathname.startsWith('/answers')) {
  //   return null;
  // }

  return <NavigationBar />;
}








