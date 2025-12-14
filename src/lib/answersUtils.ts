import { CoreMoreType, PremiumMexDomain, SeongdaeSeason } from '@/types/answers';

// 매핑: UI 용 파라미터 → 파일 키 구성 요소
export function mapSeongdae(season: SeongdaeSeason, grade: number) {
  // season: early=1, late=2
  const smcSeasonNum = season === 'early' ? 1 : 2;
  // grade: 1..6
  const elem = `elem${grade}`;
  return { smcSeasonNum, elem };
}

export function mapPremiumMexDomain(domain: 'arithmetic' | 'geometry' | 'pattern-data-prob'): PremiumMexDomain {
  if (domain === 'arithmetic') return 'num';
  if (domain === 'geometry') return 'geo';
  return 'pat';
}

export function mapCoreMoreType(type: 'BASIC' | 'CORE' | 'MORE'): CoreMoreType {
  return type;
}

export function formatRoundKey(num: number) {
  // zero-padded 3 digits
  return String(num).padStart(3, '0');
}


