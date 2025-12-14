'use client';

import { QuestionStatus } from '@/types/exam';

interface SubmitModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredQuestions: number;
  questionStatuses: Record<number, QuestionStatus>;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SubmitModal({ 
  isOpen, 
  totalQuestions, 
  answeredQuestions, 
  questionStatuses,
  onConfirm, 
  onCancel 
}: SubmitModalProps) {
  if (!isOpen) return null;

  const unansweredQuestions = totalQuestions - answeredQuestions;
  const unansweredNumbers = Array.from({ length: totalQuestions }, (_, i) => i + 1)
    .filter(num => !questionStatuses[num]?.completed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-title mb-2">
            시험 제출 확인
          </h3>
          
          {unansweredQuestions > 0 ? (
            <div className="text-orange-600 dark:text-orange-400">
              <p className="mb-2">
                아직 <span className="font-bold">{unansweredQuestions}개</span>의 문제를 풀지 않았습니다.
              </p>
              <p className="text-sm">
                그래도 제출하시겠습니까?
              </p>
            </div>
          ) : (
            <div className="text-green-600 dark:text-green-400">
              <p>모든 문제를 완료했습니다.</p>
              <p className="text-sm">시험을 제출하시겠습니까?</p>
            </div>
          )}
        </div>

        {/* 답안 현황 */}
        <div className="mb-6 p-4 bg-white dark:bg-hover rounded-lg border border-default">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-body">총 문제 수</div>
              <div className="font-semibold text-title">{totalQuestions}문제</div>
            </div>
            <div>
              <div className="text-body">완료한 문제</div>
              <div className="font-semibold text-green-600 dark:text-green-400">{answeredQuestions}문제</div>
            </div>
          </div>
          
          {unansweredQuestions > 0 && (
            <div className="mt-3 pt-3 border-t border-input">
              <div className="text-sm text-body mb-2">미완료 문제:</div>
              <div className="flex flex-wrap gap-1">
                {unansweredNumbers.map(num => (
                  <span 
                    key={num}
                    className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded text-xs font-medium"
                  >
                    {num}번
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-input text-body rounded-md hover:bg-muted dark:hover:bg-hover transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-md text-white transition-colors ${
              unansweredQuestions > 0 
                ? 'bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-600' 
                : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600'
            }`}
          >
            제출하기
          </button>
        </div>

        {/* 주의사항 */}
        <div className="mt-4 p-3 bg-white dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md">
          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            ⚠️ 제출 후에는 답안을 수정할 수 없습니다.
          </div>
        </div>
      </div>
    </div>
  );
} 