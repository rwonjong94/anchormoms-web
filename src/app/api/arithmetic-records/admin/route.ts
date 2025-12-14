import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const backendUrl = new URL(`${process.env.BACKEND_URL}/arithmetic-records/admin`);
    for (const [key, value] of searchParams.entries()) {
      backendUrl.searchParams.set(key, value);
    }

    const resp = await fetch(backendUrl.toString(), {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('연산 기록 관리자 조회 API 오류:', error);
    return NextResponse.json({ error: 'Backend API 호출 중 오류' }, { status: 500 });
  }
}
