import { NextRequest, NextResponse } from 'next/server';

// GET /api/users/settings - 본인 설정만 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${process.env.BACKEND_URL}/users/settings`, {
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

// PUT /api/users/settings - 본인 설정만 수정
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();

    const response = await fetch(`${process.env.BACKEND_URL}/users/settings`, {
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
    console.error('Backend API 호출 오류:', error);
    return NextResponse.json(
      { error: 'Backend API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

