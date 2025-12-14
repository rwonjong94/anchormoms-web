'use client';

import { QuestionStatus } from '@/types/exam';
import { useCallback, useState, useRef, useEffect } from 'react';

interface QuestionSidebarProps {
  totalQuestions: number;
  currentQuestion: number;
  questionStatuses: Record<number, QuestionStatus>;
  onQuestionSelect: (questionNumber: number) => void;
  onToggleMark: (questionNumber: number, event: React.MouseEvent) => void;
  onSubmitExam: () => void;
  isFloating?: boolean;
}

export default function QuestionSidebar({ 
  totalQuestions, 
  currentQuestion, 
  questionStatuses, 
  onQuestionSelect,
  onToggleMark,
  onSubmitExam,
  isFloating = true
}: QuestionSidebarProps) {
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleRightClick = useCallback((questionNumber: number, event: React.MouseEvent) => {
    event.preventDefault();
    onToggleMark(questionNumber, event);
  }, [onToggleMark]);

  const handleQuestionClick = useCallback((questionNumber: number) => {
    onQuestionSelect(questionNumber);
  }, [onQuestionSelect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // 화면 경계 체크
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    
    if (sidebarRect) {
      const boundedX = Math.min(Math.max(0, newX), viewport.width - sidebarRect.width);
      const boundedY = Math.min(Math.max(0, newY), viewport.height - sidebarRect.height);
      
      setPosition({ x: boundedX, y: boundedY });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getQuestionBoxStyle = (questionNumber: number): string => {
    const isActive = questionNumber === currentQuestion;
    
    let baseStyle = 'relative w-10 h-10 border border-input rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 ';
    
    if (isActive) {
      baseStyle += 'bg-blue-600 text-white border-blue-600 shadow-md ';
    } else {
      baseStyle += 'bg-card text-body hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 ';
    }
    
    return baseStyle;
  };

  const renderQuestionBox = (questionNumber: number) => {
    const status = questionStatuses[questionNumber];
    
    return (
      <div
        key={questionNumber}
        className={getQuestionBoxStyle(questionNumber)}
        onClick={() => handleQuestionClick(questionNumber)}
        onContextMenu={(e) => handleRightClick(questionNumber, e)}
        title={`문제 ${questionNumber}번`}
      >
        {/* 문제 번호 */}
        <span>{questionNumber}</span>
        
        {/* 완료 표시 (왼쪽 상단) */}
        {status?.completed && (
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
            ✓
          </div>
        )}
        
        {/* 마킹 표시 (오른쪽 상단) */}
        {status?.marked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">
            ▲
          </div>
        )}
      </div>
    );
  };

  const completedCount = Object.values(questionStatuses).filter(status => status?.completed).length;
  const remainingCount = totalQuestions - completedCount;

  if (isFloating) {
    return (
      <div 
        ref={sidebarRef}
        className="fixed bg-card border border-default rounded-lg shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto z-50"
        style={{ 
          left: position.x, 
          top: position.y,
          transform: position.x === 0 && position.y === 0 ? 'none' : undefined
        }}
      >
        {/* 드래그 핸들 */}
        <div 
          className="bg-gray-100 dark:bg-gray-700 border-b border-input p-2 cursor-move select-none hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-center">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <SidebarContent 
            totalQuestions={totalQuestions}
            currentQuestion={currentQuestion}
            questionStatuses={questionStatuses}
            onQuestionSelect={handleQuestionClick}
            onToggleMark={handleRightClick}
            onSubmitExam={onSubmitExam}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-default rounded-lg shadow-lg sticky top-4">
      <div className="p-4">
        <SidebarContent 
          totalQuestions={totalQuestions}
          currentQuestion={currentQuestion}
          questionStatuses={questionStatuses}
          onQuestionSelect={handleQuestionClick}
          onToggleMark={handleRightClick}
          onSubmitExam={onSubmitExam}
        />
      </div>
    </div>
  );
}

function SidebarContent({ 
  totalQuestions, 
  currentQuestion, 
  questionStatuses, 
  onQuestionSelect,
  onToggleMark,
  onSubmitExam
}: {
  totalQuestions: number;
  currentQuestion: number;
  questionStatuses: Record<number, QuestionStatus>;
  onQuestionSelect: (questionNumber: number) => void;
  onToggleMark: (questionNumber: number, event: React.MouseEvent) => void;
  onSubmitExam: () => void;
}) {
  const getQuestionBoxStyle = (questionNumber: number): string => {
    const isActive = questionNumber === currentQuestion;
    
    let baseStyle = 'relative w-10 h-10 border border-input rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 ';
    
    if (isActive) {
      baseStyle += 'bg-blue-600 text-white border-blue-600 shadow-md ';
    } else {
      baseStyle += 'bg-card text-body hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 ';
    }
    
    return baseStyle;
  };

  const renderQuestionBox = (questionNumber: number) => {
    const status = questionStatuses[questionNumber];
    
    return (
      <div
        key={questionNumber}
        className={getQuestionBoxStyle(questionNumber)}
        onClick={() => onQuestionSelect(questionNumber)}
        onContextMenu={(e) => onToggleMark(questionNumber, e)}
        title={`문제 ${questionNumber}번`}
      >
        {/* 문제 번호 */}
        <span>{questionNumber}</span>
        
        {/* 완료 표시 (왼쪽 상단) */}
        {status?.completed && (
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
            ✓
          </div>
        )}
        
        {/* 마킹 표시 (오른쪽 상단) */}
        {status?.marked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">
            ▲
          </div>
        )}
      </div>
    );
  };

  const completedCount = Object.values(questionStatuses).filter(status => status?.completed).length;
  const remainingCount = totalQuestions - completedCount;

  return (
    <>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-title text-center mb-2">문제 목록</h3>
        <div className="text-xs text-body text-center space-y-1">
          <div>현재: {currentQuestion}번</div>
          <div>남은 문제: {remainingCount}개</div>
        </div>
      </div>

      {/* 범례 */}
      <div className="mb-4 pb-3 border-b border-input">
        <div className="text-xs text-body space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">
              ✓
            </div>
            <span>완료</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">
              ▲
            </div>
            <span>마킹 (우클릭)</span>
          </div>
        </div>
      </div>
      
      {/* 4열 그리드로 문제 번호 배치 */}
      <div className="flex justify-center mb-4">
        <div className="grid grid-cols-4 gap-3 w-44">
          {Object.keys(questionStatuses)
            .map(Number)
            .sort((a, b) => a - b)
            .map(questionNumber => 
              renderQuestionBox(questionNumber)
            )}
        </div>
      </div>

      {/* 시험 제출 버튼 */}
      <div className="pt-4 border-t border-input">
        <button
          onClick={onSubmitExam}
          className="submit-exam-button w-full px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          시험 제출하기
        </button>
      </div>
    </>
  );
} 