import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = _req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    const { id } = params;
    const base = process.env.BACKEND_URL || '';
    // 백엔드에 단순 조회용 엔드포인트가 없으므로 상세 조회로 받아와 필요한 필드만 전달
    let resp = await fetch(`${base}/nimda/exams/${id}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok && resp.status !== 401) {
      resp = await fetch(`${base}/api/nimda/exams/${id}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });
    }
    const full = await resp.json().catch(() => ({}));
    // 필요한 최소 필드만 응답
    const minimal = {
      id: full?.id ?? id,
      title: full?.title ?? null,
      course: full?.course ?? null,
      examnum: full?.examnum ?? full?.number ?? null,
      duration: full?.duration ?? null,
      type: full?.type ?? null,
      grade: full?.grade ?? null,
    };
    return NextResponse.json(minimal, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    const base = process.env.BACKEND_URL || '';
    let resp = await fetch(`${base}/nimda/exams/${id}/simple`, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok && resp.status !== 401) {
      resp = await fetch(`${base}/api/nimda/exams/${id}/simple`, {
        method: 'PATCH',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 });
  }
}

