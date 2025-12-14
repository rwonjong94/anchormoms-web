import { NextRequest, NextResponse } from 'next/server';

// 칼럼 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const authHeader = request.headers.get('Authorization');
    
    const backendUrl = new URL(`${process.env.BACKEND_URL}/api/columns`);
    if (category) backendUrl.searchParams.set('category', category);
    backendUrl.searchParams.set('limit', limit.toString());
    backendUrl.searchParams.set('offset', offset.toString());

    console.log('Backend URL:', backendUrl.toString());

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

// 칼럼 생성
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    const body = await request.json();

    const response = await fetch(`${process.env.BACKEND_URL}/api/columns`, {
      method: 'POST',
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