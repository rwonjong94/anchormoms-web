import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string, counselingId: string } }
) {
  try {
    const { id: studentId, counselingId } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${BACKEND_URL}/api/nimda/students/${studentId}/audio-counselings/${counselingId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Audio counseling get API error:', error);
    return NextResponse.json(
      { error: '상담 기록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string, counselingId: string } }
) {
  try {
    const { id: studentId, counselingId } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${BACKEND_URL}/api/nimda/students/${studentId}/audio-counselings/${counselingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Audio counseling delete API error:', error);
    return NextResponse.json(
      { error: '상담 기록 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}