import { NextRequest, NextResponse } from 'next/server';

// 학부모용 수업 일지 조회 API
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    const backendUrl = new URL(`${process.env.BACKEND_URL}/class-logs`);
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend API 호출 오류:', error);
    return NextResponse.json(
      { error: 'Backend API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
