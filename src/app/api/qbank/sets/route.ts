// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

type BookSet = {
  name: string;
  folder: string; // BOOKS_BASE_DIR 기준 상대 경로
  publisher?: string;
  bookNum?: number | null;
  examGrade?: number | null;
  examTerm?: number | null;
  group?: string;
};

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

async function getRegistryPath(): Promise<string> {
  const baseDir = await resolveBooksBaseDir();
  return path.resolve(baseDir, '_qbank_sets.json');
}

async function readSets(): Promise<BookSet[]> {
  try {
    const file = await getRegistryPath();
    const buf = await fs.readFile(file, 'utf8');
    const json = JSON.parse(buf);
    if (Array.isArray(json)) return json as BookSet[];
    if (Array.isArray(json?.items)) return json.items as BookSet[];
    return [];
  } catch {
    return [];
  }
}

async function writeSets(sets: BookSet[]): Promise<void> {
  const file = await getRegistryPath();
  await fs.writeFile(file, JSON.stringify(sets, null, 2), 'utf8');
}

export async function GET() {
  try {
    const sets = await readSets();
    const normalized = sets.map((s) => ({
      ...s,
      group: s?.group === undefined || s?.group === null ? undefined : String(s.group).trim(),
    }));
    return NextResponse.json({ items: normalized });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '목록 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const originalNameRaw = body?.originalName;
    const originalName = originalNameRaw === undefined || originalNameRaw === null ? undefined : String(originalNameRaw).trim();
    const folder = String(body?.folder || '').trim();
    const publisher = body?.publisher ? String(body.publisher) : undefined;
    const bookNum = body?.bookNum === null || body?.bookNum === undefined ? null : Number(body.bookNum);
    const examGrade = body?.examGrade === null || body?.examGrade === undefined ? null : Number(body.examGrade);
    const examTerm = body?.examTerm === null || body?.examTerm === undefined ? null : Number(body.examTerm);
    const groupRaw = body?.group;
    const group = groupRaw === undefined || groupRaw === null ? undefined : String(groupRaw).trim();
    if (!name) return NextResponse.json({ error: 'name 필수' }, { status: 400 });
    if (!folder) return NextResponse.json({ error: 'folder 필수' }, { status: 400 });

    const baseDir = await resolveBooksBaseDir();
    const abs = path.resolve(baseDir, folder);
    try {
      const st = await fs.stat(abs);
      if (!st.isDirectory()) return NextResponse.json({ error: 'folder가 디렉터리가 아닙니다' }, { status: 400 });
    } catch {
      return NextResponse.json({ error: 'folder 경로를 찾을 수 없습니다' }, { status: 400 });
    }

    const sets = await readSets();
    // 우선순위: originalName으로 찾기 -> 없으면 현재 name으로 찾기
    let idx = -1;
    if (originalName && originalName.length > 0) {
      idx = sets.findIndex((s) => s.name === originalName);
    }
    if (idx < 0) {
      idx = sets.findIndex((s) => s.name === name);
    }
    const entry: BookSet = { name, folder, publisher, bookNum, examGrade, examTerm, group };
    if (idx >= 0) sets[idx] = entry; else sets.push(entry);
    await writeSets(sets);
    return NextResponse.json(entry, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '저장 실패' }, { status: 500 });
  }
}


