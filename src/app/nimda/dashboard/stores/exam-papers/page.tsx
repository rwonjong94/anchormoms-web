'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useExamPapers, useExamPaperTypes, deleteExamPaper } from '@/hooks/useExamPapers';
import AdminLayout from '@/components/admin/AdminLayout';
import { ExamPaper } from '@/types/exam-paper';

export default function ExamPapersPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    examPaperId: string;
    examPaperTitle: string;
  }>({
    isOpen: false,
    examPaperId: '',
    examPaperTitle: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  const itemsPerPage = 50; // 5x10 그리드

  const { requireAuth } = useAdminAuth();
  const router = useRouter();
  const { types, loading: typesLoading } = useExamPaperTypes();
  const { examPapers, pagination, loading, error, mutate } = useExamPapers(
    currentPage, 
    itemsPerPage, 
    activeTab === 'all' ? undefined : activeTab
  );

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // 탭이 변경될 때 페이지를 1로 리셋
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSalePeriod = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return '';
    
    const formatDateShort = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    };

    if (startDate && endDate) {
      return `(${formatDateShort(startDate)} ~ ${formatDateShort(endDate)})`;
    } else if (startDate) {
      return `(${formatDateShort(startDate)} ~)`;
    } else if (endDate) {
      return `(~ ${formatDateShort(endDate)})`;
    }
    
    return '';
  };

  const handleEdit = (examPaperId: string) => {
    router.push(`/nimda/dashboard/stores/exam-papers/write?edit=${examPaperId}`);
  };

  const handleDeleteClick = (examPaper: ExamPaper) => {
    setDeleteModal({
      isOpen: true,
      examPaperId: examPaper.id,
      examPaperTitle: examPaper.title
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteExamPaper(deleteModal.examPaperId);
      await mutate();
      setDeleteModal({ isOpen: false, examPaperId: '', examPaperTitle: '' });
      setSuccessMessage('물품이 성공적으로 삭제되었습니다.');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Failed to delete exam paper:', err);
    }
  };

  const handleCreate = () => {
    router.push('/nimda/dashboard/stores/exam-papers/write');
  };

  // 페이지네이션은 백엔드에서 처리되므로 examPapers 그대로 사용
  const totalPages = pagination?.totalPages || 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="sr-only">자료 관리</h1>
              <button
                onClick={handleCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center shrink-0"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>자료 추가</span>
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-6">
            <div className="border-b border-default">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {/* 전체 탭 */}
                <button
                  onClick={() => handleTabChange('all')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'all'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-muted hover:text-body hover:border-default'
                  }`}
                >
                  전체
                </button>
                
                {/* 동적 type 탭들 */}
                {!typesLoading && types.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTabChange(type)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === type
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-muted hover:text-body hover:border-default'
                    }`}
                  >
                    {type}
                  </button>
                ))}
                
                {/* 로딩 중일 때 스켈레톤 */}
                {typesLoading && (
                  <>
                    <div className="py-4 px-1">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="py-4 px-1">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                    </div>
                  </>
                )}
              </nav>
            </div>
          </div>

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {successMessage}
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setSuccessMessage('')}
                      className="inline-flex text-green-400 hover:text-green-600"
                    >
                      <span className="sr-only">닫기</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 문제지 목록 */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-default">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-title mb-2">오류가 발생했습니다</h3>
              <p className="text-body">물품 목록을 불러오는 중 오류가 발생했습니다.</p>
            </div>
          ) : examPapers.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-lg shadow-sm border border-default">
              <div className="max-w-md mx-auto">
                <svg className="w-32 h-32 text-muted mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-2xl font-bold text-title mb-3">
                  {activeTab === 'all' ? '등록된 물품이 없습니다' : `'${activeTab}' 물품이 없습니다`}
                </h3>
                <p className="text-body text-lg">
                  자료에 판매할 물품을 추가해보세요.<br />
                  학생들이 구매할 수 있는 다양한 물품을 제공할 수 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 페이지 정보 */}
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-muted">
                  {activeTab === 'all' ? '전체' : activeTab} - 총 {pagination?.total || 0}개 물품 (페이지 {currentPage}/{pagination?.totalPages || 1})
                </p>
              </div>

              {/* 5x10 그리드 레이아웃 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {examPapers.map((examPaper, index) => (
                <div key={examPaper.id} className="bg-card rounded-lg shadow-sm border border-default p-4">
                  {/* 썸네일 이미지 */}
                  <div className="mb-3">
                    <ExamPaperThumbnail examPaper={examPaper} priority={index === 0} />
                  </div>
                  
                  {/* 타입 배지와 제목, 부제목 */}
                  <div className="mb-3">
                    {/* 타입 배지 */}
                    <div className="mb-2">
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">
                        {examPaper.type}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-title mb-1 line-clamp-2">
                      {examPaper.title}
                    </h3>
                    {examPaper.subtitle && (
                      <p className="text-xs text-body mb-2 line-clamp-1">{examPaper.subtitle}</p>
                    )}
                  </div>
                  
                  {/* 가격 정보 */}
                  <div className="mb-3">
                    {examPaper.saleRate > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-red-600">
                          {Math.round(examPaper.price * (1 - examPaper.saleRate / 100))}원
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs text-muted line-through">
                            {examPaper.price}원
                          </span>
                          <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                            {examPaper.saleRate}% 할인
                          </span>
                          {formatSalePeriod(examPaper.saleStartDate, examPaper.saleEndDate) && (
                            <span className="text-xs text-muted">
                              {formatSalePeriod(examPaper.saleStartDate, examPaper.saleEndDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-title">
                          {examPaper.price}원
                        </span>
                        <div className="text-xs">
                          <div className="h-10"></div> {/* 할인 정보 영역 높이 맞춤 */}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 통계 정보 */}
                  <div className="flex justify-between items-center text-xs text-muted mb-3">
                    <span>다운로드: {examPaper.downloadCount}</span>
                    <span>조회: {examPaper.viewCount}</span>
                  </div>
                  
                  {/* 액션 버튼들 */}
                  <div className="flex gap-1 mb-2">
                    <button
                      onClick={() => handleEdit(examPaper.id)}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteClick(examPaper)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                  
                  {/* 업로드 날짜 */}
                  <div className="pt-2 border-t border-default text-xs text-muted">
                    {formatDate(examPaper.createdAt)}
                  </div>
                </div>
              ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    {/* 이전 페이지 */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-muted bg-card border border-default rounded-md hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>

                    {/* 페이지 번호들 */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'text-muted bg-card border border-default hover:bg-hover'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* 다음 페이지 */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-muted bg-card border border-default rounded-md hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}

          {/* 삭제 확인 모달 */}
          {deleteModal.isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg p-6 max-w-md mx-4 border border-default">
                <h3 className="text-lg font-semibold mb-4 text-title">물품 삭제</h3>
                <p className="text-body mb-6">
                  <span className="font-medium">&quot;{deleteModal.examPaperTitle}&quot;</span> 물품을 정말로 삭제하시겠습니까?
                  <br />
                  이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDeleteModal({ isOpen: false, examPaperId: '', examPaperTitle: '' })}
                    className="px-4 py-2 text-body border border-input rounded-md hover:bg-hover"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// 시험지 썸네일 이미지 컴포넌트
function ExamPaperThumbnail({ examPaper, priority = false }: { examPaper: ExamPaper; priority?: boolean }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const thumbnailPath = `/stores/${examPaper.id}/thumbnail.png`;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div className="relative bg-muted rounded-md overflow-hidden">
      <div className="w-full h-40 relative">
        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 bg-white/30 rounded-full animate-pulse"></div>
          </div>
        )}
        
        {/* 항상 썸네일 표시 시도 - 전체 이미지가 보이도록 object-contain 사용 */}
        <Image
          src={thumbnailPath}
          alt={examPaper.title}
          fill
          className="object-contain rounded-md p-2"
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={priority}
        />

        {/* 에러 발생 시에만 에러 표시 */}
        {imageError && (
          <div className="absolute inset-0 bg-red-100 border-2 border-red-300 flex items-center justify-center rounded-md">
            <div className="text-red-600 text-sm font-bold text-center">
              <div>썸네일</div>
              <div>로드 실패</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
