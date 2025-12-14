import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }
    const base = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production' ? 'http://backend:3001' : 'http://localhost:3001')
    ).replace(/\/$/, '');
    const id = params.id;
    // 1차: /admin/scores/students/:id
    let resp = await fetch(`${base}/admin/scores/students/${id}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    // 2차: /api/admin/scores/students/:id
    if (resp.status === 404) {
      resp = await fetch(`${base}/api/admin/scores/students/${id}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });
    }
    if (!resp.ok) {
      // 실패 시에도 빈 목록 반환 (404/5xx를 UI로 전파하지 않음)
      return NextResponse.json([], { status: 200 });
    }
    const data = await resp.json().catch(() => []);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error('[nimda/students/:id/scores] proxy error:', e);
    return NextResponse.json([], { status: 200 });
  }
}


