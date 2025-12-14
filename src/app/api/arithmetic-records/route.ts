import { NextRequest, NextResponse } from 'next/server';

// GET /api/arithmetic-records - 학부모용 연산 기록 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const backendUrl = new URL(`${process.env.BACKEND_URL}/arithmetic-records`);
    
    // 모든 query parameter 전달
    for (const [key, value] of searchParams.entries()) {
      backendUrl.searchParams.set(key, value);
    }
    
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('연산 기록 조회 API 오류:', error);
    return NextResponse.json(
      { error: 'Backend API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/arithmetic-records - 연산 기록 생성 (학생이 연산 완료 후)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const response = await fetch(`${process.env.BACKEND_URL}/arithmetic-records`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('연산 기록 생성 API 오류:', error);
    return NextResponse.json(
      { error: 'Backend API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
