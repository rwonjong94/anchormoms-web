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

export async function GET(_req: NextRequest, { params }: { params: { book: string } }) {
  try {
    const { book } = await params;
    const baseDir = await resolveBooksBaseDir();
    const bookDir = path.resolve(baseDir, book);
    const entries = await fs.readdir(bookDir, { withFileTypes: true });
    const images = entries
      .filter((e) => e.isFile() && /\.(jpe?g|png)$/i.test(e.name))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ items: images });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '이미지 목록을 불러올 수 없습니다.' }, { status: 500 });
  }
}


