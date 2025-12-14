'use client';

import { Question, StudentAnswer } from '@/types/exam';
import QuestionContent from './QuestionContent';
import AnswerInput from './AnswerInput';
import QuestionNavigation from './QuestionNavigation';

interface QuestionDisplayProps {
  question: Question;
  answer?: StudentAnswer;
  onAnswerChange: (answer: string) => void;
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export default function QuestionDisplay({ 
  question, 
  answer, 
  onAnswerChange, 
  onPreviousQuestion, 
  onNextQuestion, 
  canGoPrevious, 
  canGoNext 
}: QuestionDisplayProps) {
  return (
    <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-sm border-default p-8">
      {/* 문제 내용 영역 - React.memo로 최적화됨 */}
      <QuestionContent question={question} />

      {/* 답안 입력 영역 - React.memo로 최적화됨 */}
      <AnswerInput
        questionId={question.id}
        currentAnswer={answer}
        onAnswerChange={onAnswerChange}
      />

      {/* 네비게이션 영역 - React.memo로 최적화됨 */}
      <QuestionNavigation
        onPreviousQuestion={onPreviousQuestion}
        onNextQuestion={onNextQuestion}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />
    </div>
  );
} 