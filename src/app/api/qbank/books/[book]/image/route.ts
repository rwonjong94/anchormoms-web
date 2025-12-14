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

export async function GET(req: NextRequest, { params }: { params: { book: string } }) {
  try {
    const { book } = await params;
    const url = new URL(req.url);
    const file = url.searchParams.get('file');
    if (!file) return NextResponse.json({ error: 'file 쿼리가 필요합니다.' }, { status: 400 });

    const baseDir = await resolveBooksBaseDir();
    const filePath = path.resolve(baseDir, book, file);
    const data = await fs.readFile(filePath);
    const isPng = /\.png$/i.test(file);
    return new NextResponse(data, { headers: { 'Content-Type': isPng ? 'image/png' : 'image/jpeg' } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '이미지를 불러올 수 없습니다.' }, { status: 500 });
  }
}


