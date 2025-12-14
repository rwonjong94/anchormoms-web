'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { convertLatexToHtml } from '@/lib/questionLoader';
import { processImages, getImageHash, parseImageSrc, calculateImageSize } from '@/lib/imageUtils';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// 개별 이미지 컴포넌트
interface ExplanationImageProps {
  imageUrl: string;
  questionNum: number;
  imageIndex: number;
}

function ExplanationImage({ imageUrl, questionNum, imageIndex }: ExplanationImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // {ratio} 문법 파싱 및 크기 계산
  const { src: cleanSrc, ratio } = parseImageSrc(imageUrl);
  const imageWidth = calculateImageSize(ratio);
  
  if (imageError) {
    return (
      <div className="text-center">
        <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 text-xs rounded">
          이미지 로드 실패: {cleanSrc}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex justify-center">
      <div className="max-w-full">
        <img 
          src={cleanSrc}
          alt={`문제 ${questionNum}번 이미지 ${imageIndex}`}
          className="h-auto rounded-lg shadow-sm border border-default"
          style={{
            maxWidth: `min(${imageWidth}px, 100%)`,
            width: '100%'
          }}
          onLoad={() => {
            console.log(`이미지 로드 성공: ${cleanSrc} (크기: ${imageWidth}px, 비율: ${ratio}%)`);
            setImageLoaded(true);
            setImageError(false);
          }}
          onError={(e) => {
            console.error(`이미지 로드 실패: ${cleanSrc}`);
            setImageError(true);
            setImageLoaded(false);
          }}
        />
      </div>
    </div>
  );
}

interface QuestionData {
  id: string;
  questionNum: number;
  content: string;
  imageUrls?: string[];
  Answer: {
    answer: string;
    explanation?: string;
  }[];
}

interface StudentResponseData {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

interface ExamResultData {
  id: string;
  Exam: {
    id: string;
    examnum: number;
    type: string;
    duration: number;
  };
  Student: {
    id: string;
    name: string;
  };
  score: number;
  StudentResponse: StudentResponseData[];
}

interface QuestionWithResult extends QuestionData {
  studentAnswer?: string;
  isCorrect: boolean;
}

type FilterType = 'ALL' | 'CORRECT' | 'INCORRECT';


function ExplanationDocumentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, selectedStudent, isLoading: authLoading } = useAuth();
  
  const examId = params.id as string;
  const [currentQuestionNum, setCurrentQuestionNum] = useState(1);
  const [questions, setQuestions] = useState<QuestionWithResult[]>([]);
  const [examResult, setExamResult] = useState<ExamResultData | null>(null);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL 파라미터에서 문제 번호 가져오기
  useEffect(() => {
    const questionParam = searchParams.get('question');
    if (questionParam) {
      setCurrentQuestionNum(parseInt(questionParam));
    }
  }, [searchParams]);

  // 시험 결과 데이터 로드
  useEffect(() => {
    if (!authLoading && selectedStudent) {
      loadExamResult();
    }
  }, [examId, selectedStudent, authLoading]);

  const loadExamResult = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedStudent) {
        setError('학생을 선택해주세요.');
        return;
      }

      // 1. 학생의 시험 응시 기록 조회
      const attemptsResponse = await fetch(`/api/exams/attempts/student/${selectedStudent.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!attemptsResponse.ok) {
        throw new Error('시험 응시 기록을 불러올 수 없습니다.');
      }

      const attempts = await attemptsResponse.json();
      
      // 해당 시험의 완료된 응시 기록 찾기
      const targetAttempt = attempts.find((attempt: any) => 
        attempt.Exam.id === examId && attempt.isCompleted
      );

      if (!targetAttempt) {
        setError('해당 시험의 응시 기록을 찾을 수 없습니다.');
        return;
      }

      // 2. 상세 시험 결과 조회 (학생 답안 포함)
      const resultResponse = await fetch(`/api/exams/attempts/${targetAttempt.id}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!resultResponse.ok) {
        throw new Error('시험 결과를 불러올 수 없습니다.');
      }

      const resultData = await resultResponse.json();
      setExamResult(resultData);

      // 3. 시험 문제 데이터 조회
      const questionsResponse = await fetch(`/api/exams/${examId}/questions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!questionsResponse.ok) {
        throw new Error('문제 데이터를 불러올 수 없습니다.');
      }

      const questionsData = await questionsResponse.json();

      // 디버깅: 첫 번째 문제의 Answer 데이터 확인
      if (questionsData.length > 0) {
        console.log('First question Answer data:', questionsData[0].Answer);
      }

      // 4. 학생 답안과 정답 매핑
      const questionsWithResults: QuestionWithResult[] = questionsData.map((question: QuestionData) => {
        const studentResponse = resultData.StudentResponse.find(
          (response: StudentResponseData) => response.questionId === question.id
        );

        return {
          ...question,
          studentAnswer: studentResponse?.answer || '',
          isCorrect: studentResponse?.isCorrect || false,
        };
      });

      setQuestions(questionsWithResults);

    } catch (err) {
      console.error('시험 결과 로드 실패:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 문제 데이터
  const currentQuestion = questions.find(q => q.questionNum === currentQuestionNum);

  // 필터링된 문제 목록
  const filteredQuestions = questions.filter(question => {
    switch (filter) {
      case 'CORRECT':
        return question.isCorrect;
      case 'INCORRECT':
        return !question.isCorrect;
      default:
        return true;
    }
  });

  // 문제 선택 핸들러
  const handleQuestionSelect = (questionNum: number) => {
    setCurrentQuestionNum(questionNum);
    // URL 업데이트
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('question', questionNum.toString());
    window.history.pushState({}, '', newUrl.toString());
  };

  // 컨텐츠 렌더링 함수
  const renderContent = (content: string) => {
    const cleanedContent = content
      // 명확한 문제 번호 패턴만 제거 (앞뒤 공백 포함한 정확한 형태만)
      .replace(/^\s*문제\s+\d+\s*번\s*:\s*/i, '')
      .replace(/^\s*문제\s+\d+\s*번\s*\.\s*/i, '')
      .replace(/^\s*\d+\s*번\s*:\s*/i, '')
      .replace(/^\s*\d+\s*번\s*\.\s*/i, '')
      .replace(/^\s*Problem\s+\d+\s*:\s*/i, '')
      .trim();
    
    return (
      <div className="prose prose-lg max-w-none prose-gray dark:prose-invert prose-headings:text-title prose-p:text-body prose-p:leading-relaxed prose-strong:text-title">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={createMarkdownComponents({
            questionNumber: currentQuestion?.questionNum,
            imageErrorPrefix: '문제 이미지 로드 실패',
            blockquoteStyle: 'gray'
          })}
        >
          {cleanedContent}
        </ReactMarkdown>
      </div>
    );
  };

  // 여러 이미지 렌더링 함수
  const renderImages = (imageUrls: string[]) => {
    const processedImages = processImages(imageUrls);
    
    if (processedImages.length === 0) {
      return null;
    }
    
    return (
      <div className="space-y-4">
        {processedImages.map((imageUrl, index) => (
          <ExplanationImage
            key={`image-${index}-${getImageHash(imageUrl)}`}
            imageUrl={imageUrl}
            questionNum={currentQuestion?.questionNum || 0}
            imageIndex={index + 1}
          />
        ))}
      </div>
    );
  };

  // 해설 렌더링 함수
  const renderExplanation = (explanation: string) => {
    return (
      <div className="prose prose-lg max-w-none prose-gray dark:prose-invert prose-headings:text-title prose-p:text-body prose-p:leading-relaxed prose-strong:text-title">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={createMarkdownComponents({
            questionNumber: currentQuestion?.questionNum,
            imageErrorPrefix: '해설 이미지 로드 실패',
            blockquoteStyle: 'default'
          })}
        >
          {explanation}
        </ReactMarkdown>
      </div>
    );
  };

  // 로딩 상태
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-body">해설 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={() => router.push('/exam')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            시험 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!examResult || !currentQuestion) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="text-body">데이터를 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      {/* 헤더 */}
      <div className="bg-card border-b border-default px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-title text-center">
            {examResult.Exam.examnum}회차 {examResult.Exam.type} 모의고사 해설
          </h1>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1">
          {/* 문제 카드 */}
          <div className="bg-card rounded-lg shadow-sm border-default p-8 mb-6">
            {/* 문제 번호 헤더 - 정오답 표시를 오른쪽으로 이동 */}
            <div className="mb-6 pb-4 border-b border-input flex items-center justify-between">
              <h2 className="text-xl font-bold text-title">
                문제 {currentQuestion.questionNum}번
              </h2>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                currentQuestion.isCorrect 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}>
                {currentQuestion.isCorrect ? '정답' : '오답'}
              </div>
            </div>

            {/* 문제 내용 */}
            <div className="mb-6">
              {renderContent(currentQuestion.content)}
            </div>

          </div>

          {/* 정답 비교 카드 */}
          <div className="bg-card rounded-lg shadow-sm border-default p-6 mb-6">
            <h3 className="text-lg font-semibold text-title mb-4">정답 비교</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 정답 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-green-700 dark:text-green-400">정답</label>
                <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="text-green-800 dark:text-green-300 font-medium">
                    {currentQuestion.Answer?.[0]?.answer || '정답 정보 없음'}
                  </div>
                </div>
              </div>

              {/* 학생 답안 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-body">내 답안</label>
                <div className={`p-4 border rounded-lg ${
                  currentQuestion.isCorrect 
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' 
                    : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                }`}>
                  <div className={`font-medium ${
                    currentQuestion.isCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                  }`}>
                    {currentQuestion.studentAnswer || '미응답'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 해설 카드 */}
          {currentQuestion.Answer?.[0]?.explanation && (
            <div className="bg-card rounded-lg shadow-sm border-default p-6">
              <h3 className="text-lg font-semibold text-title mb-4">해설</h3>
              <div>
                {renderExplanation(currentQuestion.Answer[0].explanation)}
              </div>
            </div>
          )}
        </div>

        {/* 사이드바 - 문제 목차 */}
        <div className="w-60 bg-card rounded-lg shadow-sm border-default p-4 h-fit sticky top-8">
          <h3 className="text-base font-semibold text-title mb-3">문제 목차</h3>
          
          {/* 필터 버튼 */}
          <div className="mb-3 space-y-1.5">
            <button
              onClick={() => setFilter('ALL')}
              className={`w-full px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-body hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              모든 문제 ({questions.length}문제)
            </button>
            
            <button
              onClick={() => setFilter('CORRECT')}
              className={`w-full px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'CORRECT'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-body hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              맞힌 문제 ({questions.filter(q => q.isCorrect).length}문제)
            </button>
            
            <button
              onClick={() => setFilter('INCORRECT')}
              className={`w-full px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'INCORRECT'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-body hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              틀린 문제 ({questions.filter(q => !q.isCorrect).length}문제)
            </button>
          </div>

          {/* 문제 목록 - 4x4 격자 형태 */}
          <div className="max-h-[28rem] overflow-y-auto">
            {Array.from({ length: Math.ceil(filteredQuestions.length / 4) }, (_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-1.5 mb-1.5">
                {filteredQuestions.slice(rowIndex * 4, (rowIndex + 1) * 4).map((question) => (
                  <button
                    key={question.id}
                    onClick={() => handleQuestionSelect(question.questionNum)}
                    className={`aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-colors ${
                      currentQuestionNum === question.questionNum
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400 text-blue-800 dark:text-blue-300'
                        : question.isCorrect
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                    title={`문제 ${question.questionNum}번 - ${question.isCorrect ? '정답' : '오답'}`}
                  >
                    {question.questionNum}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* 통계 정보 */}
          <div className="mt-4 pt-3 border-t border-input">
            <div className="text-center space-y-1.5">
              <div className="text-xs text-body">
                전체 점수: <span className="font-semibold text-blue-600 dark:text-blue-400">{examResult.score}점</span>
              </div>
              <div className="text-xs text-muted">
                정답률: {Math.round((questions.filter(q => q.isCorrect).length / questions.length) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplanationDocumentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-page">
        <div className="bg-card border-b border-default px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-title text-center">
              해설 로드 중...
            </h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-body">해설 데이터를 불러오는 중...</div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ExplanationDocumentPageContent />
    </Suspense>
  );
}
