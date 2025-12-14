import { NextRequest, NextResponse } from 'next/server';

// Admin 로그인 - Backend API로 프록시
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Backend API로 요청 전달
    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin 로그인 오류:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Admin 토큰 검증 - Backend API로 프록시
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    // Backend API로 요청 전달
    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/admin/validate`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin 토큰 검증 오류:', error);
    return NextResponse.json(
      { error: '토큰 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}