'use client';

import { useState } from 'react';
import { Problem, PdfOptions, createProblemsPdf } from '@/lib/pdfGenerator';

interface PdfGenerationPanelProps {
  selectedProblems: Problem[];
  onPdfGenerated: (pdfBlob: Blob, options: PdfOptions) => void;
  onError: (error: string) => void;
}

export default function PdfGenerationPanel({
  selectedProblems,
  onPdfGenerated,
  onError
}: PdfGenerationPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState<PdfOptions>({
    title: '수학 모의고사',
    headerTitle: '수학 모의고사',
    subtitle: '',
    studentName: '',
    examDate: ''
  });

  const handleGeneratePdf = async () => {
    if (selectedProblems.length === 0) {
      onError('선택된 문제가 없습니다. 먼저 문제를 선택해주세요.');
      return;
    }

    setGenerating(true);

    try {
      const pdfBlob = await createProblemsPdf(selectedProblems, options);
      // 문제 개수 정보를 옵션에 추가하여 전달
      const optionsWithProblemCount = {
        ...options,
        problemCount: selectedProblems.length
      };
      onPdfGenerated(pdfBlob, optionsWithProblemCount);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      onError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleInputChange = (field: keyof PdfOptions, value: string) => {
    setOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="bg-card border border-default rounded-lg">
      <div className="p-4 border-b border-default">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-title">문제지 생성 설정</h3>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>선택된 문제:</span>
            <span className="font-medium text-indigo-600">{selectedProblems.length}개</span>
            <span>|</span>
            <span>예상 페이지:</span>
            <span className="font-medium text-indigo-600">{Math.ceil(selectedProblems.length / 2)}페이지</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 기본 정보 설정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-body mb-2">
              시험 제목
            </label>
            <input
              type="text"
              id="title"
              value={options.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="수학 모의고사"
            />
          </div>

          <div>
            <label htmlFor="headerTitle" className="block text-sm font-medium text-body mb-2">
              헤더 제목
            </label>
            <input
              type="text"
              id="headerTitle"
              value={options.headerTitle || ''}
              onChange={(e) => handleInputChange('headerTitle', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="수학 모의고사"
            />
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium text-body mb-2">
              부제목 (선택사항)
            </label>
            <input
              type="text"
              id="subtitle"
              value={options.subtitle || ''}
              onChange={(e) => handleInputChange('subtitle', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="예: 1학기 중간고사"
            />
          </div>

          <div>
            <label htmlFor="examDate" className="block text-sm font-medium text-body mb-2">
              시험 날짜 (선택사항)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                id="examDate"
                value={options.examDate || ''}
                onChange={(e) => handleInputChange('examDate', e.target.value)}
                className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => handleInputChange('examDate', getCurrentDate())}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
              >
                오늘
              </button>
            </div>
          </div>
        </div>

        {/* 학생 정보 */}
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-body mb-2">
            학생 이름 (선택사항)
          </label>
          <input
            type="text"
            id="studentName"
            value={options.studentName || ''}
            onChange={(e) => handleInputChange('studentName', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="비워두면 이름 입력란이 표시됩니다"
          />
        </div>

        {/* 문제 목록 미리보기 */}
        <div>
          <h4 className="text-sm font-medium text-body mb-3">선택된 문제 목록</h4>
          <div className="max-h-40 overflow-y-auto border border-input rounded-md p-3 bg-muted/30">
            {selectedProblems.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <div className="text-2xl mb-2">📝</div>
                <p className="text-sm">문제 선택 탭에서 문제를 선택해주세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProblems.map((problem, index) => (
                  <div key={problem.id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-indigo-600 min-w-[2rem]">
                      {index + 1}.
                    </span>
                    <span className="font-medium text-title">
                      {problem.examInfo} - {problem.probNum}번
                    </span>
                    <span className="text-muted">
                      ({problem.probArea} | {problem.probType})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* 액션 버튼 */}
        <div className="flex gap-3 pt-4 border-t border-default">
          <button
            onClick={handleGeneratePdf}
            disabled={generating || selectedProblems.length === 0}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                PDF 생성 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF 생성하기
              </>
            )}
          </button>

          <button
            onClick={() => {
              setOptions({
                title: '수학 모의고사',
                headerTitle: '수학 모의고사',
                subtitle: '',
                studentName: '',
                examDate: ''
              });
            }}
            disabled={generating}
            className="px-4 py-3 border border-input text-body hover:bg-hover rounded-md font-medium transition-colors"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}