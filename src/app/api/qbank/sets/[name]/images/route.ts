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

export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  try {
    const { name } = await params;
    const baseDir = await resolveBooksBaseDir();
    const sets = await readSets(baseDir);
    const set = sets.find((s: any) => s.name === name);
    if (!set) return NextResponse.json({ error: '등록된 문제집이 없습니다' }, { status: 404 });
    const dir = path.resolve(baseDir, set.folder);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const images = entries.filter((e) => e.isFile() && /\.(jpe?g|png)$/i.test(e.name)).map((e) => e.name).sort();
    return NextResponse.json({ items: images });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '이미지 목록 실패' }, { status: 500 });
  }
}


