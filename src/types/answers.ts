export type SeongdaeSeason = 'early' | 'late';
export type PremiumMexDomain = 'num' | 'geo' | 'pat';
export type CoreMoreType = 'BASIC' | 'CORE' | 'MORE';

export interface SeongdaeAnswersResponse {
  contest: 'seongdae';
  season: SeongdaeSeason;
  grade: number; // 1..6
  rounds: Record<string, Array<string | number>>; // key: '029'..'048'
  updatedAt?: string;
}

export interface PremiumMexAnswersResponse {
  contest: 'premium-mex';
  grade: number; // 1..6
  domain: PremiumMexDomain; // num=수와 연산, geo=도형과 측정, pat=규칙성과 자료와가능성
  answers: Array<string | number>;
  updatedAt?: string;
}

export interface CoreMoreAnswersResponse {
  contest: 'core-more';
  grade: number; // 1..6
  type: CoreMoreType; // BASIC | CORE | MORE
  answers: Array<string | number>;
  updatedAt?: string;
}


