'use client';

import React from 'react';

// 네비게이션 컴포넌트 Props
interface QuestionNavigationProps {
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

// 네비게이션 컴포넌트 - 이전/다음 버튼만 담당
const QuestionNavigation = React.memo(({ 
  onPreviousQuestion, 
  onNextQuestion, 
  canGoPrevious, 
  canGoNext 
}: QuestionNavigationProps) => {
  return (
    <div className="mt-6 pt-4 border-t border-input flex justify-between">
      <button
        onClick={onPreviousQuestion}
        disabled={!canGoPrevious}
        className={`px-6 py-2 rounded-md font-medium transition-colors ${
          canGoPrevious
            ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
            : 'bg-muted dark:bg-hover text-muted cursor-not-allowed border border-input'
        }`}
      >
        이전 문제
      </button>
      
      <button
        onClick={onNextQuestion}
        disabled={!canGoNext}
        className={`px-6 py-2 rounded-md font-medium transition-colors ${
          canGoNext
            ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
            : 'bg-muted dark:bg-hover text-muted cursor-not-allowed border border-input'
        }`}
      >
        다음 문제
      </button>
    </div>
  );
});

QuestionNavigation.displayName = 'QuestionNavigation';

export default QuestionNavigation;