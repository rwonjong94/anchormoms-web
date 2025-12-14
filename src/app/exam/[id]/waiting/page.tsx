'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ExamInfo {
  id: string;
  round: number;
  type: 'full' | 'half' | 'beginner';
  date: string;
  duration: number;
  startTime: string; // HH:MM 형식
  title: string;
  pdfUrl?: string;
  activatedAt?: string; // ISO 형식
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function ExamWaitingPage() {
  const params = useParams();
  const router = useRouter();
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실제 시험 데이터 로드
  useEffect(() => {
    const loadExamInfo = async () => {
      try {
        const response = await fetch(`/api/exams/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          const examData = await response.json();
          
          // activatedAt이 있으면 사용, 없으면 즉시 시작 가능 (현재 시간에서 1초 후)
          let examDate, examDateString, startTime;
          if (examData.activatedAt) {
            examDate = new Date(examData.activatedAt);
            examDateString = examDate.toISOString().split('T')[0];
            startTime = `${examDate.getHours().toString().padStart(2, '0')}:${examDate.getMinutes().toString().padStart(2, '0')}`;
          } else {
            const now = new Date();
            examDate = new Date(now.getTime() + (1 * 1000)); // 즉시 시작 가능
            examDateString = examDate.toISOString().split('T')[0];
            startTime = `${examDate.getHours().toString().padStart(2, '0')}:${examDate.getMinutes().toString().padStart(2, '0')}`;
          }
          
          setExamInfo({
            id: examData.id,
            round: examData.examnum,
            type: examData.type.toLowerCase(),
            date: examDateString,
            duration: examData.duration,
            startTime: startTime,
            title: `${examData.examnum}회차 ${examData.type} 모의고사`,
            pdfUrl: '/resources/exam-1.pdf',
            activatedAt: examData.activatedAt
          });
        }
      } catch (error) {
        console.error('Failed to load exam info:', error);
        // 에러 발생 시 기본값 설정 (즉시 시작 가능)
        const now = new Date();
        const examDate = new Date(now.getTime() + (1 * 1000));
        const examDateString = examDate.toISOString().split('T')[0];
        const startTime = `${examDate.getHours().toString().padStart(2, '0')}:${examDate.getMinutes().toString().padStart(2, '0')}`;
        
        setExamInfo({
          id: params.id as string,
          round: 1,
          type: 'full',
          date: examDateString,
          duration: 90,
          startTime: startTime,
          title: '1회차 풀 모의고사',
          pdfUrl: '/resources/exam-1.pdf'
        });
      }
    };

    loadExamInfo();
  }, [params.id]);

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 시험 시작까지 남은 시간 계산
  useEffect(() => {
    if (!examInfo) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const examDate = new Date(examInfo.date);
      const [hours, minutes] = examInfo.startTime.split(':').map(Number);
      
      examDate.setHours(hours, minutes, 0, 0);
      
      const difference = examDate.getTime() - now.getTime();
      
      if (difference > 0) {
        const daysLeft = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesLeft = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({
          days: daysLeft,
          hours: hoursLeft,
          minutes: minutesLeft,
          seconds: secondsLeft
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [examInfo]);

  const formatTime = (time: number) => {
    return time.toString().padStart(2, '0');
  };

  const getExamTypeText = (type: string) => {
    switch (type) {
      case 'full': return '풀';
      case 'half': return '하프';
      case 'beginner': return '비기너';
      default: return '';
    }
  };

  const getExamTypeStyle = (type: string) => {
    switch (type) {
      case 'full': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'half': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'beginner': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const handleStartExam = () => {
    if (examInfo) {
      router.push(`/testing?examType=${examInfo.type.toUpperCase()}&examNum=${examInfo.round}&timer=${isTimerEnabled ? 'on' : 'off'}`);
    }
  };

  const isExamReady = examInfo?.activatedAt 
    ? (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)
    : true; // activatedAt이 없으면 즉시 시작 가능

  if (!examInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-page">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 카운트다운 타이머 */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border-default p-6 sticky top-8">
              {!isExamReady && (
                <h2 className="text-lg font-semibold text-title mb-4 text-center">
                  시험 시작까지
                </h2>
              )}
              
              {!isExamReady ? (
                <div className="text-center">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {formatTime(timeLeft.days)}
                      </div>
                      <div className="text-sm text-muted">일</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {formatTime(timeLeft.hours)}
                      </div>
                      <div className="text-sm text-muted">시간</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {formatTime(timeLeft.minutes)}
                      </div>
                      <div className="text-sm text-muted">분</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {formatTime(timeLeft.seconds)}
                      </div>
                      <div className="text-sm text-muted">초</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-4">
                    시험 시작 가능!
                  </div>
                  <div className="text-sm text-body">
                    아래 시험 시작 버튼을 눌러주세요.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 시험 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 시험 타이틀 */}
            <div className="bg-card rounded-lg shadow-sm border-default p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-title">
                  <span className={`px-3 py-1 rounded-md text-2xl font-semibold mr-2 inline-flex items-center ${getExamTypeStyle(examInfo.type)}`}>
                    {getExamTypeText(examInfo.type)}
                  </span>
                  {examInfo.round}회차 모의고사
                </h1>
                <div className="text-sm text-muted">
                  시험 시간: {examInfo.duration}분
                </div>
              </div>
              <div className="text-body">
                {examInfo.activatedAt ? (
                  <>
                    {new Date(examInfo.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} · {examInfo.startTime} 시작
                  </>
                ) : (
                  '즉시 응시 가능'
                )}
              </div>
            </div>

            {/* 공지사항 */}
            <div className="bg-card rounded-lg shadow-sm border-default p-6">
              <h2 className="text-lg font-semibold text-title mb-4">공지사항</h2>
              
              <div className="space-y-6">
                {/* 1. 주의사항 안내 */}
                <div>
                  <h3 className="font-medium text-title mb-3 flex items-center">
                    <span className="w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-sm font-bold mr-2">1</span>
                    주의사항 안내
                  </h3>
                  <ul className="text-sm text-body space-y-2 ml-8">
                    <li>• 시험 시간 동안 다른 탭이나 창으로 이동하지 마세요.</li>
                    <li>• 네트워크 연결이 불안정할 경우 자동 저장이 되지 않을 수 있습니다.</li>
                    <li>• 브라우저 새로고침이나 뒤로가기 버튼을 누르면 시험이 중단될 수 있습니다.</li>
                    <li>• 시험 중 화면을 캡처하거나 복사하는 행위는 금지됩니다.</li>
                  </ul>
                </div>

                {/* 2. 시험과정 안내 */}
                <div>
                  <h3 className="font-medium text-title mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold mr-2">2</span>
                    시험과정 안내
                  </h3>
                  <ul className="text-sm text-body space-y-2 ml-8">
                    <li>• 시험은 한 번에 한 문제씩 출제됩니다.</li>
                    <li>• 우측 사이드바에서 다른 문제로 이동할 수 있습니다.</li>
                    <li>• 답안은 자동으로 저장되며, 언제든 수정 가능합니다.</li>
                    <li>• 시험 완료 후 답안지 검토 시간이 주어집니다.</li>
                  </ul>
                </div>

                {/* 3. 채점과정 안내 */}
                <div>
                  <h3 className="font-medium text-title mb-3 flex items-center">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-bold mr-2">3</span>
                    채점과정 안내
                  </h3>
                  <ul className="text-sm text-body space-y-2 ml-8">
                    <li>• 객관식 문제는 즉시 자동 채점됩니다.</li>
                    <li>• 주관식 문제는 검토 후 채점 결과가 제공됩니다.</li>
                    <li>• 채점 완료 후 상세한 성적 분석 리포트를 받아보실 수 있습니다.</li>
                    <li>• 틀린 문제에 대한 해설과 유사 문제를 추천해드립니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 시험 환경 설정 */}
            <div className="bg-card rounded-lg shadow-sm border-default p-6">
              <h2 className="text-lg font-semibold text-title mb-4">시험 환경 설정</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 시험지 PDF 다운로드 */}
                <div className="flex items-center justify-between p-4 bg-muted dark:bg-hover rounded-lg border border-default">
                  <div>
                    <div className="font-medium text-title">시험지 PDF</div>
                    <div className="text-sm text-body">오프라인 응시용 문제지</div>
                  </div>
                  <button
                    disabled
                    className="px-4 py-2 bg-muted dark:bg-hover text-muted rounded-md cursor-not-allowed text-sm font-medium border border-input"
                  >
                    준비중
                  </button>
                </div>

                {/* 타이머 설정 */}
                <div className="flex items-center justify-between p-4 bg-muted dark:bg-hover rounded-lg border border-default">
                  <div>
                    <div className="font-medium text-title">타이머 사용</div>
                    <div className="text-sm text-body">시험 중 타이머 표시 여부</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isTimerEnabled}
                      onChange={(e) => setIsTimerEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-muted dark:bg-hover peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-input after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 border border-input"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* 시험 시작 버튼 */}
            <div className="text-center">
              {isExamReady ? (
                <button
                  onClick={handleStartExam}
                  className="px-8 py-4 bg-green-600 dark:bg-green-700 text-white text-lg font-semibold rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-lg"
                >
                  시험 시작하기
                </button>
              ) : (
                <button
                  disabled
                  className="px-8 py-4 bg-muted dark:bg-hover text-muted text-lg font-semibold rounded-lg cursor-not-allowed border border-input"
                >
                  시험 시작 대기 중...
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 