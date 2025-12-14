import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    const base = process.env.BACKEND_URL || '';
    // 기본 경로 시도
    let resp = await fetch(`${base}/nimda/exams/bulk-simple`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    // 실패 시 /api 접두부 재시도
    if (!resp.ok && resp.status !== 401) {
      resp = await fetch(`${base}/api/nimda/exams/bulk-simple`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return NextResponse.json(err, { status: resp.status });
    }
    const data = await resp.json();
    return NextResponse.json(data, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 });
  }
}


