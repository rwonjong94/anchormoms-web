// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

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

async function readSets(baseDir: string) {
  try {
    const buf = await fs.readFile(path.resolve(baseDir, '_qbank_sets.json'), 'utf8');
    const json = JSON.parse(buf);
    return Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [];
  } catch { return []; }
}

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  try {
    const { name } = await params;
    const url = new URL(req.url);
    const file = url.searchParams.get('file');
    if (!file) return NextResponse.json({ error: 'file 쿼리 필요' }, { status: 400 });
    const baseDir = await resolveBooksBaseDir();
    const sets = await readSets(baseDir);
    const set = sets.find((s: any) => s.name === name);
    if (!set) return NextResponse.json({ error: '등록된 문제집이 없습니다' }, { status: 404 });
    const dir = path.resolve(baseDir, set.folder);
    const abs = path.resolve(dir, file);
    // 디렉터리 탈출 방지
    if (!abs.startsWith(dir + path.sep) && abs !== dir) {
      return NextResponse.json({ error: '잘못된 파일 경로' }, { status: 400 });
    }
    // 존재 확인
    try {
      const st = await fs.stat(abs);
      if (!st.isFile()) {
        return NextResponse.json({ error: '파일이 아닙니다' }, { status: 404 });
      }
    } catch (e: any) {
      if (e && e.code === 'ENOENT') {
        return NextResponse.json({ error: `이미지를 찾을 수 없습니다: ${file}` }, { status: 404 });
      }
      throw e;
    }
    const data = await fs.readFile(abs);
    const isPng = /\.png$/i.test(file);
    return new NextResponse(data, { headers: { 'Content-Type': isPng ? 'image/png' : 'image/jpeg' } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '이미지 로드 실패' }, { status: 500 });
  }
}


