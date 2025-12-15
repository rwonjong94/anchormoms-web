// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

function mintAdminToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
  }
  return jwt.sign(
    {
      sub: 'admin',
      username: 'qbank',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
    },
    secret
  );
}

export async function GET(request: NextRequest) {
  try {
    const token = mintAdminToken();
    const url = new URL(request.url);
    const originalPage = Number(url.searchParams.get('page') || '1');
    const originalLimit = Number(url.searchParams.get('limit') || '20');
    const group = url.searchParams.get('group') || '';
    const exactSet = url.searchParams.get('search') || '';

    // group 필터가 없으면 기존 프록시 동작 유지
    if (!group) {
      const qs = url.searchParams.toString();
      const resp = await fetch(`${backendUrl}/api/admin/problems?${qs}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(data, { status: resp.status });
    }

    // group 필터가 있으면 전체를 페이지네이션하여 필터 적용 후 잘라서 반환
    // 1) 세트 레지스트리 로드
    async function resolveBooksBaseDir(): Promise<string> {
      const candidates: string[] = [];
      if (process.env.BOOKS_BASE_DIR && process.env.BOOKS_BASE_DIR.trim().length > 0) {
        candidates.push(process.env.BOOKS_BASE_DIR);
      }
      candidates.push(path.resolve(process.cwd(), 'res', 'book'));
      candidates.push(path.resolve(process.cwd(), '..', 'res', 'book'));
      for (const dir of candidates) {
        try {
          const st = await fs.stat(dir);
          if (st.isDirectory()) return dir;
        } catch {}
      }
      throw new Error('res/book 디렉터리를 찾을 수 없습니다. 환경변수 BOOKS_BASE_DIR를 설정하세요.');
    }
    async function readSets(): Promise<Array<{ name: string; group?: string }>> {
      try {
        const base = await resolveBooksBaseDir();
        const buf = await fs.readFile(path.resolve(base, '_qbank_sets.json'), 'utf8');
        const json = JSON.parse(buf);
        const arr = Array.isArray(json) ? json : (Array.isArray(json?.items) ? json.items : []);
        return arr;
      } catch {
        return [];
      }
    }

    const sets = await readSets();
    const validNames = new Set(
      sets.filter((s) => (s.group || '').toLowerCase() === group.toLowerCase()).map((s) => s.name)
    );

    // 2) 백엔드에서 전체 페이지를 순회하며 수집
    const baseParams = new URLSearchParams(url.searchParams);
    baseParams.delete('page');
    baseParams.delete('limit');
    const perPage = 100;

    // 첫 페이지 요청으로 전체 페이지 수 확인
    baseParams.set('page', '1');
    baseParams.set('limit', String(perPage));
    const firstResp = await fetch(`${backendUrl}/api/admin/problems?${baseParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const firstData = await firstResp.json().catch(() => ({ items: [], totalPages: 0 }));
    if (!firstResp.ok) {
      return NextResponse.json(firstData, { status: firstResp.status });
    }
    const totalPages = Number(firstData.totalPages || 0);
    let collected: any[] = Array.isArray(firstData.items) ? firstData.items : [];
    // 추가 페이지 병렬 수집
    const fetches: Promise<Response>[] = [];
    for (let p = 2; p <= totalPages; p++) {
      const pParams = new URLSearchParams(baseParams);
      pParams.set('page', String(p));
      pParams.set('limit', String(perPage));
      fetches.push(fetch(`${backendUrl}/api/admin/problems?${pParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }));
    }
    if (fetches.length > 0) {
      const resps = await Promise.all(fetches);
      const datas = await Promise.all(resps.map((r) => r.json().catch(() => ({ items: [] }))));
      for (const d of datas) {
        if (Array.isArray(d.items)) collected = collected.concat(d.items);
      }
    }

    // 3) 그룹으로 필터링 (examInfo가 세트 이름과 일치)
    let filtered = collected.filter((it) => validNames.has(it.examInfo));
    if (exactSet) {
      filtered = filtered.filter((it) => it.examInfo === exactSet);
    }
    const total = filtered.length;
    const start = (originalPage - 1) * originalLimit;
    const end = start + originalLimit;
    const items = filtered.slice(start, end);
    const result = { items, total, page: originalPage, limit: originalLimit, totalPages: Math.ceil(total / originalLimit) };
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '목록 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = mintAdminToken();
    const resp = await fetch(`${backendUrl}/api/admin/problems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '저장 실패' }, { status: 500 });
  }
}


