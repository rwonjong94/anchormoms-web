'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Question, StudentAnswer, QuestionStatus, ExamSession } from '@/types/exam';
import { useAuth } from '@/contexts/AuthContext';
import ExamTimer from '@/components/testing/ExamTimer';
import QuestionSidebar from '@/components/testing/QuestionSidebar';
import QuestionDisplay from '@/components/testing/QuestionDisplay';
import SubmitModal from '@/components/testing/SubmitModal';
import SaveStatusToast from '@/components/SaveStatusToast';
import { PageContainer, Card, LoadingSpinner, EmptyState } from '@/components/ui';


function TestingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, selectedStudent, isLoading: authLoading } = useAuth();
  
  // URL 파라미터에서 시험 정보 추출
  const examType = searchParams.get('examType') || 'FULL';
  const examNum = searchParams.get('examNum') || '1';
  const timerSetting = searchParams.get('timer') || 'on';
  
  // 상태 관리
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, StudentAnswer>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 저장 상태 피드백을 위한 상태
  const [saveToast, setSaveToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    autoClose?: boolean;
    duration?: number;
  }>({
    isVisible: false,
    message: '',
    type: 'info',
    autoClose: true,
    duration: 3000,
  });

  // 토스트 메시지 표시 헬퍼 함수
  const showSaveToast = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning',
    options: { autoClose?: boolean; duration?: number } = {}
  ) => {
    setSaveToast({
      isVisible: true,
      message,
      type,
      autoClose: options.autoClose ?? true,
      duration: options.duration ?? 3000,
    });
  };

  const closeSaveToast = () => {
    setSaveToast(prev => ({
      ...prev,
      isVisible: false,
    }));
  };

  // 시험 초기화
  useEffect(() => {
    console.log('=== useEffect 디버깅 ===');
    console.log('selectedStudent:', selectedStudent);
    console.log('selectedStudent?.id:', selectedStudent?.id);
    console.log('attemptId:', attemptId);
    console.log('isLoading:', isLoading);
    console.log('authLoading:', authLoading);
    console.log('examType:', examType);
    console.log('examNum:', examNum);
    console.log('조건 체크:');
    console.log('  selectedStudent 존재:', !!selectedStudent);
    console.log('  attemptId 없음:', !attemptId);
    console.log('  authLoading 완료:', !authLoading);
    console.log('=========================');
    
    // attemptId가 이미 있으면 중복 초기화 방지
    if (selectedStudent && !attemptId && !authLoading) {
      console.log('✅ 시험 초기화 조건 충족, initializeExam 호출');
      initializeExam();
    } else {
      console.log('❌ 시험 초기화 조건 불충족');
    }
  }, [examType, examNum, selectedStudent?.id, attemptId, authLoading]);

  const initializeExam = async () => {
    try {
      console.log('시험 초기화 시작...');
      setIsLoading(true);
      setError(null);

      if (!selectedStudent) {
        console.log('학생이 선택되지 않음');
        setError('학생을 선택해주세요.');
        setIsLoading(false);
        return;
      }

      console.log(`시험 정보: ${examType} ${examNum}회차, 학생: ${selectedStudent.name}`);

      // 0. 먼저 해당 시험의 기존 완료 상태 확인
      console.log('0. 시험 완료 상태 확인 중...');
      const statusCheckUrl = `/api/exams/with-status?studentId=${selectedStudent.id}&type=${examType}&examnum=${parseInt(examNum)}&grade=${selectedStudent.grade}`;
      
      const statusResponse = await fetch(statusCheckUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const exam = statusData.exams?.find((e: any) => e.examnum === parseInt(examNum) && e.type === examType);
        
        if (exam?.attemptStatus?.isCompleted) {
          console.log('이미 완료된 시험입니다. exam 페이지로 리다이렉트');
          showSaveToast('이미 완료된 시험입니다.', 'info');
          setTimeout(() => router.replace('/exam'), 1500); // toast 표시 후 페이지 이동
          return;
        }
      }

      // 1. examType과 examNum으로 시험 찾기
      console.log('1. 시험 정보 조회 중...');
      const examUrl = `/api/exams/find?type=${examType}&examnum=${parseInt(examNum)}`;
      console.log('API 호출 URL:', examUrl);
      console.log('사용 중인 토큰:', localStorage.getItem('accessToken') ? '있음' : '없음');
      console.log('요청 파라미터:', { 
        examType, 
        examNum: parseInt(examNum), 
        grade: selectedStudent.grade 
      });
      
      const examResponse = await fetch(examUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      console.log('API 응답 상태:', examResponse.status, examResponse.statusText);
      console.log('응답 헤더:', [...examResponse.headers.entries()]);
      
      if (!examResponse.ok) {
        console.log('시험 조회 실패:', examResponse.status, examResponse.statusText);
        const errorText = await examResponse.text();
        console.log('에러 응답 내용:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.log('에러 응답 JSON:', errorJson);
        } catch (e) {
          console.log('에러 응답이 JSON이 아님:', errorText);
        }
        throw new Error(`${examType} ${examNum}회차 시험을 찾을 수 없습니다. (${examResponse.status}: ${errorText})`);
      }

      const examData = await examResponse.json();
      console.log('✅ 시험 데이터 조회 성공:');
      console.log('- 시험 ID:', examData.id);
      console.log('- 시험 제목/정보:', examData.examnum, examData.type, examData.grade);
      console.log('- 문제 데이터 존재 여부:', !!examData.Question);
      console.log('- 문제 개수:', examData.Question ? examData.Question.length : 0);
      if (examData.Question && examData.Question.length > 0) {
        console.log('- 첫 번째 문제 구조:', {
          id: examData.Question[0].id,
          questionNum: examData.Question[0].questionNum,
          content: examData.Question[0].content ? '있음' : '없음',
          imageUrls: examData.Question[0].imageUrls,
          hasAnswer: !!examData.Question[0].Answer
        });
      } else {
        console.error('❌ 문제 데이터가 없습니다!');
      }

      // 2. 시험 시도 시작 (ExamAttempt 생성)
      console.log('2. 시험 시도 생성 중...');
      const attemptResponse = await fetch(`/api/exams/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          examId: examData.id,
          studentId: selectedStudent.id,
        }),
      });

      if (!attemptResponse.ok) {
        console.log('시험 시도 생성 실패:', attemptResponse.status, attemptResponse.statusText);
        const errorText = await attemptResponse.text();
        console.log('에러 응답:', errorText);
        throw new Error(`시험 시작에 실패했습니다. (${attemptResponse.status})`);
      }

      const attemptData = await attemptResponse.json();
      setAttemptId(attemptData.id);
      console.log('✅ 시험 시도 생성 성공:', attemptData);

      // 3. 문제 데이터 변환
      console.log('3. 문제 데이터 변환 중...');
      if (!examData.Question || !Array.isArray(examData.Question)) {
        console.error('❌ 시험 문제 데이터가 올바르지 않습니다:');
        console.error('examData.Question 타입:', typeof examData.Question);
        console.error('examData.Question 값:', examData.Question);
        console.error('전체 examData 구조:', Object.keys(examData));
        throw new Error('시험 문제 데이터가 올바르지 않습니다.');
      }

      console.log(`문제 데이터 배열 크기: ${examData.Question.length}`);
      
      const transformedQuestions: Question[] = examData.Question.map((q: any, index: number) => {
        console.log(`문제 ${index + 1} 변환 중:`, {
          id: q.id,
          questionNum: q.questionNum,
          content: q.content ? `"${q.content.substring(0, 50)}..."` : '내용 없음',
          imageUrls: q.imageUrls,
          answerExists: !!q.Answer,
          answerCount: q.Answer ? q.Answer.length : 0
        });
        
        return {
          id: q.id,
          questionNumber: q.questionNum,
          content: q.content,
          condition: undefined, // 데이터베이스에 condition 컬럼이 없음
          imageUrls: q.imageUrls,
          examType: examData.type,
          examNum: `${examData.examnum}회차 ${examData.type}`,
        };
      });

      console.log(`✅ 문제 데이터 변환 완료: ${transformedQuestions.length}문제`);
      console.log('첫 번째 문제 이미지 URLs:', transformedQuestions[0]?.imageUrls);
      console.log('변환된 첫 번째 문제:', transformedQuestions[0]);

      // 4. 시험 세션 생성
      console.log('4. 시험 세션 생성 중...');
      const newExamSession: ExamSession = {
        examType: examData.type,
        examNum: `${examData.examnum}회차 ${examData.type}`,
        studentId: selectedStudent.id,
        startTime: new Date(),
        duration: examData.duration || 90, // 90분 기본값
        questions: transformedQuestions,
        timerEnabled: true,
      };

      // 5. 상태 업데이트
      console.log('5. 상태 업데이트 중...');
      setExamSession(newExamSession);
      setQuestions(transformedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});

      // 문제 상태 초기화
      const statuses: Record<number, QuestionStatus> = {};
      transformedQuestions.forEach((q) => {
        statuses[q.questionNumber] = {
          questionNumber: q.questionNumber,
          completed: false,
          marked: false,
        };
      });
      setQuestionStatuses(statuses);

      // 캐시 저장 제거 (로컬 캐시 비활성화)
      console.log('6. 캐시 저장 단계 생략 (로컬 캐시 비활성화)');

      console.log('✅ 시험 초기화 완료!');

    } catch (err) {
      console.error('❌ 시험 초기화 실패:', err);
      setError(err instanceof Error ? err.message : '시험을 불러오는 데 실패했습니다. 다시 시도해주세요.');
    } finally {
      console.log('로딩 상태 해제');
      setIsLoading(false);
    }
  };

  // 답안 변경 처리 (타이핑 시에는 로컬 상태만 업데이트)
  const handleAnswerChange = useCallback((answer: string) => {
    if (!questions[currentQuestionIndex] || !attemptId) return;

    const question = questions[currentQuestionIndex];
    const studentAnswer: StudentAnswer = {
      questionId: question.id,
      questionNumber: question.questionNumber,
      answer,
      timestamp: new Date(),
    };

    // 상태 업데이트 (로컬 상태만)
    setAnswers(prev => ({
      ...prev,
      [question.questionNumber]: studentAnswer,
    }));

    // 문제 상태 업데이트
    setQuestionStatuses(prev => ({
      ...prev,
      [question.questionNumber]: {
        ...prev[question.questionNumber],
        completed: !!answer.trim(),
      },
    }));

    // 즉시 저장 및 캐시 저장 제거 (문제 이동 시에만 저장)
  }, [questions, currentQuestionIndex, attemptId]);

  // 백엔드에 답안 저장/업데이트 (실시간 저장)
  const saveAnswerToBackend = async (answer: StudentAnswer, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      const response = await fetch(`/api/exams/responses`, {
        method: 'PUT', // PUT으로 변경하여 업데이트 API 사용
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          attemptId: attemptId,
          questionId: answer.questionId,
          answer: answer.answer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`답안 저장 실패 (${response.status}): ${errorData.error || errorData.details || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('답안 저장/업데이트 완료:', {
        questionNumber: answer.questionNumber,
        answer: answer.answer,
        responseId: result.id,
      });
      
      // 저장 성공 시 사용자에게 시각적 피드백 (선택적)
      // 너무 자주 표시되지 않도록 조건부로 처리
      if (retryCount > 0) {
        // 재시도 후 성공한 경우에만 성공 메시지 표시
        showSaveToast(`${answer.questionNumber}번 문제 답안이 저장되었습니다.`, 'success');
      }
      
    } catch (error) {
      console.error(`Failed to save answer to backend (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // 재시도 로직
      if (retryCount < maxRetries) {
        console.log(`답안 저장 재시도 중... (${retryCount + 1}/${maxRetries})`);
        // 지수 백오프: 1초, 2초, 4초 대기
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return saveAnswerToBackend(answer, retryCount + 1);
      }
      
      // 최대 재시도 횟수 초과 시 사용자에게 알림
      const errorMessage = `${answer.questionNumber}번 문제 답안 저장에 실패했습니다. 네트워크 연결을 확인해주세요.`;
      console.error(errorMessage);
      showSaveToast(errorMessage, 'error');
      
      // 중요: 저장 실패 시에도 로컬 상태는 유지하여 사용자 입력이 손실되지 않도록 함
      // 실제 프로덕션에서는 더 정교한 에러 핸들링이 필요할 수 있음
    }
  };

  // 문제 선택 처리 (이동 전 현재 답안 저장)
  const handleQuestionSelect = useCallback(async (questionNumber: number) => {
    // 현재 문제의 답안이 있으면 저장
    if (questions[currentQuestionIndex] && answers[questions[currentQuestionIndex].questionNumber]) {
      const currentAnswer = answers[questions[currentQuestionIndex].questionNumber];
      if (currentAnswer.answer.trim()) {
        await saveAnswerToBackend(currentAnswer);
      }
    }

    const questionIndex = questions.findIndex(q => q.questionNumber === questionNumber);
    if (questionIndex !== -1) {
      setCurrentQuestionIndex(questionIndex);
    }
  }, [questions, currentQuestionIndex, answers]);

  // 이전 문제로 이동 (이동 전 현재 답안 저장)
  const handlePreviousQuestion = useCallback(async () => {
    // 현재 문제의 답안이 있으면 저장
    if (questions[currentQuestionIndex] && answers[questions[currentQuestionIndex].questionNumber]) {
      const currentAnswer = answers[questions[currentQuestionIndex].questionNumber];
      if (currentAnswer.answer.trim()) {
        await saveAnswerToBackend(currentAnswer);
      }
    }

    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
    }
  }, [currentQuestionIndex, questions, answers]);

  // 다음 문제로 이동 (이동 전 현재 답안 저장)
  const handleNextQuestion = useCallback(async () => {
    // 현재 문제의 답안이 있으면 저장
    if (questions[currentQuestionIndex] && answers[questions[currentQuestionIndex].questionNumber]) {
      const currentAnswer = answers[questions[currentQuestionIndex].questionNumber];
      if (currentAnswer.answer.trim()) {
        await saveAnswerToBackend(currentAnswer);
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
    }
  }, [currentQuestionIndex, questions, answers]);

  // 마킹 토글 처리
  const handleToggleMark = useCallback((questionNumber: number, event: React.MouseEvent) => {
    event.preventDefault();
    setQuestionStatuses(prev => ({
      ...prev,
      [questionNumber]: {
        ...prev[questionNumber],
        marked: !prev[questionNumber]?.marked,
      },
    }));
  }, []);

  // 시험 제출 처리
  const handleSubmit = async (isAutoSubmit = false, isLogout = false) => {
    try {
      console.log('=== handleSubmit 함수 시작 ===');
      console.log('파라미터:', { isAutoSubmit, isLogout, attemptId });
      
      if (!attemptId) {
        throw new Error('시험 세션이 유효하지 않습니다.');
      }

      // 이미 제출 중인 경우 중복 제출 방지
      if (isSubmitting) {
        console.log('이미 제출 중이므로 중복 제출 방지');
        return;
      }

      setIsSubmitting(true); // 제출 상태 플래그 설정
      console.log(`시험 제출 시작: ${isAutoSubmit ? '자동 제출' : '수동 제출'}${isLogout ? ' (로그아웃)' : ''}`);

      // 빈 답안들을 포함하여 모든 답안 최종 제출
      console.log('API 호출 시작:', `/api/exams/attempts/${attemptId}/submit-all`);
      const response = await fetch(`/api/exams/attempts/${attemptId}/submit-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      console.log('API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`제출 API 실패: ${response.status} ${response.statusText}`);
      }

      // 캐시 정리 제거 (로컬 캐시 비활성화)
      console.log('캐시 정리 단계 생략 (로컬 캐시 비활성화)');

      // History 정리 - 뒤로가기로 다시 testing 페이지로 돌아올 수 없도록 함
      if (typeof window !== 'undefined' && window.history.state?.examInProgress) {
        // 현재 히스토리 엔트리를 대체하여 뒤로가기 방지
        window.history.replaceState(null, '', window.location.href);
        console.log('히스토리 정리 완료');
      }

      // 이동 처리
      if (isLogout) {
        // 로그아웃인 경우 직접 메인페이지로 이동
        console.log('로그아웃으로 인한 제출 완료, 메인페이지로 이동');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          window.location.href = '/';
        }
      } else {
        // 일반 제출과 자동 제출 모두 exam 페이지로 이동
        console.log(`${isAutoSubmit ? '자동' : '수동'} 제출 완료, exam 페이지로 이동`);
        router.replace('/exam?refresh=true'); // push 대신 replace 사용하여 히스토리 스택 정리
      }
      
      console.log('=== handleSubmit 함수 완료 ===');
    } catch (error) {
      console.error('=== handleSubmit 함수 에러 ===');
      console.error('Failed to submit exam:', error);
      setIsSubmitting(false); // 오류 시 제출 상태 초기화
      if (!isAutoSubmit) {
        showSaveToast('제출에 실패했습니다. 다시 시도해주세요.', 'error');
      }
    }
  };

  // 시간 종료 처리 - 강제 자동 시험 제출
  const handleTimeUp = useCallback(() => {
    if (timerSetting === 'on') {
      console.log('타이머 종료! 사용자 동의 없이 강제로 시험을 제출합니다...');
      
      // 강제 제출 안내 toast (3초 후 자동으로 닫힘)
      showSaveToast(
        '시험 시간이 종료되었습니다.\n답안이 자동으로 제출됩니다.', 
        'warning',
        { autoClose: true, duration: 3000 } // 3초 후 자동으로 닫힘
      );
      
      // 사용자 동의 없이 즉시 강제 제출 (모달 표시 없음)
      setTimeout(() => {
        console.log('강제 자동 제출 실행 중... (사용자 동의 없음)');
        handleSubmit(true); // 자동 제출 플래그로 호출하여 즉시 exam 페이지로 이동
      }, 2000); // 2초 후 강제 제출
    }
  }, [handleSubmit, timerSetting]);

  // 네비게이션 감지 및 자동 제출 처리
  useEffect(() => {
    if (!attemptId) return;

    let pendingNavigationUrl: string | null = null;
    let hasAddedHistoryEntry = false;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSubmitting) return;
      
      // 페이지 새로고침이나 닫기 시 시험 제출 모달 표시
      event.preventDefault();
      event.returnValue = '시험이 진행 중입니다. 제출하고 페이지를 떠나시겠습니까?';
      
      // 제출 모달 열기
      setIsSubmitModalOpen(true);
    };

    // 페이지가 실제로 언로드될 때 Beacon API로 강제 제출
    const handleUnload = () => {
      if (attemptId && !isSubmitting) {
        console.log('페이지 언로드 감지 - Beacon API로 시험 제출 시도');
        try {
          const data = new FormData();
          data.append('attemptId', attemptId);
          navigator.sendBeacon(`/api/exams/attempts/${attemptId}/submit-beacon`, data);
        } catch (error) {
          console.error('Beacon API 제출 실패:', error);
        }
      }
    };

    // 페이지 가시성 변경 시 자동 제출 (탭 전환, 창 최소화 등)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && attemptId && !isSubmitting) {
        console.log('페이지 숨김 감지 - 자동 제출 시도');
        // 비동기로 자동 제출 시도 (시간 여유 있음)
        handleSubmit(true, false).catch(error => {
          console.error('가시성 변경 시 자동 제출 실패:', error);
        });
      }
    };

    // 링크 클릭 감지 및 인터셉션
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (!link) return;
      
      // Next.js Link 또는 일반 a 태그의 href 속성 확인
      const href = link.getAttribute('href');
      if (!href) return;
      
      // 현재 페이지와 다른 경로로의 이동인지 확인
      const currentPath = window.location.pathname;
      if (href === currentPath || href.includes('testing')) return;
      
      // 외부 링크는 제외
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      
      // 네비게이션 인터셉션
      event.preventDefault();
      event.stopPropagation();
      
      console.log('네비게이션 링크 클릭 감지:', href);
      pendingNavigationUrl = href;
      setIsSubmitModalOpen(true);
    };

    // 브라우저 이벤트 리스너 추가
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload); // 실제 페이지 언로드 시
    document.addEventListener('visibilitychange', handleVisibilityChange); // 페이지 가시성 변경 시
    document.addEventListener('click', handleLinkClick, true); // capture phase에서 감지

    // History API를 사용한 뒤로가기 제어를 위한 더미 히스토리 엔트리 추가
    if (!hasAddedHistoryEntry) {
      window.history.pushState({ examInProgress: true }, '', window.location.href);
      hasAddedHistoryEntry = true;
    }

    // 뒤로가기/앞으로가기 감지
    const handlePopState = (event: PopStateEvent) => {
      // 시험 진행 중인 상태에서 뒤로가기 시도
      if (!isSubmitting) {
        // 다시 앞으로 이동하여 현재 페이지 유지
        window.history.pushState({ examInProgress: true }, '', window.location.href);
        // 제출 모달 표시
        setIsSubmitModalOpen(true);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // 키보드 단축키 감지 (F5, Ctrl+R 등)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F5' || 
          (event.ctrlKey && event.key === 'r') ||
          (event.metaKey && event.key === 'r')) {
        // 새로고침 시 제출 모달 표시
        event.preventDefault();
        setIsSubmitModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // 로그아웃 이벤트 처리
    const handleLogoutEvent = (event: CustomEvent) => {
      if (event.detail?.source === 'logout') {
        pendingNavigationUrl = '/'; // 로그아웃 후 메인페이지로 이동
        setIsSubmitModalOpen(true);
      }
    };

    window.addEventListener('openSubmitModal', handleLogoutEvent as EventListener);

    // 제출 확인 핸들러 수정
    const originalHandleSubmitConfirm = () => {
      console.log('originalHandleSubmitConfirm 호출됨, pendingNavigationUrl:', pendingNavigationUrl);
      setIsSubmitModalOpen(false);
      setIsSubmitting(true); // 제출 중 플래그 설정
      
      // 로그아웃 시나리오 체크
      const isLogoutScenario = pendingNavigationUrl === '/';
      
      if (isLogoutScenario) {
        // 로그아웃 시나리오면 handleSubmit에 isLogout=true 전달
        console.log('로그아웃 시나리오로 제출 처리');
        handleSubmit(false, true);
        pendingNavigationUrl = null;
      } else {
        // 일반 시나리오
        console.log('일반 시나리오로 제출 처리');
        handleSubmit(false).then(() => {
          // 제출 완료 후 대기 중인 네비게이션이 있으면 실행, 없으면 기본 /exam으로 이동
          if (pendingNavigationUrl) {
            console.log('제출 완료, 대기 중인 네비게이션 실행:', pendingNavigationUrl);
            router.replace(pendingNavigationUrl);
            pendingNavigationUrl = null;
          } else {
            console.log('제출 완료, 기본 /exam 페이지로 이동');
            router.replace('/exam?refresh=true');
          }
        }).catch(error => {
          console.error('제출 중 오류 발생:', error);
          setIsSubmitting(false);
        });
      }
    };

    // 전역 변수로 저장하여 컴포넌트에서 접근 가능하게 함
    (window as any).examSubmitConfirm = originalHandleSubmitConfirm;
    (window as any).examSubmitCancel = () => {
      setIsSubmitModalOpen(false);
      pendingNavigationUrl = null;
    };

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openSubmitModal', handleLogoutEvent as EventListener);
      delete (window as any).examSubmitConfirm;
      delete (window as any).examSubmitCancel;
    };
  }, [attemptId, router]);

  // 제출 확인
  const handleSubmitClick = () => {
    console.log('handleSubmitClick 함수 호출됨!');
    setIsSubmitModalOpen(true);
  };

  const handleSubmitConfirm = () => {
    // 전역 핸들러가 있으면 사용, 없으면 기본 동작
    if ((window as any).examSubmitConfirm) {
      (window as any).examSubmitConfirm();
    } else {
      setIsSubmitModalOpen(false);
      handleSubmit(false).then(() => {
        router.replace('/exam?refresh=true');
      }).catch(error => {
        console.error('제출 중 오류 발생:', error);
      });
    }
  };

  const handleSubmitCancel = () => {
    // 전역 핸들러가 있으면 사용, 없으면 기본 동작
    if ((window as any).examSubmitCancel) {
      (window as any).examSubmitCancel();
    } else {
      setIsSubmitModalOpen(false);
    }
  };

  // 로딩 상태
  if (isLoading || authLoading) {
    return (
      <PageContainer maxWidth="full" padding="none">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner 
            size="lg" 
            text={authLoading ? '사용자 정보를 불러오는 중...' : '시험을 준비하고 있습니다...'} 
          />
          <div className="text-sm text-muted mt-2">
            Debug: authLoading={authLoading.toString()}, isLoading={isLoading.toString()}, selectedStudent={selectedStudent?.name || 'null'}
          </div>
        </div>
      </PageContainer>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <PageContainer maxWidth="full" padding="none">
        <div className="min-h-screen flex items-center justify-center">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="오류가 발생했습니다"
            description={error}
            action={
              <button
                onClick={() => router.push('/exam')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                시험 목록으로 돌아가기
              </button>
            }
          />
        </div>
      </PageContainer>
    );
  }

  if (!selectedStudent) {
    return (
      <PageContainer maxWidth="xl">
        <Card>
          <div className="mb-4">
            <label className="block text-sm font-medium text-title mb-2">
              학생 선택
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  // AuthContext의 selectStudent 함수 호출
                  const student = user?.students?.find(s => s.id === e.target.value);
                  if (student) {
                    // selectStudent 함수가 있다면 호출, 없다면 페이지 새로고침
                    window.location.reload();
                  }
                }
              }}
              className="w-full px-4 py-2 rounded-lg border border-input bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">학생을 선택하세요</option>
              {user?.students?.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade}학년)
                </option>
              ))}
            </select>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.questionNumber];
  const answeredQuestions = Object.keys(answers).filter(key => answers[parseInt(key)]?.answer?.trim()).length;

  return (
    <PageContainer maxWidth="full" padding="none">
      {/* 헤더 */}
      <div className="bg-card border-b border-default px-6 py-4 shadow-soft">
        <div className="max-w-7xl mx-auto relative">
          {/* 왼쪽: 타이머 */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <ExamTimer
              initialTime={examSession.duration * 60}
              onTimeUp={handleTimeUp}
              enabled={true}
              initiallyVisible={timerSetting === 'on'}
              startTime={examSession.startTime}
              onTimeWarning={(message, type) => showSaveToast(message, type)}
            />
          </div>
          
          {/* 중앙: 시험 제목 */}
          <div className="text-center">
            <h1 className="text-heading-2 text-title">
              {examSession.examNum}
            </h1>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* 문제 표시 영역 */}
          <div className="flex-1">
            {currentQuestion && (
              <Card className="min-h-[600px]">
                <QuestionDisplay
                  question={currentQuestion}
                  answer={currentAnswer}
                  onAnswerChange={handleAnswerChange}
                  onPreviousQuestion={handlePreviousQuestion}
                  onNextQuestion={handleNextQuestion}
                  canGoPrevious={currentQuestionIndex > 0}
                  canGoNext={currentQuestionIndex < questions.length - 1}
                />
              </Card>
            )}
          </div>

          {/* 사이드바 - 문제 오른쪽에 바로 붙여서 표시 */}
          <div className="w-64 flex-shrink-0">
            <QuestionSidebar
              totalQuestions={questions.length}
              currentQuestion={currentQuestion?.questionNumber || 1}
              questionStatuses={questionStatuses}
              onQuestionSelect={handleQuestionSelect}
              onToggleMark={handleToggleMark}
              onSubmitExam={handleSubmitClick}
              isFloating={false}
            />
          </div>
        </div>
      </div>

      {/* 제출 확인 모달 */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        totalQuestions={questions.length}
        answeredQuestions={answeredQuestions}
        questionStatuses={questionStatuses}
        onConfirm={handleSubmitConfirm}
        onCancel={handleSubmitCancel}
      />

      {/* 저장 상태 토스트 */}
      <SaveStatusToast
        isVisible={saveToast.isVisible}
        message={saveToast.message}
        type={saveToast.type}
        onClose={closeSaveToast}
        autoClose={saveToast.autoClose}
        duration={saveToast.duration}
      />
    </PageContainer>
  );
}

export default function TestingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-page">
        <div className="bg-card border-b border-default px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-title text-center">
              시험 준비 중...
            </h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-body">시험을 준비하고 있습니다...</div>
            </div>
          </div>
        </div>
      </div>
    }>
      <TestingPageContent />
    </Suspense>
  );
}