import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/nimda/audio-counselings/migrate-all-clips
// 모든 상담의 클립을 일괄 마이그레이션
export async function POST(
  request: NextRequest
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/nimda/audio-counselings/migrate-all-clips`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('전체 시스템 클립 마이그레이션 API 오류:', error);
    return NextResponse.json(
      { error: '전체 시스템 클립 마이그레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}