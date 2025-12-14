import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; counselingId: string; clipId: string } }
) {
  try {
    const { id: studentId, counselingId, clipId } = params;
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Backend API로 요청 프록시
    const response = await fetch(`${process.env.BACKEND_URL}/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}/summary`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Clip summary update error:', error);
    return NextResponse.json(
      { error: 'Backend API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}