'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { getApiUrl } from '@/utils/api';
import { PageContainer, Card, Button, LoadingSpinner, EmptyState } from '@/components/ui';
import WithSidebar from '@/components/layouts/WithSidebar';
import ExamSidebar from '@/components/sidebars/ExamSidebar';

interface ExamData {
  id: string;
  examnum: number;
  grade: number;
  type: 'FULL' | 'HALF' | 'BEGINNER';
  duration: number;
  isActive: boolean;
  questionCount: number;
  attemptStatus: {
    hasAttempted: boolean;
    isCompleted: boolean;
    score: number | null;
    correctAnswers: number | null;
    submittedAt: string | null;
  };
}

interface ExamsResponse {
  exams: ExamData[];
  pagination: {
    page: number;
    limit: number;
    totalExams: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function ExamPageContent() {
  const [selectedType, setSelectedType] = useState<'all' | 'FULL' | 'HALF' | 'BEGINNER'>('all');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [pagination, setPagination] = useState<ExamsResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 각 타입별 로드된 시험들과 페이지네이션 상태 관리
  const [allExams, setAllExams] = useState<ExamData[]>([]);
  const [fullExams, setFullExams] = useState<ExamData[]>([]);
  const [halfExams, setHalfExams] = useState<ExamData[]>([]);
  const [beginnerExams, setBeginnerExams] = useState<ExamData[]>([]);
  
  const [allPagination, setAllPagination] = useState<ExamsResponse['pagination'] | null>(null);
  const [fullPagination, setFullPagination] = useState<ExamsResponse['pagination'] | null>(null);
  const [halfPagination, setHalfPagination] = useState<ExamsResponse['pagination'] | null>(null);
  const [beginnerPagination, setBeginnerPagination] = useState<ExamsResponse['pagination'] | null>(null);
  
  // 각 타입별 '더 보기' 버튼 표시 상태 관리
  const [showMoreStates, setShowMoreStates] = useState<{
    all: boolean;
    FULL: boolean;
    HALF: boolean;
    BEGINNER: boolean;
  }>({ all: true, FULL: true, HALF: true, BEGINNER: true });
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, selectedStudent, isLoading: authLoading, selectStudent } = useAuth();

  // 현재 선택된 타입에 따른 시험 목록과 페이지네이션 가져오기
  const getCurrentExams = () => {
    switch (selectedType) {
      case 'FULL': return fullExams;
      case 'HALF': return halfExams;
      case 'BEGINNER': return beginnerExams;
      default: return allExams;
    }
  };

  const getCurrentPagination = () => {
    switch (selectedType) {
      case 'FULL': return fullPagination;
      case 'HALF': return halfPagination;
      case 'BEGINNER': return beginnerPagination;
      default: return allPagination;
    }
  };

  // 시험 목록 로드 (타입별로 관리)
  const loadExams = useCallback(async (type: 'all' | 'FULL' | 'HALF' | 'BEGINNER', page: number = 1, append: boolean = false) => {
    if (authLoading || !isAuthenticated) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '5', // 5개씩 로드
      });

      // 학생이 선택된 경우에만 학년 필터링 적용
      if (selectedStudent?.id) {
        params.append('studentId', selectedStudent.id);
        params.append('grade', selectedStudent.grade.toString());
      }

      if (type !== 'all') {
        params.append('type', type);
      }

      const response = await fetch(`${getApiUrl()}/api/exams/with-status?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ExamsResponse = await response.json();
        
        // 타입별 상태 업데이트
        switch (type) {
          case 'FULL':
            if (append) {
              setFullExams(prev => [...prev, ...data.exams]);
            } else {
              setFullExams(data.exams);
            }
            setFullPagination(data.pagination);
            break;
          case 'HALF':
            if (append) {
              setHalfExams(prev => [...prev, ...data.exams]);
            } else {
              setHalfExams(data.exams);
            }
            setHalfPagination(data.pagination);
            break;
          case 'BEGINNER':
            if (append) {
              setBeginnerExams(prev => [...prev, ...data.exams]);
            } else {
              setBeginnerExams(data.exams);
            }
            setBeginnerPagination(data.pagination);
            break;
          default: // 'all'
            if (append) {
              setAllExams(prev => [...prev, ...data.exams]);
            } else {
              setAllExams(data.exams);
            }
            setAllPagination(data.pagination);
            break;
        }
      }
    } catch (error) {
      console.error('시험 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedStudent, authLoading]);

  // 초기 로드 시 모든 타입의 데이터 로드
  useEffect(() => {
    // 로딩 중일 때는 아무것도 하지 않음
    if (authLoading) {
      return;
    }
    
    if (isAuthenticated) {
      // 학생이 변경되면 모든 시험 데이터를 초기화하고 새로 로드
      setAllExams([]);
      setFullExams([]);
      setHalfExams([]);
      setBeginnerExams([]);
      
      loadExams('all', 1, false);
      loadExams('FULL', 1, false);
      loadExams('HALF', 1, false);
      loadExams('BEGINNER', 1, false);
    }
  }, [isAuthenticated, selectedStudent?.id, loadExams, refreshKey, pathname, authLoading]);

  // 타입 변경 시 해당 타입의 데이터가 없으면 로드
  useEffect(() => {
    // 로딩 중일 때는 아무것도 하지 않음
    if (authLoading) {
      return;
    }
    
    if (isAuthenticated) {
      const currentExams = getCurrentExams();
      if (currentExams.length === 0) {
        loadExams(selectedType, 1, false);
      }
    }
  }, [selectedType, isAuthenticated, selectedStudent, authLoading]);

  // 페이지 포커스 시 데이터 새로고침
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !authLoading && isAuthenticated) {
        setRefreshKey(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, authLoading]);

  // refresh 파라미터 감지 시 데이터 새로고침
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true' && !authLoading && isAuthenticated) {
      console.log('시험 제출 후 데이터 새로고침 트리거됨');
      setRefreshKey(prev => prev + 1);
      
      // URL에서 refresh 파라미터 제거 (브라우저 히스토리 정리)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, authLoading, isAuthenticated]);

  // 스크롤 추가 로딩
  const loadMoreExams = () => {
    const currentPagination = getCurrentPagination();
    if (currentPagination?.hasNext) {
      loadExams(selectedType, currentPagination.page + 1, true);
    }
  };

  // 현재 선택된 타입의 시험 목록
  const filteredExams = getCurrentExams();

  // 모의고사 유형에 따른 스타일 반환
  const getExamTypeStyle = (type: ExamData['type']) => {
    switch (type) {
      case 'FULL':
        return 'bg-white dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-2 border-blue-600 dark:border-blue-700 shadow-sm';
      case 'HALF':
        return 'bg-white dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-600 dark:border-green-700 shadow-sm';
      case 'BEGINNER':
        return 'bg-white dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-2 border-purple-600 dark:border-purple-700 shadow-sm';
    }
  };

  // 모의고사 유형에 따른 제목 텍스트 반환
  const getExamTitle = (examnum: number, type: ExamData['type']) => {
    const typeStyle = getExamTypeStyle(type);
    const typeText = type === 'FULL' ? '풀' : type === 'HALF' ? '하프' : '비기너';
    
    return (
      <>
        <span className={`${typeStyle} px-2 py-1 rounded-md font-semibold text-xl mr-1 inline-flex items-center`}>
          {typeText}
        </span>
        {' '}모의고사 {examnum}회차
      </>
    );
  };

  // 응시하기 버튼 클릭 핸들러
  const handleExamStart = (exam: ExamData) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // 이미 응시한 시험인지 확인 (버튼이 이미 비활성화되어 있으므로 단순 return)
    if (exam.attemptStatus.hasAttempted && exam.attemptStatus.isCompleted) {
      return;
    }

    router.push(`/exam/${exam.id}/waiting`);
  };

  // 동영상 강의 버튼 클릭 핸들러
  const handleVideoClick = (exam: ExamData) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // 시험 완료 후에만 접근 가능 (버튼이 이미 비활성화되어 있으므로 단순 return)
    if (!exam.attemptStatus.isCompleted) {
      return;
    }

    router.push(`/explanation/${exam.id}/video`);
  };

  // 해설 답지 버튼 클릭 핸들러
  const handleDocumentClick = (exam: ExamData) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // 시험 완료 후에만 접근 가능 (버튼이 이미 비활성화되어 있으므로 단순 return)
    if (!exam.attemptStatus.isCompleted) {
      return;
    }

    router.push(`/explanation/${exam.id}/document`);
  };

  // 인증 로딩 중이거나 데이터 로딩 중인 경우
  if (authLoading || (isLoading && filteredExams.length === 0)) {
    return (
      <PageContainer maxWidth="xl">
        <LoadingSpinner text={authLoading ? '인증 정보를 확인하는 중...' : '시험 목록을 불러오는 중...'} />
      </PageContainer>
    );
  }

  // 선택된 학생이 없는 경우
  if (!authLoading && isAuthenticated && !selectedStudent) {
    return (
      <PageContainer maxWidth="xl">
        <WithSidebar sidebar={<ExamSidebar />}> 
          <div className="space-y-6">
            {/* 학생 선택 - 간소화 (상단 우측) */}
            <div className="flex justify-end">
              <select
                value={(selectedStudent as any)?.id || ''}
                onChange={(e) => {
                  const student = (user?.students ?? []).find((s: any) => s.id === e.target.value);
                  if (student) {
                    selectStudent(student);
                  }
                }}
                className="w-56 px-3 py-2 rounded-md border border-input bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">학생 선택</option>
                {(user?.students ?? []).map((student: any) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.grade}학년)
                  </option>
                ))}
              </select>
            </div>

            {/* 기존 중앙 카드형 학생 선택 제거 */}
            
            {/* 필터 버튼 */}
            <div className="flex justify-end">
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    selectedType === 'all'
                      ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md'
                      : 'bg-white dark:bg-hover text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setSelectedType('FULL')}
                  className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    selectedType === 'FULL'
                      ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md'
                      : 'bg-white dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-blue-800/40 hover:shadow-sm'
                  }`}
                >
                  풀 모고
                </button>
                <button
                  onClick={() => setSelectedType('HALF')}
                  className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    selectedType === 'HALF'
                      ? 'bg-green-600 dark:bg-green-700 text-white shadow-md'
                      : 'bg-white dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-white dark:hover:bg-green-800/40 hover:shadow-sm'
                  }`}
                >
                  하프 모고
                </button>
                <button
                  onClick={() => setSelectedType('BEGINNER')}
                  className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    selectedType === 'BEGINNER'
                      ? 'bg-purple-600 dark:bg-purple-700 text-white shadow-md'
                      : 'bg-white dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-white dark:hover:bg-purple-800/40 hover:shadow-sm'
                  }`}
                >
                  비기너 모고
                </button>
              </div>
            </div>

            {/* 시험 목록 */}
            <div className="space-y-6">
              {filteredExams.map((exam) => (
                <div key={exam.id} className="bg-card rounded-lg shadow-md p-6 border border-default hover:bg-muted dark:hover:bg-hover transition-all group">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* 시험 정보 */}
                    <div className="flex-1 mb-4 lg:mb-0">
                      <h3 className="text-xl font-semibold text-title mb-2 group-hover:text-title">
                        {getExamTitle(exam.examnum, exam.type)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-body group-hover:text-body">
                        <span>학년: {exam.grade}학년</span>
                        <span>문제 수: {exam.questionCount}문제</span>
                        <span>시간: {exam.duration}분</span>
                        {exam.attemptStatus.hasAttempted && exam.attemptStatus.isCompleted && typeof exam.attemptStatus.score === 'number' && (
                          <>
                            <span>정답 수: {exam.attemptStatus.correctAnswers !== null ? exam.attemptStatus.correctAnswers : 0}개</span>
                            <span>점수: {exam.attemptStatus.score}점</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 버튼 영역 */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* 응시하기 버튼 - 학생 선택 필요 */}
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="px-6 py-3 rounded-md font-medium transition-colors bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed"
                        disabled
                      >
                        학생 선택 필요
                      </button>

                      {/* 동영상 강의 버튼 - 비활성화 */}
                      <button
                        className="px-4 py-3 rounded-md font-medium transition-colors bg-muted dark:bg-hover text-muted cursor-not-allowed"
                        disabled
                      >
                        동영상 강의
                      </button>

                      {/* 해설 답지 버튼 - 비활성화 */}
                      <button
                        className="px-4 py-3 rounded-md font-medium transition-colors bg-muted dark:bg-hover text-muted cursor-not-allowed"
                        disabled
                      >
                        해설 답지
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 더 보기 버튼 */}
            {(() => {
              const currentPagination = getCurrentPagination();
              const shouldShowMore = currentPagination?.hasNext && filteredExams.length >= 5 && showMoreStates[selectedType];
              
              return shouldShowMore && (
                <div className="text-center">
                  <button
                    onClick={loadMoreExams}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {isLoading ? '로딩 중...' : '더 보기'}
                  </button>
                </div>
              );
            })()}

            {/* 빈 상태 */}
            {!isLoading && filteredExams.length === 0 && (
              <div className="text-center py-12">
                <p className="text-body text-lg">조건에 맞는 시험이 없습니다.</p>
              </div>
            )}
          </div>
          
          {/* 로그인 모달 */}
          <LoginRequiredModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)} 
          />
        </WithSidebar>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <WithSidebar sidebar={<ExamSidebar />}> 
        <div className="space-y-6">
        {/* 학생 선택 - 간소화 (상단 우측) */}
        <div className="flex justify-end">
          <select
            value={(selectedStudent as any)?.id || ''}
            onChange={(e) => {
              const student = (user?.students ?? []).find((s: any) => s.id === e.target.value);
              if (student) {
                selectStudent(student);
              }
            }}
            className="w-56 px-3 py-2 rounded-md border border-input bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">학생 선택</option>
            {(user?.students ?? []).map((student: any) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.grade}학년)
              </option>
            ))}
          </select>
        </div>

        {/* 중앙 카드형 학생 선택 UI 제거됨 */}
        
        {/* 필터 버튼 */}
        <div className="flex justify-end">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                selectedType === 'all'
                  ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md'
                  : 'bg-white dark:bg-hover text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedType('FULL')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                selectedType === 'FULL'
                  ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md'
                  : 'bg-white dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-blue-800/40 hover:shadow-sm'
              }`}
            >
              풀 모고
            </button>
            <button
              onClick={() => setSelectedType('HALF')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                selectedType === 'HALF'
                  ? 'bg-green-600 dark:bg-green-700 text-white shadow-md'
                  : 'bg-white dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-white dark:hover:bg-green-800/40 hover:shadow-sm'
              }`}
            >
              하프 모고
            </button>
            <button
              onClick={() => setSelectedType('BEGINNER')}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                selectedType === 'BEGINNER'
                  ? 'bg-purple-600 dark:bg-purple-700 text-white shadow-md'
                  : 'bg-white dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-white dark:hover:bg-purple-800/40 hover:shadow-sm'
              }`}
            >
              비기너 모고
            </button>
          </div>
        </div>

        {/* 시험 목록 */}
        <div className="space-y-6">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-card rounded-lg shadow-md p-6 border border-default hover:bg-muted dark:hover:bg-hover transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* 시험 정보 */}
                <div className="flex-1 mb-4 lg:mb-0">
                  <h3 className="text-xl font-semibold text-title mb-2 group-hover:text-title">
                    {getExamTitle(exam.examnum, exam.type)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-body group-hover:text-body">
                    <span>문제 수: {exam.questionCount}문제</span>
                    <span>시간: {exam.duration}분</span>
                    {exam.attemptStatus.hasAttempted && exam.attemptStatus.isCompleted && typeof exam.attemptStatus.score === 'number' && (
                      <>
                        <span>정답 수: {exam.attemptStatus.correctAnswers !== null ? exam.attemptStatus.correctAnswers : 0}개</span>
                        <span>점수: {exam.attemptStatus.score}점</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 버튼 영역 */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* 응시하기 버튼 */}
                  <button
                    onClick={() => handleExamStart(exam)}
                    disabled={exam.attemptStatus.isCompleted}
                    className={`px-6 py-3 rounded-md font-medium transition-colors ${
                      exam.attemptStatus.isCompleted
                        ? 'bg-muted dark:bg-hover text-muted cursor-not-allowed'
                        : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                    }`}
                  >
                    {exam.attemptStatus.isCompleted ? '응시 완료' : '응시하기'}
                  </button>

                  {/* 동영상 강의 버튼 - 시험 완료 후 활성화 */}
                  <button
                    onClick={() => handleVideoClick(exam)}
                    disabled={!exam.attemptStatus.isCompleted}
                    className={`px-4 py-3 rounded-md font-medium transition-colors ${
                      exam.attemptStatus.isCompleted
                        ? 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600'
                        : 'bg-muted dark:bg-hover text-muted cursor-not-allowed'
                    }`}
                  >
                    동영상 강의
                  </button>

                  {/* 해설 답지 버튼 - 시험 완료 후 활성화 */}
                  <button
                    onClick={() => handleDocumentClick(exam)}
                    disabled={!exam.attemptStatus.isCompleted}
                    className={`px-4 py-3 rounded-md font-medium transition-colors ${
                      exam.attemptStatus.isCompleted
                        ? 'bg-purple-600 dark:bg-purple-700 text-white hover:bg-purple-700 dark:hover:bg-purple-600'
                        : 'bg-muted dark:bg-hover text-muted cursor-not-allowed'
                    }`}
                  >
                    해설 답지
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 더 보기 버튼 - 현재 타입의 시험이 5개 이상이고 다음 페이지가 있을 때만 표시 */}
        {(() => {
          const currentPagination = getCurrentPagination();
          const shouldShowMore = currentPagination?.hasNext && filteredExams.length >= 5 && showMoreStates[selectedType];
          
          return shouldShowMore && (
            <div className="text-center">
              <button
                onClick={loadMoreExams}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {isLoading ? '로딩 중...' : '더 보기'}
              </button>
            </div>
          );
        })()}

        {/* 빈 상태 */}
        {!isLoading && filteredExams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-body text-lg">조건에 맞는 시험이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 로그인 모달 */}
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      </WithSidebar>
    </PageContainer>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={
      <PageContainer maxWidth="xl">
        <LoadingSpinner text="시험 목록을 불러오는 중..." />
      </PageContainer>
    }>
      <ExamPageContent />
    </Suspense>
  );
} 