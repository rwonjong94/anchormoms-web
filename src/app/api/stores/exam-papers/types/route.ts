import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Backend API로 프록시 (관리자 권한 없이)
    const response = await fetch(`${process.env.BACKEND_URL}/stores/exam-papers/types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend API 호출 중 오류:', error);
    return NextResponse.json(
      { error: 'Backend API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}