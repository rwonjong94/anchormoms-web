'use client';

import React, { useState, useEffect } from 'react';
import { StudentAnswer } from '@/types/exam';

// 답안 입력 컴포넌트 Props
interface AnswerInputProps {
  questionId: string;
  currentAnswer?: StudentAnswer;
  onAnswerChange: (answer: string) => void;
}

// 답안 입력 컴포넌트 - 입력 기능만 담당
const AnswerInput = React.memo(({ 
  questionId, 
  currentAnswer, 
  onAnswerChange 
}: AnswerInputProps) => {
  const [localAnswer, setLocalAnswer] = useState(currentAnswer?.answer || '');

  // 답안이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setLocalAnswer(currentAnswer?.answer || '');
  }, [currentAnswer]);

  // 문제가 변경될 때 상태 초기화
  useEffect(() => {
    setLocalAnswer(currentAnswer?.answer || '');
  }, [questionId]);

  // 답안 변경 처리
  const handleAnswerChange = (value: string) => {
    setLocalAnswer(value);
    onAnswerChange(value);
  };

  return (
    <div className="bg-muted dark:bg-hover border border-input rounded-lg p-6">
      <label htmlFor={`answer-${questionId}`} className="block text-sm font-medium text-body mb-3">
        답안 입력:
      </label>
      <textarea
        id={`answer-${questionId}`}
        value={localAnswer}
        onChange={(e) => handleAnswerChange(e.target.value)}
        placeholder="답안을 입력하세요."
        className="w-full px-4 py-3 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-card text-title placeholder-muted"
        rows={4}
      />
    </div>
  );
});

AnswerInput.displayName = 'AnswerInput';

export default AnswerInput;