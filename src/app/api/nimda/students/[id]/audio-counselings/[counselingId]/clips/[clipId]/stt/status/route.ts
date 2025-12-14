import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// GET /api/nimda/students/[studentId]/audio-counselings/[counselingId]/clips/[clipId]/stt/status
// 클립 STT 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; counselingId: string; clipId: string } }
) {
  try {
    const { id: studentId, counselingId, clipId } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(
      `${BACKEND_URL}/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}/stt/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader || '',
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('클립 STT 상태 조회 API 오류:', error);
    return NextResponse.json(
      { error: '클립 STT 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}