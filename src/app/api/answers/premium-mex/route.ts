import { NextRequest, NextResponse } from 'next/server';
import { premiumMexSchema } from '@/lib/answersSchema';
import { mapPremiumMexDomain } from '@/lib/answersUtils';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = Number(searchParams.get('grade') || '1');
  const domainParam = (searchParams.get('domain') || 'arithmetic') as 'arithmetic' | 'geometry' | 'pattern-data-prob';
  const domainKey = mapPremiumMexDomain(domainParam); // num|geo|pat

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
    const httpUrl = new URL('/answers/mex.json', request.url);
    const httpRes = await fetch(httpUrl.toString(), { cache: 'no-store' });
    if (httpRes.ok) {
      data = (await httpRes.json()) as Record<string, Array<string | number>>;
    }
  } catch {}

  if (!data) {
    // 1순위: public/answers → 2순위: res/json_files/answers
    let resolvedPath = resolveAnswerPath('public', 'answers', 'mex.json');
    if (!resolvedPath) {
      resolvedPath = resolveAnswerPath('res', 'json_files', 'answers', 'mex.json');
    }
    // 3순위: 절대 경로(운영 서버 기준)
    if (!resolvedPath) {
      const abs1 = path.join('/home/ubuntu/mogo/frontend/public/answers', 'mex.json');
      if (fs.existsSync(abs1)) resolvedPath = abs1;
    }
    if (!resolvedPath) {
      // 데이터 파일이 배포물에 포함되지 않은 경우에도 404 대신 빈 응답
      const payload = { contest: 'premium-mex' as const, grade, domain: domainKey, answers: [] as Array<string | number> };
      const parsed = premiumMexSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'schema validation failed', issues: parsed.error.format() }, { status: 500 });
      }
      return NextResponse.json(parsed.data);
    }
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    data = JSON.parse(raw) as Record<string, Array<string | number>>;
  }

  const elem = `elem${grade}`;
  const key = `mex_${elem}_${domainKey}`; // 예: mex_elem3_pat
  const answers = data[key] ?? [];

  const payload = {
    contest: 'premium-mex' as const,
    grade,
    domain: domainKey,
    answers,
  };

  const parsed = premiumMexSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'schema validation failed', issues: parsed.error.format() }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}


