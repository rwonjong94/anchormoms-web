import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/nimda/students/[studentId]/audio-counselings/[counselingId]/clips/[clipId]/stt/transcript
// 클립 STT transcript 생성 (요약 없이 전사만)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; counselingId: string; clipId: string } }
) {
  try {
    const { id: studentId, counselingId, clipId } = await params;
    console.log('클립 transcript 생성 API 라우트 호출됨:', { studentId, counselingId, clipId });
    
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}/stt/transcript`,
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
    console.error('클립 transcript 생성 API 오류:', error);
    return NextResponse.json(
      { error: '클립 transcript 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}