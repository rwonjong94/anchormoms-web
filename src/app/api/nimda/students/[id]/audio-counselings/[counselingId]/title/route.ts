import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string, counselingId: string } }
) {
  try {
    const { id: studentId, counselingId } = await params;
    const authHeader = request.headers.get('Authorization');
    
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/nimda/students/${studentId}/audio-counselings/${counselingId}/title`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Audio counseling title update API error:', error);
    return NextResponse.json(
      { error: '상담 타이틀 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}