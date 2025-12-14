'use client';

import Link from 'next/link';
import { Card, Button } from '@/components/ui';

export default function ExamSidebar() {
  return (
    <Card>
      <div className="space-y-2">
        <Link href="/exam">
          <Button variant="secondary" size="sm" className="w-full justify-start">전체 목록</Button>
        </Link>
      </div>
    </Card>
  );
}


