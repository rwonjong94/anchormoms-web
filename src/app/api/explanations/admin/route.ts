import { NextRequest, NextResponse } from 'next/server';

// Backend API로 요청을 전달하는 프록시
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    
    // Backend API로 요청 전달 (현재는 homework-videos API를 사용, 추후 explanations로 변경 예정)
    const backendUrl = new URL(`${process.env.BACKEND_URL}/api/homework-videos/admin`);
    
    // 모든 query parameter 전달
    for (const [key, value] of searchParams.entries()) {
      backendUrl.searchParams.set(key, value);
    }
    
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
