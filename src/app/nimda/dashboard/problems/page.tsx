'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import QBankViewer from '../../../qbank/shared/Viewer';
import PdfGenerationPanel from '@/components/admin/PdfGenerationPanel';
import PdfPreview from '@/components/admin/PdfPreview';
import { PdfOptions } from '@/lib/pdfGenerator';

type TabType = '문제 선택' | 'PDF 미리보기';

export default function ProblemsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('문제 선택');
  const [selectedProblems, setSelectedProblems] = useState<any[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfOptions, setPdfOptions] = useState<PdfOptions | null>(null);
  const [error, setError] = useState<string>('');
  const { requireAuth } = useAdminAuth();

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const handlePdfGenerated = (blob: Blob, options: PdfOptions) => {
    setPdfBlob(blob);
    setPdfOptions(options);
    setError('');
    // PDF 생성 후 자동으로 미리보기 탭으로 이동
    setActiveTab('PDF 미리보기');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    // 에러 메시지를 3초 후 자동으로 숨김
    setTimeout(() => setError(''), 3000);
  };

  const handleNewPdf = () => {
    setPdfBlob(null);
    setPdfOptions(null);
    setError('');
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 헤더 */}
          <div className="mb-8 flex justify-between items-start">
            <h1 className="sr-only">문제 관리</h1>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-6">
            <div className="border-b border-default">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('문제 선택')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === '문제 선택'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-muted hover:text-body hover:border-default'
                  }`}
                >
                  문제 선택
                </button>
                <button
                  onClick={() => setActiveTab('PDF 미리보기')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'PDF 미리보기'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-muted hover:text-body hover:border-default'
                  }`}
                >
                  PDF 미리보기
                </button>
              </nav>
            </div>
          </div>

          {/* 에러 메시지 표시 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* 탭별 콘텐츠 */}
          {activeTab === '문제 선택' ? (
            // 문제 선택 탭
            <QBankViewer
              selectedProblems={selectedProblems}
              onSelectedProblemsChange={setSelectedProblems}
            />
          ) : (
            // PDF 미리보기 탭
            <div className="space-y-6">
              {/* 상단: PDF 생성 설정 */}
              <PdfGenerationPanel
                selectedProblems={selectedProblems}
                onPdfGenerated={handlePdfGenerated}
                onError={handleError}
              />

              {/* 하단: PDF 미리보기 */}
              <PdfPreview
                pdfBlob={pdfBlob}
                pdfOptions={pdfOptions}
                onNewPdf={handleNewPdf}
                onError={handleError}
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}