import { Contest } from '@/types/contest';

// 경시대회 데이터 (하드코딩)
export const CONTESTS: Contest[] = [
  {
    id: '1',
    title: '전국 수학 학력경시대회(성대경시)',
    registrationDeadline: '2025-09-14',
    examDate: '2025-10-19',
    resultDate: '2025-11-11',
    target: '초등학교 1학년~',
    website: 'test.edusky.co.kr',
    status: 'exam',
    urgent: false,
    description: '전국 단위의 수학 학력경시대회입니다.'
  },
  {
    id: '2',
    title: '전국 초등수학 창의사고력대회',
    registrationDeadline: '2025-10-21',
    examDate: '2025-10-26',
    resultDate: '2025-11-07',
    target: '초등학교 3학년~',
    website: 'http://www.koreasts.com/snue',
    status: 'upcoming',
    urgent: false,
    description: '초등학생의 창의적 사고력을 평가하는 수학 경시대회입니다.'
  },
  {
    id: '3',
    title: '한국수학인증시험(KMC)',
    registrationDeadline: '2025-10-12',
    examDate: '2025-11-09',
    target: '초등학교 1학년~',
    website: 'www.kmath.co.kr',
    status: 'upcoming',
    urgent: false,
    description: '한국수학인증시험으로 수학 실력을 평가하는 경시대회입니다.'
  }
];

// 긴급 공지가 필요한 경시대회 필터링
export const getUrgentContests = (contests: Contest[]): Contest[] => {
  return contests.filter(contest => contest.urgent);
};
