'use client';

import Link from 'next/link';
import { Card, Button } from '@/components/ui';

export default function StoreSidebar() {
  return (
    <Card>
      <div className="space-y-2">
        <Link href="/store">
          <Button variant="secondary" size="sm" className="w-full justify-start">전체 자료</Button>
        </Link>
        <Link href="/store?category=workbook">
          <Button variant="secondary" size="sm" className="w-full justify-start">문제집</Button>
        </Link>
        <Link href="/store?category=exam">
          <Button variant="secondary" size="sm" className="w-full justify-start">모의고사</Button>
        </Link>
      </div>
    </Card>
  );
}


