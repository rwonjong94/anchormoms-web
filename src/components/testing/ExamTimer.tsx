'use client';

import { useState, useEffect } from 'react';

interface ExamTimerProps {
  initialTime: number; // seconds
  onTimeUp: () => void;
  enabled: boolean;
  initiallyVisible?: boolean; // 초기 표시 상태 설정
  startTime?: Date; // 시험 시작 시간
  onTimeWarning?: (message: string, type: 'warning' | 'error') => void; // 시간 경고 콜백
}

export default function ExamTimer({ initialTime, onTimeUp, enabled, initiallyVisible = true, startTime, onTimeWarning }: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    // 시험 시작 시간이 있으면 경과 시간을 계산해서 남은 시간을 구함
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, initialTime - elapsed);
      return remaining;
    }
    return initialTime;
  });
  const [isRunning, setIsRunning] = useState(true);
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const [warningShown, setWarningShown] = useState({ quarter: false, eighth: false });

  // 경고 메시지용 시간 포맷팅 함수
  const formatTimeForWarning = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    } else {
      return `${secs}초`;
    }
  };

  useEffect(() => {
    if (!enabled || !isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          onTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, enabled, onTimeUp]);

  // 시간 경고 체크
  useEffect(() => {
    if (!onTimeWarning) return; // 콜백이 없으면 경고하지 않음
    
    const quarterTime = initialTime / 4;
    const eighthTime = initialTime / 8;

    if (timeRemaining <= quarterTime && !warningShown.quarter) {
      setWarningShown(prev => ({ ...prev, quarter: true }));
      const timeMessage = `남은시간: ${formatTimeForWarning(timeRemaining)} 남았습니다.`;
      onTimeWarning(timeMessage, 'warning');
    } else if (timeRemaining <= eighthTime && !warningShown.eighth) {
      setWarningShown(prev => ({ ...prev, eighth: true }));
      const timeMessage = `남은시간: ${formatTimeForWarning(timeRemaining)} 남았습니다.`;
      onTimeWarning(timeMessage, 'error');
    }
  }, [timeRemaining, initialTime, warningShown, onTimeWarning]);

  const formatTime = (seconds: number): string => {
    if (!isVisible) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (!isVisible) return 'text-gray-400 dark:text-gray-500';
    
    const quarterTime = initialTime / 4;
    const eighthTime = initialTime / 8;
    
    if (timeRemaining <= eighthTime) return 'text-red-600 dark:text-red-400';
    if (timeRemaining <= quarterTime) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  // 숨기기 버튼 핸들러
  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // 일시정지/재생 버튼 핸들러
  const handleTogglePause = () => {
    setIsRunning(!isRunning);
  };

  if (!enabled) return null;

  return (
    <div className="grid grid-cols-3 gap-4 items-center w-full max-w-sm">
      {/* 숨기기/보이기 버튼 영역 */}
      <div className="flex justify-start">
        <button
          onClick={handleToggleVisibility}
          className="w-16 px-2 py-2 text-sm text-body hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors font-medium border border-input hover:border-blue-300 dark:hover:border-blue-600"
          title={isVisible ? '타이머 숨기기' : '타이머 보이기'}
        >
          {isVisible ? '숨기기' : '보이기'}
        </button>
      </div>

      {/* 타이머 표시 영역 */}
      <div className="flex justify-center">
        <div className={`text-xl font-mono font-bold ${getTimerColor()} w-20 text-center`}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* 일시정지/재시작 버튼 영역 */}
      <div className="flex justify-end">
        <button
          onClick={handleTogglePause}
          className={`w-20 px-2 py-2 text-sm rounded-md transition-colors font-medium border ${
            isRunning 
              ? 'text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-300 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500' 
              : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-300 dark:border-green-600 hover:border-green-400 dark:hover:border-green-500'
          }`}
          title={isRunning ? '타이머 일시정지' : '타이머 재시작'}
        >
          {isRunning ? '일시정지' : '재시작'}
        </button>
      </div>
    </div>
  );
} 