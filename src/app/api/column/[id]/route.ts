import { NextRequest, NextResponse } from 'next/server';

// 개별 칼럼 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    
    const backendUrl = new URL(`${process.env.BACKEND_URL}/api/columns/${id}`);
    // 쿼리 파라미터 전달
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

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

// 칼럼 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    
    const body = await request.json();

    const response = await fetch(`${process.env.BACKEND_URL}/api/columns/${id}`, {
      method: 'PATCH',
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

// 칼럼 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');

    const response = await fetch(`${process.env.BACKEND_URL}/api/columns/${id}`, {
      method: 'DELETE',
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