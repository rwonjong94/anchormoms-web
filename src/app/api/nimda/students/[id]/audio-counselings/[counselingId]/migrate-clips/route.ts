import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/nimda/students/[studentId]/audio-counselings/[counselingId]/migrate-clips
// 단일 상담의 클립을 마이그레이션
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; counselingId: string } }
) {
  try {
    const { id: studentId, counselingId } = params;
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/nimda/students/${studentId}/audio-counselings/${counselingId}/migrate-clips`,
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
    console.error('클립 마이그레이션 API 오류:', error);
    return NextResponse.json(
      { error: '클립 마이그레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}