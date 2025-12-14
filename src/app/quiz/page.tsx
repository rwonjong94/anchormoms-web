'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer, PageHeader, Card, Button, Badge, Grid, Input, EmptyState, LoadingSpinner } from '@/components/ui';
import MonopolyBoard from '@/components/quiz/MonopolyBoard';

interface QuizType {
  id: string;
  key: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

// 퀴즈 문제 타입 정의
interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  type: string;
  difficulty: string;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function QuizPage() {
  const { user, selectedStudent, selectStudent, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedQuizType, setSelectedQuizType] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [memo, setMemo] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQuizInterface, setShowQuizInterface] = useState(false);
  const [progress, setProgress] = useState<{ boardSize: number; currentTile: number; trophies: number } | null>(null);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);

  // 디버깅용 로그
  console.log('🔍 QuizPage 렌더링:', {
    user: user ? `${user.name} (${user.id})` : 'null',
    selectedStudent: selectedStudent ? `${selectedStudent.name} (${selectedStudent.id})` : 'null',
    quizTypesLength: quizTypes.length,
    authLoading,
    showQuizInterface
  });

  // 현재 문제 가져오기
  const currentQuestion = questions[currentQuestionIndex];

  // 유형 로드
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        console.log('📡 퀴즈 유형 로드 시작...');
        const res = await fetch('/api/quiz/types');
        console.log('📡 퀴즈 유형 응답:', res.status, res.statusText);

        if (res.ok) {
          const data = await res.json();
          console.log('📦 받은 퀴즈 유형 데이터:', data);
          setQuizTypes(data);
        } else {
          console.error('❌ 퀴즈 유형 로드 실패:', res.status, res.statusText);
        }
      } catch (e) {
        console.error('💥 유형 로드 중 오류:', e);
      }
    };
    fetchTypes();
  }, []);

  // 학생 선택
  const handleStudentSelect = (studentId: string) => {
    console.log('👤 학생 선택:', studentId);
    if (studentId) {
      selectStudent(studentId);
      console.log('✅ 학생 선택 완료');
    } else {
      console.log('❌ 학생 선택 해제');
    }
  };

  // 퀴즈 유형 선택
  const handleQuizTypeSelect = async (typeKey: string) => {
    console.log('🔍 handleQuizTypeSelect 시작:', typeKey);

    if (!selectedStudent) {
      console.log('❌ 학생 선택되지 않음');
      alert('퀴즈를 시작하려면 먼저 학생을 선택해주세요.');
      return;
    }
    console.log('✅ 선택된 학생:', selectedStudent);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('❌ 토큰 없음');
      alert('로그인이 필요합니다. 먼저 로그인해주세요.');
      router.push('/login');
      return;
    }
    console.log('✅ 토큰 존재:', token.substring(0, 20) + '...');

    setSelectedQuizType(typeKey);
    setLoading(true);
    console.log('🔄 로딩 시작');

    try {
      // 1) 사용 가능한 세트 조회 (카테고리: typeKey)
      console.log('📡 세트 목록 조회 시작:', `/api/quiz/sets/available?category=${encodeURIComponent(typeKey)}`);

      const listRes = await fetch(`/api/quiz/sets/available?category=${encodeURIComponent(typeKey)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📡 세트 목록 응답:', listRes.status, listRes.statusText);

      if (!listRes.ok) {
        const errorText = await listRes.text();
        console.error('❌ 세트 목록 조회 실패:', listRes.status, errorText);
        alert(`세트 목록 조회에 실패했습니다: ${listRes.status} ${errorText}`);
        setLoading(false);
        return;
      }

      const sets = await listRes.json();
      console.log('📦 받은 세트 데이터:', sets);

      if (!Array.isArray(sets) || sets.length === 0) {
        console.log('❌ 세트 없음');
        alert('해당 유형의 세트가 아직 준비되지 않았습니다.');
        setLoading(false);
        return;
      }

      const targetSet = sets[0];
      console.log('🎯 선택된 세트:', targetSet);

      // 2) 세션 시작
      console.log('📡 세션 시작 요청:', `/api/quiz/sets/${targetSet.id}/start`);

      const startRes = await fetch(`/api/quiz/sets/${targetSet.id}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📡 세션 시작 응답:', startRes.status, startRes.statusText);

      if (!startRes.ok) {
        const errorText = await startRes.text();
        console.error('❌ 세트 세션 시작 실패:', startRes.status, errorText);
        alert(`세션 시작에 실패했습니다: ${startRes.status} ${errorText}`);
        setLoading(false);
        return;
      }

      const session = await startRes.json();
      console.log('🎮 세션 데이터:', session);

      // 3) 세트의 문제 사용
      if (targetSet.items && targetSet.items.length > 0 && targetSet.items[0].question) {
        const qs = targetSet.items.map((i: any) => i.question);
        console.log('❓ 로드된 문제들:', qs);
        setQuestions(qs);
      } else {
        console.warn('⚠️ 세트 항목에 question 정보가 없습니다. 백엔드 반환 형식을 확인하세요.', targetSet);
        alert('문제 데이터가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      console.log('✅ 퀴즈 인터페이스 표시');
      setShowQuizInterface(true);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('💥 세트 시작 중 오류가 발생했습니다:', error);
      alert(`오류가 발생했습니다: ${error}`);
    } finally {
      setLoading(false);
      console.log('🔄 로딩 종료');
    }
  };

  // 진행도 불러오기
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/quiz/progress', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setProgress({ boardSize: data.boardSize, currentTile: data.currentTile, trophies: data.trophies });
        }
      } catch (e) {
        console.error('진행도 조회 실패', e);
      }
    };
    fetchProgress();
  }, [user]);

  // 답안 제출
  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim() || !selectedStudent) return;

    setAttempts(prev => prev + 1);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer: userAnswer.trim(),
          memo,
          attempts: attempts + 1,
          studentId: selectedStudent.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        setIsCorrect(result.isCorrect);
        
        if (result.isCorrect) {
          setEarnedPoints(prev => prev + result.earnedPoints);
          setEarnedBadges(prev => [...prev, ...result.earnedBadges]);
        }
      } else {
        console.error('답안 제출에 실패했습니다.');
        // 로컬에서 정답 확인
        if (userAnswer.trim() === currentQuestion.answer) {
          setIsCorrect(true);
          setEarnedPoints(prev => prev + currentQuestion.points);
          
          const newBadges = [];
          if (currentQuestion.difficulty === '초급') newBadges.push('초급 마스터');
          if (currentQuestion.difficulty === '중급') newBadges.push('중급 마스터');
          if (currentQuestion.difficulty === '고급') newBadges.push('고급 마스터');
          
          setEarnedBadges(prev => [...prev, ...newBadges]);
        } else {
          setIsCorrect(false);
        }
      }
    } catch (error) {
      console.error('답안 제출 중 오류가 발생했습니다:', error);
      // 로컬에서 정답 확인
      if (userAnswer.trim() === currentQuestion.answer) {
        setIsCorrect(true);
        setEarnedPoints(prev => prev + currentQuestion.points);
        
        const newBadges = [];
        if (currentQuestion.difficulty === '초급') newBadges.push('초급 마스터');
        if (currentQuestion.difficulty === '중급') newBadges.push('중급 마스터');
        if (currentQuestion.difficulty === '고급') newBadges.push('고급 마스터');
        
        setEarnedBadges(prev => [...prev, ...newBadges]);
      } else {
        setIsCorrect(false);
      }
    }
  };

  // 다음 문제로
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setMemo('');
      setAttempts(0);
      setIsCorrect(null);
      setShowExplanation(false);
    } else {
      // 퀴즈 완료
      alert(`퀴즈 완료! 획득한 포인트: ${earnedPoints}점`);
    }
  };

  // 퀴즈 인터페이스가 표시되는 경우
  if (showQuizInterface) {
    return (
      <div className="min-h-screen bg-page py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {quizTypes.find(t => t.key === selectedQuizType)?.name} 퀴즈
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                문제 {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                획득 포인트: {earnedPoints}점
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                시도 횟수: {attempts}회
              </div>
            </div>
          </div>

          {/* 문제 카드 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                문제 {currentQuestionIndex + 1}
              </h2>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentQuestion.difficulty === '초급' ? 'bg-green-100 text-green-800' :
                  currentQuestion.difficulty === '중급' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {currentQuestion.points}점
                </span>
              </div>
            </div>
            
            <div className="text-lg text-gray-800 dark:text-gray-200 mb-6">
              {currentQuestion.question}
            </div>

            {/* 메모장 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📝 메모장
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="계산 과정이나 아이디어를 적어보세요..."
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 답안 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                답안
              </label>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="답을 입력하세요..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isCorrect === true}
              />
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || isCorrect === true}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                답안 제출
              </button>
              
              {isCorrect !== null && (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  다음 문제
                </button>
              )}
            </div>

            {/* 결과 표시 */}
            {isCorrect !== null && (
              <div className={`mt-6 p-4 rounded-lg ${
                isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className={`font-semibold ${
                  isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {isCorrect ? '🎉 정답입니다!' : '❌ 틀렸습니다. 다시 시도해보세요.'}
                </div>
                
                {isCorrect && (
                  <div className="mt-2 text-green-700 dark:text-green-300">
                    +{currentQuestion.points}점 획득!
                  </div>
                )}
              </div>
            )}

            {/* 해설 */}
            {isCorrect === true && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  💡 해설
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </div>

          {/* 획득한 뱃지 */}
          {earnedBadges.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🏆 획득한 뱃지
              </h3>
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map((badge, index) => (
                  <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 인증 로딩 중인 경우
  if (authLoading) {
    return (
      <PageContainer maxWidth="xl">
        <LoadingSpinner text="인증 정보를 확인하는 중..." />
      </PageContainer>
    );
  }

  // 메인 퀴즈 페이지 (사이드바 제거)
  return (
    <PageContainer maxWidth="xl">
      <div className="space-y-6">
        {/* 진행 보드 */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <MonopolyBoard totalTiles={progress?.boardSize || 20} currentTile={progress?.currentTile || 0} size={360} />
            <div className="text-sm text-muted">트로피: {progress?.trophies ?? 0}</div>
          </div>
        </div>
        {/* 학생 선택 - 간소화 (상단 우측) */}
        <div className="flex justify-end">
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-56 px-3 py-2 rounded-md border border-input bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">학생 선택</option>
              {user?.students?.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade}학년)
                </option>
              ))}
            </select>
        </div>

        {/* 퀴즈 유형 선택 */}
        <div className="mb-6">
          <h2 className="text-heading-3 text-title text-center mb-4">
            퀴즈 유형 선택
          </h2>
        </div>
        
        <Grid cols={3} gap="lg">
          {quizTypes.length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-muted">퀴즈 유형을 로드하는 중...</p>
            </div>
          ) : (
            quizTypes.map((type, index) => {
              console.log(`🔗 카드 ${index + 1} 렌더링:`, type.key, type.name, '비활성화:', !selectedStudent);
              return (
                <Card
                  key={type.id}
                  hover
                  className={`cursor-pointer transition-all ${
                    !selectedStudent ? 'opacity-60' : ''
                  }`}
                  onClick={() => {
                    console.log('🖱️ 카드 클릭됨:', {
                      index: index + 1,
                      type: type.key,
                      name: type.name,
                      selectedStudent: selectedStudent ? selectedStudent.name : 'none',
                      canClick: !!selectedStudent
                    });

                    if (!selectedStudent) {
                      console.log('⚠️ 학생이 선택되지 않아 클릭 무시됨');
                      return;
                    }

                    console.log('✅ 퀴즈 유형 선택 진행:', type.key);
                    handleQuizTypeSelect(type.key);
                  }}
                >
                  <h3 className="text-xl font-semibold text-title mb-2">
                    {type.name}
                  </h3>
                  {type.description && (
                    <p className="text-body">
                      {type.description}
                    </p>
                  )}

                </Card>
              );
            })
          )}
        </Grid>
      </div>
    </PageContainer>
  );

  return null;
}


