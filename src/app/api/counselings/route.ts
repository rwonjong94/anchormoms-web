import { NextRequest, NextResponse } from 'next/server';

// Backend API로 요청을 전달하는 프록시
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Not Implemented: 일반 상담 생성은 관리자 엔드포인트(/api/counseling-logs/admin)를 사용하세요.' },
    { status: 501 }
  );
}
