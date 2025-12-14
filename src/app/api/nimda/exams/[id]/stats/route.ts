import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }
    const base = process.env.BACKEND_URL || '';
    const id = params.id;
    const resp = await fetch(`${base}/nimda/exams/${id}/stats`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    const text = await resp.text();
    try {
      const json = text ? JSON.parse(text) : {};
      return NextResponse.json(json, { status: resp.status });
    } catch {
      return NextResponse.json({}, { status: 200 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 });
  }
}


