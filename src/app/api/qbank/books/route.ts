// @ts-nocheck
import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const baseDir = await resolveBooksBaseDir();
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const books = entries
      .filter((e) => e.isDirectory())
      .map((e) => ({ name: e.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ items: books });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '책 목록을 불러올 수 없습니다.' }, { status: 500 });
  }
}


