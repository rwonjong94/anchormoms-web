'use client';

import Link from 'next/link';
import { Card, Button } from '@/components/ui';

import { usePathname } from 'next/navigation';

export default function AnswersSidebar() {
  const pathname = usePathname();
  return (
    <Card className="!bg-white">
      <nav className="flex flex-col gap-1.5 py-1">
        <Link href="/answers" className="group">
          <Button variant="secondary" size="sm" className={`w-full justify-start border border-input text-body hover:bg-hover !bg-white ${pathname === '/answers' ? 'ring-2 ring-blue-500' : ''}`}>
            답지 홈
          </Button>
        </Link>
        <Link href="/answers/seongdae" className="group">
          <Button variant="secondary" size="sm" className={`w-full justify-start border border-input text-body hover:bg-hover !bg-white ${pathname.startsWith('/answers/seongdae') ? 'ring-2 ring-blue-500' : ''}`}>
            성대경시
          </Button>
        </Link>
        <Link href="/answers/kmc" className="group">
          <Button variant="secondary" size="sm" className={`w-full justify-start border border-input text-body hover:bg-hover !bg-white ${pathname.startsWith('/answers/kmc') ? 'ring-2 ring-blue-500' : ''}`}>
            KMC
          </Button>
        </Link>
        <Link href="/answers/premium-mex">
          <Button variant="secondary" size="sm" className={`w-full justify-start border border-input text-body hover:bg-hover !bg-white ${pathname.startsWith('/answers/premium-mex') ? 'ring-2 ring-blue-500' : ''}`}>
            premium mex
          </Button>
        </Link>
        <Link href="/answers/core-more">
          <Button variant="secondary" size="sm" className={`w-full justify-start border border-input text-body hover:bg-hover !bg-white ${pathname.startsWith('/answers/core-more') ? 'ring-2 ring-blue-500' : ''}`}>
            경시 CORE/MORE
          </Button>
        </Link>
      </nav>
    </Card>
  );
}


