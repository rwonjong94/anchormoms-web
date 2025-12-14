'use client';

import { useEffect } from 'react';

interface ConfirmToastProps {
  isVisible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  targetElement?: HTMLElement | null; // 타겟 요소 (이 요소 위에 표시)
  position?: 'top-right' | 'over-element'; // 위치 모드
}

export default function ConfirmToast({ 
  isVisible, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  targetElement = null,
  position = 'top-right'
}: ConfirmToastProps) {
  // ESC 키로 취소 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onCancel]);

  if (!isVisible) return null;

  // 위치 계산
  const getPositionStyle = () => {
    if (position === 'over-element' && targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      return {
        position: 'absolute' as const,
        top: rect.top + scrollY - 10, // 요소 위쪽에 10px 간격
        left: rect.left + scrollX + rect.width / 2, // 요소 중앙 정렬
        transform: 'translateX(-50%)', // 중앙 정렬
        zIndex: 60 // 더 높은 z-index
      };
    }
    
    // 기본값: 우상단
    return {
      position: 'fixed' as const,
      top: '1rem',
      right: '1rem',
      zIndex: 50
    };
  };

  return (
    <div style={getPositionStyle()} className="animate-fade-in">
      <div className="flex flex-col gap-3 px-4 py-4 rounded-lg border shadow-lg max-w-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
        {/* 아이콘과 메시지 */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1 text-sm font-medium whitespace-pre-line">
            {message}
          </div>
        </div>
        
        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 text-xs font-medium bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600 rounded-md transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}