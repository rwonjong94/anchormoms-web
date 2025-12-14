'use client';

import { Card, Button } from '@/components/ui';

export default function QuizSidebar() {
  return (
    <Card>
      <div className="space-y-2">
        <Button variant="secondary" size="sm" className="w-full justify-start">몇 개일까요</Button>
        <Button variant="secondary" size="sm" className="w-full justify-start">몇 번째일까요</Button>
        <Button variant="secondary" size="sm" className="w-full justify-start">어떤 수가 들어갈까요</Button>
        <Button variant="secondary" size="sm" className="w-full justify-start">몇 번째 수는 무엇일까요</Button>
        <Button variant="secondary" size="sm" className="w-full justify-start">규칙은 무엇일까요</Button>
        <Button variant="secondary" size="sm" className="w-full justify-start">어떤 모양일까요</Button>
        <Button variant="secondary" size="sm" className="w-full justify-start">몇 단일까요</Button>
      </div>
    </Card>
  );
}


