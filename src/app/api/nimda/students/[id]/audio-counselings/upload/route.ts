import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { id: studentId } = await params;

    // FormData를 그대로 백엔드로 전달
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/nimda/students/${studentId}/audio-counselings/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
        // FormData 전송 시 Content-Type 헤더는 설정하지 않음 (브라우저가 자동 설정)
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Audio upload API error:', error);
    return NextResponse.json(
      { error: '음성 파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}