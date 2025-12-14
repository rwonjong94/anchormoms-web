import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }
    const base = (process.env.BACKEND_URL || '').replace(/\/$/, '');
    const bodyText = await request.text();
    let resp = await fetch(`${base}/admin/scores/exams/${params.id}/manual/replace-class`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: bodyText || '{}',
    });
    if (!resp.ok && resp.status !== 401) {
      resp = await fetch(`${base}/api/admin/scores/exams/${params.id}/manual/replace-class`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: bodyText || '{}',
      });
    }
    const text = await resp.text();
    try {
      const json = text ? JSON.parse(text) : { success: resp.ok };
      return NextResponse.json(json, { status: resp.status });
    } catch {
      return NextResponse.json({ success: resp.ok }, { status: resp.status });
    }
  } catch (e:any) {
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 });
  }
}


