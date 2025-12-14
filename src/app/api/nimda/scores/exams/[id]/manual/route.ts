import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }
    const base = (process.env.BACKEND_URL || '').replace(/\/$/, '');
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    let resp = await fetch(`${base}/admin/scores/exams/${params.id}/manual?${query.toString()}`, {
      headers: {
        'Authorization': authHeader,
      },
    });
    if (!resp.ok && resp.status !== 401) {
      resp = await fetch(`${base}/api/admin/scores/exams/${params.id}/manual?${query.toString()}`, {
        headers: {
          'Authorization': authHeader,
        },
      });
    }
    const text = await resp.text();
    try {
      const json = text ? JSON.parse(text) : [];
      return NextResponse.json(json, { status: resp.status });
    } catch {
      return NextResponse.json([], { status: 200 });
    }
  } catch (e:any) {
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 });
    }
    const base = (process.env.BACKEND_URL || '').replace(/\/$/, '');
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId') || '';
    const query = classId ? `?classId=${encodeURIComponent(classId)}` : '';
    let resp = await fetch(`${base}/admin/scores/exams/${params.id}/manual${query}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });
    if (!resp.ok && resp.status !== 401) {
      resp = await fetch(`${base}/api/admin/scores/exams/${params.id}/manual${query}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
        },
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


