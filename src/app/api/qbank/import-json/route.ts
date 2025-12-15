// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

function mintAdminToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
  }
  return jwt.sign(
    {
      sub: 'admin',
      username: 'qbank-import',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60 * 30,
    },
    secret
  );
}

async function resolveJsonDir(): Promise<string> {
  const candidates: string[] = [];
  if (process.env.JSON_FILES_DIR && process.env.JSON_FILES_DIR.trim().length > 0) {
    candidates.push(process.env.JSON_FILES_DIR);
  }
  candidates.push(path.resolve(process.cwd(), 'res', 'json_files'));
  candidates.push(path.resolve(process.cwd(), '..', 'res', 'json_files'));
  for (const dir of candidates) {
    try {
      const st = await fs.stat(dir);
      if (st.isDirectory()) return dir;
    } catch {}
  }
  throw new Error('res/json_files 디렉터리를 찾을 수 없습니다. 환경변수 JSON_FILES_DIR를 설정하세요.');
}

function toArray<T>(v: any): T[] { return Array.isArray(v) ? v : (v ? [v] : []); }

function normalizeImages(arr: any[]): string[] {
  return (arr || []).map((s: any) => String(s || '').replace(/\\/g, '/')).filter((s) => s.length > 0);
}

function stripBom(text: string): string {
  if (!text) return text;
  // Remove UTF-8 BOM if present
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

// util: 파일명으로 세트명 제안 (예: SMC_1학년_전기.json -> SMC 1학년 전기)
function suggestSetNameFromFilename(filename: string): string {
  const base = filename.replace(/\.json$/i, '');
  return base.replace(/_/g, ' ');
}

type ImportBody = {
  dryRun?: boolean;
  useFilenameAsExamInfo?: boolean; // exam_info를 파일명 기반 세트명으로 덮어쓰기
  files?: string[]; // 지정 시 해당 파일만(import 경로 기준 파일명)
  chunkSize?: number; // 기본 200
};

export async function POST(req: NextRequest) {
  try {
    const token = mintAdminToken();
    const { dryRun = false, useFilenameAsExamInfo = false, files = [], chunkSize = 200 }: ImportBody = await req.json().catch(() => ({}));
    const dir = await resolveJsonDir();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let targets = entries.filter((e) => e.isFile() && /\.json$/i.test(e.name)).map((e) => e.name);
    if (Array.isArray(files) && files.length > 0) {
      const set = new Set(files);
      targets = targets.filter((n) => set.has(n));
    }
    if (targets.length === 0) return NextResponse.json({ ok: true, imported: 0, files: [] });

    let totalItems = 0;
    const perFileCounts: Record<string, number> = {};
    const preparedAll: any[] = [];

    for (const name of targets) {
      const abs = path.resolve(dir, name);
      const raw = await fs.readFile(abs, 'utf8');
      let jsonText = stripBom(raw);
      let json: any = JSON.parse(jsonText);
      if (!Array.isArray(json)) {
        // items 래핑 형태 허용
        if (Array.isArray(json?.items)) json = json.items; else continue;
      }
      const setName = suggestSetNameFromFilename(name);
      const mapped = json.map((p: any) => {
        const exam_info = useFilenameAsExamInfo ? setName : String(p?.exam_info ?? '');
        return {
          exam_info,
          exam_grade: Number(p?.exam_grade ?? 0),
          exam_term: Number(p?.exam_term ?? 0),
          exam_year: p?.exam_year === null || p?.exam_year === undefined || String(p?.exam_year).trim() === '' ? null : Number(p?.exam_year),
          prob_num: Number(p?.prob_num ?? 0),
          prob_area: String(p?.prob_area ?? ''),
          prob_type: String(p?.prob_type ?? ''),
          prob_rate: p?.prob_rate === null || p?.prob_rate === undefined || String(p?.prob_rate).trim?.() === '' ? null : Number(p?.prob_rate),
          prob_text: String(p?.prob_text ?? ''),
          cond_text: toArray<string>(p?.cond_text).map(String),
          cond_images: normalizeImages(toArray<string>(p?.cond_images)),
          prob_images: normalizeImages(toArray<string>(p?.prob_images)),
        };
      });
      perFileCounts[name] = mapped.length;
      totalItems += mapped.length;
      preparedAll.push(...mapped);
    }

    if (dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, files: targets, counts: perFileCounts, total: totalItems });
    }

    // 벌크 업로드(청크)
    let imported = 0;
    for (let i = 0; i < preparedAll.length; i += chunkSize) {
      const chunk = preparedAll.slice(i, i + chunkSize);
      const resp = await fetch(`${backendUrl}/api/admin/problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(chunk),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return NextResponse.json({ error: err?.error || `업로드 실패(${resp.status})`, imported, total: preparedAll.length }, { status: 500 });
      }
      imported += chunk.length;
    }

    return NextResponse.json({ ok: true, files: targets, counts: perFileCounts, total: totalItems, imported });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '임포트 실패' }, { status: 500 });
  }
}


