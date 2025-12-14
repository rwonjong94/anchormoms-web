import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/nimda/students/[studentId]/audio-counselings/[counselingId]/clips/[clipId]/stt/process
// 클립 STT 처리 (transcript + summary 생성)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; counselingId: string; clipId: string } }
) {
  try {
    const { id: studentId, counselingId, clipId } = await params;
    console.log('클립 STT 처리 API 라우트 호출됨:', { studentId, counselingId, clipId });
    
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}/stt/process`,
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
    console.error('클립 STT 처리 API 오류:', error);
    return NextResponse.json(
      { error: '클립 STT 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}