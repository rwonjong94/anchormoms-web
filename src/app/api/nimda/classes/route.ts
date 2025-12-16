import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

// 반 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    const response = await fetch(`${BACKEND_URL}/api/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      try {
        const json = text ? JSON.parse(text) : { error: '백엔드 오류' };
        return NextResponse.json(json, { status: response.status });
      } catch {
        return NextResponse.json({ error: '백엔드 오류', raw: text }, { status: response.status });
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[nimda/classes][GET] proxy error:', error);
    return NextResponse.json(
      { error: '반 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 반 생성
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '반 생성 실패' }));
      return NextResponse.json(
        { error: errorData.message || '반 생성에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[nimda/classes][POST] proxy error:', error);
    return NextResponse.json(
      { error: '반 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
