import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }
    const base = (process.env.BACKEND_URL || '').replace(/\/$/, '');
    const body = await request.json().catch(() => ({}));
    let resp = await fetch(`${base}/admin/scores/students/list-with-meta`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok && resp.status !== 401) {
      resp = await fetch(`${base}/api/admin/scores/students/list-with-meta`, {
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
      const json = text ? JSON.parse(text) : [];
      return NextResponse.json(json, { status: resp.status });
    } catch {
      return NextResponse.json([], { status: 200 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 });
  }
}


