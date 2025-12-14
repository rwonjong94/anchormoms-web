// 경시대회 관련 타입 정의
export interface Contest {
  id: string;
  title: string;
  registrationDeadline: string; // "2024-09-14"
  registrationDeadlineTime?: string; // "18:00" (오후 6시)
  examDate: string; // "2024-10-19"
  examTime?: string; // "10:00"
  resultDate?: string; // "2024-11-11"
  target: string; // "초등학교 1학년~"
  website: string; // "test.edusky.co.kr"
  status: 'upcoming' | 'registration' | 'exam' | 'result' | 'ended';
  urgent?: boolean; // 공지 배너 표시 여부
  description?: string;
  hasPreliminary?: boolean; // 예선시험 여부 (KMC 등)
  preliminaryDate?: string; // "2024-11-09"
  finalDate?: string; // "2024-12-14"
}

// 경시대회 상태 계산 함수
export const getContestStatus = (contest: Contest): Contest['status'] => {
  const now = new Date();
  const registrationDeadline = new Date(contest.registrationDeadline);
  const examDate = new Date(contest.examDate);
  const resultDate = contest.resultDate ? new Date(contest.resultDate) : null;

  if (now < registrationDeadline) {
    return 'upcoming';
  } else if (now < examDate) {
    return 'registration';
  } else if (now < (resultDate || examDate)) {
    return 'exam';
  } else if (resultDate && now < resultDate) {
    return 'result';
  } else {
    return 'ended';
  }
};

// D-Day 계산 함수
export const getDDay = (targetDate: string): number => {
  // KST(Asia/Seoul) 기준으로 날짜만 비교
  const toKstDateOnly = (d: Date) => {
    const y = Number(d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric' }));
    const m = Number(d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric' })) - 1; // 0-index
    const day = Number(d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', day: 'numeric' }));
    return new Date(y, m, day);
  };

  const now = new Date();
  const target = new Date(targetDate);
  const todayKst = toKstDateOnly(now);
  const targetKst = toKstDateOnly(target);

  const diffTime = targetKst.getTime() - todayKst.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 날짜 포맷팅 함수
export const formatDate = (dateString: string, includeTime?: boolean): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleDateString('ko-KR', options);
};
