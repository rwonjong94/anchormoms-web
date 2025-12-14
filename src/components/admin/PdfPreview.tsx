'use client';

import { useEffect, useState } from 'react';
import { PdfOptions, downloadPdf, revokePdfBlobUrl } from '@/lib/pdfGenerator';

interface PdfPreviewProps {
  pdfBlob: Blob | null;
  pdfOptions: PdfOptions | null;
  onNewPdf: () => void;
  onError: (error: string) => void;
}

export default function PdfPreview({
  pdfBlob,
  pdfOptions,
  onNewPdf,
  onError
}: PdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');

  // PDF Blob이 변경될 때마다 URL 생성/해제
  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      // 컴포넌트 언마운트 시 URL 해제
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
    }
  }, [pdfBlob]);

  // PDF가 변경될 때 페이지 정보 초기화 및 총 페이지 수 계산
  useEffect(() => {
    if (pdfBlob && pdfOptions) {
      // 선택된 문제 수를 기반으로 총 페이지 수 계산 (2문제/페이지)
      const problemCount = (pdfOptions as any)?.problemCount || 0;
      const calculatedTotalPages = Math.max(1, Math.ceil(problemCount / 2));
      setTotalPages(calculatedTotalPages);
      setCurrentPage(1);
      setPageInputValue('1');
    }
  }, [pdfBlob, pdfOptions]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(validPage);
    setPageInputValue(validPage.toString());
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const handlePageInputChange = (value: string) => {
    setPageInputValue(value);
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInputValue);
    if (!isNaN(page)) {
      goToPage(page);
    } else {
      setPageInputValue(currentPage.toString());
    }
  };

  const handleDownload = () => {
    if (!pdfBlob || !pdfOptions) {
      onError('다운로드할 PDF가 없습니다.');
      return;
    }

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const title = pdfOptions.title || '수학모의고사';
      const filename = `${title}_${timestamp}.pdf`;

      downloadPdf(pdfBlob, filename);
    } catch (error) {
      onError('PDF 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) {
      onError('인쇄할 PDF가 없습니다.');
      return;
    }

    try {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      } else {
        onError('팝업이 차단되어 인쇄 창을 열 수 없습니다.');
      }
    } catch (error) {
      onError('PDF 인쇄 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="bg-card border border-default rounded-lg">
      <div className="p-4 border-b border-default">
        <div className="flex flex-col gap-3">
          {/* 첫 번째 행: 제목과 액션 버튼들 */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-title">PDF 미리보기</h3>
            {pdfBlob && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted">
                  파일 크기: {formatFileSize(pdfBlob.size)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    인쇄
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    다운로드
                  </button>
                  <button
                    onClick={onNewPdf}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    새로 생성
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 두 번째 행: 페이지 네비게이션 (PDF가 있을 때만) */}
          {pdfBlob && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-default">
              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="p-2 rounded-md border border-input text-body hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="이전 페이지"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">페이지</span>
                <input
                  type="text"
                  value={pageInputValue}
                  onChange={(e) => handlePageInputChange(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePageInputSubmit();
                    }
                  }}
                  onBlur={handlePageInputSubmit}
                  className="w-12 px-2 py-1 text-center border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-muted">/ {totalPages}</span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-md border border-input text-body hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="다음 페이지"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-96 lg:h-[600px]">
        {!pdfBlob ? (
          // PDF가 없는 경우
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-medium mb-2">PDF 미리보기</p>
              <p className="text-sm">문제지 생성 탭에서 PDF를 생성하면 여기에 미리보기가 표시됩니다.</p>
            </div>
          </div>
        ) : pdfUrl ? (
          // PDF 미리보기
          <div className="h-full flex flex-col">
            {/* PDF 헤더 정보 */}
            {pdfOptions && (
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">제목:</span>
                    <span className="ml-2 text-gray-600">{pdfOptions.title || '수학 모의고사'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">날짜:</span>
                    <span className="ml-2 text-gray-600">{pdfOptions.examDate || '날짜 미지정'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">학생:</span>
                    <span className="ml-2 text-gray-600">{pdfOptions.studentName || '이름 입력란'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">구성:</span>
                    <span className="ml-2 text-gray-600">
                      {(pdfOptions as any)?.problemCount || 0}문제 / {totalPages}페이지
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PDF 뷰어 */}
            <div className="flex-1 relative">
              <iframe
                src={`${pdfUrl}#page=${currentPage}`}
                className="w-full h-full border-0"
                title="PDF 미리보기"
                key={`pdf-${currentPage}`} // 페이지 변경 시 iframe 리렌더링
              />
            </div>
          </div>
        ) : (
          // 로딩 상태
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted">PDF 로딩 중...</p>
            </div>
          </div>
        )}
      </div>


      {/* 모바일에서 PDF 뷰어 대체 메시지 */}
      <div className="md:hidden bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">모바일 환경 안내</p>
            <p>모바일에서는 PDF 미리보기가 제한될 수 있습니다. 다운로드 버튼을 사용하여 PDF를 저장한 후 확인해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}