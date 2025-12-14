import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }
    const body = await request.json();
    const base = process.env.BACKEND_URL || '';
    // 1차 시도
    let resp = await fetch(`${base}/exams/manual`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    // 2차 폴백
    if (resp.status === 404) {
      resp = await fetch(`${base}/api/exams/manual`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }
    const text = await resp.text();
    try {
      const json = text ? JSON.parse(text) : {};
      return NextResponse.json(json, { status: resp.status });
    } catch {
      return NextResponse.json({ message: text }, { status: resp.status });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 });
  }
}


