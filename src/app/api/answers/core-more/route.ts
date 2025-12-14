import { NextRequest, NextResponse } from 'next/server';
import { coreMoreSchema } from '@/lib/answersSchema';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = Number(searchParams.get('grade') || '1');
  const type = (searchParams.get('type') || 'CORE') as 'BASIC' | 'CORE' | 'MORE';

  const resolveAnswerPath = (...segments: string[]) => {
    let dir = process.cwd();
    for (let i = 0; i < 6; i++) {
      const candidate = path.join(dir, ...segments);
      if (fs.existsSync(candidate)) return candidate;
      const parent = path.join(dir, '..');
      if (parent === dir) break;
      dir = parent;
    }
    return null;
  };

  // 0) HTTP 정적 자산 우선 시도
  let data: Record<string, Array<string | number>> | null = null;
  try {
    const httpUrl = new URL('/answers/basiccoremore.json', request.url);
    const httpRes = await fetch(httpUrl.toString(), { cache: 'no-store' });
    if (httpRes.ok) {
      data = (await httpRes.json()) as Record<string, Array<string | number>>;
    }
  } catch {}

  if (!data) {
    // 1순위: public/answers → 2순위: res/json_files/answers
    let resolvedPath = resolveAnswerPath('public', 'answers', 'basiccoremore.json');
    if (!resolvedPath) {
      resolvedPath = resolveAnswerPath('res', 'json_files', 'answers', 'basiccoremore.json');
    }
    // 3순위: 절대 경로(운영 서버 기준)
    if (!resolvedPath) {
      const abs1 = path.join('/home/ubuntu/mogo/frontend/public/answers', 'basiccoremore.json');
      if (fs.existsSync(abs1)) resolvedPath = abs1;
    }
    if (!resolvedPath) {
      // 데이터 파일이 배포물에 포함되지 않은 경우에도 404 대신 빈 응답
      const payload = { contest: 'core-more' as const, grade, type, answers: [] as Array<string | number> };
      const parsed = coreMoreSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'schema validation failed', issues: parsed.error.format() }, { status: 500 });
      }
      return NextResponse.json(parsed.data);
    }
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    data = JSON.parse(raw) as Record<string, Array<string | number>>;
  }

  const elem = `elem${grade}`;
  const key = `math_${elem}_${type.toLowerCase()}`; // 예: math_elem2_core
  const answers = data[key] ?? [];

  const payload = {
    contest: 'core-more' as const,
    grade,
    type,
    answers,
  };

  const parsed = coreMoreSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'schema validation failed', issues: parsed.error.format() }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}


