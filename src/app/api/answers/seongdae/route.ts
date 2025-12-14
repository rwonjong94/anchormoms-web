import { NextRequest, NextResponse } from 'next/server';
import { seongdaeSchema } from '@/lib/answersSchema';
import { mapSeongdae, formatRoundKey } from '@/lib/answersUtils';

// 파일 시스템 접근: 런타임에서 JSON을 import 대신 fetch(정적)로 읽는 방식을 권장하지만,
// 여기서는 Node fs를 사용해 로컬 리소스를 읽습니다.
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const season = (searchParams.get('season') || 'early') as 'early' | 'late';
  const grade = Number(searchParams.get('grade') || '1');
  const round = searchParams.get('round'); // optional: '029'..'048'

  const { smcSeasonNum, elem } = mapSeongdae(season, grade);

  // 0) HTTP 정적 자산 우선 시도 (Next가 public/answers를 서빙)
  let data: Record<string, Array<string | number>> | null = null;
  try {
    const httpUrl = new URL('/answers/smc_answers.json', request.url);
    const httpRes = await fetch(httpUrl.toString(), { cache: 'no-store' });
    if (httpRes.ok) {
      data = (await httpRes.json()) as Record<string, Array<string | number>>;
    }
  } catch {}

  // 소스 파일: smc_answers.json (전/후기 + 학년 + 회차 키 보유)
  // 실행 위치가 .next/server 등일 수 있어, 상위 디렉터리를 단계적으로 탐색
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

  if (!data) {
    // 1순위: public/answers (배포물에 복사된 정답 파일)
    let resolvedPath = resolveAnswerPath('public', 'answers', 'smc_answers.json');
    // 2순위: 레포 내 리소스 디렉토리
    if (!resolvedPath) {
      resolvedPath = resolveAnswerPath('res', 'json_files', 'answers', 'smc_answers.json');
    }
    if (!resolvedPath) {
      // 빌드 산출물에 데이터가 포함되지 않은 경우에도 404 대신 빈 응답을 반환
      const emptyPayload = { contest: 'seongdae' as const, season, grade, rounds: {} };
      const parsed = seongdaeSchema.safeParse(emptyPayload);
      if (!parsed.success) {
        return NextResponse.json({ error: 'schema validation failed', issues: parsed.error.format() }, { status: 500 });
      }
      return NextResponse.json(parsed.data);
    }
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    data = JSON.parse(raw) as Record<string, Array<string | number>>;
  }

  // 회차 범위: 29..48 (문자열 키는 zero-padded 추천)
  const rounds: Record<string, Array<string | number>> = {};
  for (let r = 29; r <= 48; r++) {
    const rk = formatRoundKey(r);
    const key = `smc${smcSeasonNum}_${elem}_${r}`; // 원본 키는 패딩 없이 존재
    if (data[key]) {
      rounds[rk] = data[key];
    }
  }

  // 단일 회차 요청 시 필터링
  const payload = {
    contest: 'seongdae' as const,
    season,
    grade,
    rounds: round ? { [round]: rounds[round] } : rounds,
  };

  const parsed = seongdaeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'schema validation failed', issues: parsed.error.format() }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}


