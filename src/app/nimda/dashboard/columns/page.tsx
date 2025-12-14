'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';

interface Column {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  viewCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    email: string;
  };
}

interface FilterOptions {
  categories: string[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FilterConfig {
  column: string;
  enabled: boolean;
  sortOrder: 'asc' | 'desc';
  filterValue: string;
}

interface PopupPosition {
  x: number;
  y: number;
}

interface ColumnWidths {
  [key: string]: number;
}

function ColumnsManagementPageContent() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [] });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    columnId: string;
    columnTitle: string;
  }>({
    isOpen: false,
    columnId: '',
    columnTitle: ''
  });

  // 필터링 설정
  const [filters, setFilters] = useState<Record<string, FilterConfig>>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterConfig>>({});
  
  // 팝업 상태
  const [popupConfig, setPopupConfig] = useState<{
    isOpen: boolean;
    column: string;
    position: PopupPosition;
  }>({
    isOpen: false,
    column: '',
    position: { x: 0, y: 0 }
  });

  // 컬럼 크기 상태
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    actions: 120,
    title: 300,
    category: 120,
    viewCount: 100,
    isPublished: 120,
    createdAt: 160,
  });

  const [isResizing, setIsResizing] = useState<string | null>(null);

  // 상태 변경 팝업 상태
  const [statusPopup, setStatusPopup] = useState<{
    isOpen: boolean;
    columnId: string;
    currentStatus: boolean;
    position: PopupPosition;
  }>({
    isOpen: false,
    columnId: '',
    currentStatus: false,
    position: { x: 0, y: 0 }
  });

  const { requireAuth } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 컬럼 정의
  const columnDefs = [
    { key: 'actions', label: '관리', sortable: false, filterable: false },
    { key: 'title', label: '제목', sortable: true, filterable: true },
    { key: 'category', label: '유형', sortable: true, filterable: true },
    { key: 'viewCount', label: '조회수', sortable: true, filterable: false },
    { key: 'isPublished', label: '상태', sortable: true, filterable: true },
    { key: 'createdAt', label: '작성일', sortable: true, filterable: false },
  ];

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  useEffect(() => {
    fetchColumns();
  }, [activeFilters, pagination.page]);

  // 성공 메시지 처리
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      setSuccessMessage('칼럼이 성공적으로 생성되었습니다.');
    } else if (success === 'edit') {
      setSuccessMessage('칼럼이 성공적으로 수정되었습니다.');
    }
    
    if (success) {
      // URL에서 success 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl.toString());
      
      // 3초 후 메시지 제거
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  }, [searchParams]);

  // 상태 팝업 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusPopup.isOpen) {
        const target = event.target as Element;
        // 팝업 내부 클릭인지 확인
        if (!target.closest('.status-popup')) {
          setStatusPopup(prev => ({ ...prev, isOpen: false }));
        }
      }
    };

    if (statusPopup.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusPopup.isOpen]);

  const fetchColumns = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // 활성화된 필터 적용
      Object.values(activeFilters).forEach(filter => {
        params.append('sortBy', filter.column);
        params.append('sortOrder', filter.sortOrder);
        
        if (filter.filterValue) {
          if (filter.column === 'category') {
            params.append('category', filter.filterValue);
          } else {
            params.append('search', filter.filterValue);
          }
        }
      });

      const response = await fetch(`/api/nimda/columns?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '서버 오류가 발생했습니다.' }));
        throw new Error(errorData.error || '칼럼 목록을 불러오지 못했습니다.');
      }

      const data = await response.json();
      setColumns(data.columns || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
      
      // 필터 옵션 업데이트
      if (data.filterOptions) {
        setFilterOptions(data.filterOptions);
      }
    } catch (err) {
      console.error('Column fetch error:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnClick = (column: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupConfig({
      isOpen: true,
      column,
      position: {
        x: rect.left,
        y: rect.bottom + 5
      }
    });
    
    // 기존 필터 설정 가져오기
    if (!filters[column]) {
      setFilters(prev => ({
        ...prev,
        [column]: {
          column,
          enabled: false,
          sortOrder: 'desc',
          filterValue: '',
        }
      }));
    }
  };

  const handleFilterApply = () => {
    const currentFilter = filters[popupConfig.column];
    if (currentFilter) {
      setActiveFilters(prev => ({
        ...prev,
        [popupConfig.column]: { ...currentFilter, enabled: true }
      }));
    }
    setPagination(prev => ({ ...prev, page: 1 }));
    setPopupConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleFilterReset = () => {
    setFilters(prev => ({
      ...prev,
      [popupConfig.column]: {
        column: popupConfig.column,
        enabled: false,
        sortOrder: 'desc',
        filterValue: '',
      }
    }));
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[popupConfig.column];
      return newFilters;
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setPopupConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleAllFiltersReset = () => {
    setFilters({});
    setActiveFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
    setError('');
  };

  const handleRefresh = () => {
    fetchColumns();
  };

  const handleFilterChange = (key: string, value: string | number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [popupConfig.column]: {
        ...prev[popupConfig.column],
        [key]: value
      }
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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

  const getFilterOptions = (column: string) => {
    if (column === 'category') {
      return [
        { value: '', label: '전체' },
        ...filterOptions.categories.map(category => ({ value: category, label: category }))
      ];
    }
    if (column === 'isPublished') {
      return [
        { value: '', label: '전체' },
        { value: 'true', label: '게시중' },
        { value: 'false', label: '비공개' }
      ];
    }
    return [];
  };

  const getStatusDisplay = (isPublished: boolean) => {
    return isPublished ? '게시중' : '비공개';
  };

  const getStatusStyle = (isPublished: boolean) => {
    return isPublished 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  };

  const handleCreateColumn = () => {
    router.push('/nimda/dashboard/columns/write');
  };

  // 상태 변경 처리
  const handleStatusChange = async (columnId: string, newStatus: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/nimda/columns/${columnId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      
      if (response.ok) {
        // 성공 시 목록 새로고침
        await fetchColumns();
        setStatusPopup(prev => ({ ...prev, isOpen: false }));
      } else {
        const errorData = await response.json();
        setError(errorData.error || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    }
  };

  // 상태 버튼 클릭 핸들러
  const handleStatusClick = (columnId: string, currentStatus: boolean, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setStatusPopup({
      isOpen: true,
      columnId,
      currentStatus,
      position: {
        x: rect.right + 5, // 버튼 오른쪽에 표시
        y: rect.top + (rect.height / 2) - 35 // 버튼의 세로 중앙에 맞춤 (팝업 높이의 절반인 35px 빼기)
      }
    });
  };

  // 삭제 버튼 클릭 핸들러
  const handleDeleteClick = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    setDeleteModal({
      isOpen: true,
      columnId,
      columnTitle: column?.title || ''
    });
  };

  // 삭제 확인 처리
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/columns/${deleteModal.columnId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // 성공 시 목록 새로고침
        await fetchColumns();
        setDeleteModal({ isOpen: false, columnId: '', columnTitle: '' });
        setSuccessMessage('칼럼이 성공적으로 삭제되었습니다.');
        
        // 3초 후 메시지 제거
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    }
  };

  // 컬럼 크기 조정 핸들러
  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(columnKey);

    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + deltaX);
      setColumnWidths(prev => ({
        ...prev,
        [columnKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (loading && columns.length === 0) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg shadow p-6 border border-default">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
              <p className="text-body">칼럼 목록을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow border border-default">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-default">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h1 className="sr-only">칼럼 관리</h1>
                <button
                  onClick={handleCreateColumn}
                  className="bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>칼럼 추가</span>
                </button>
              </div>
              {loading && (
                <div className="inline-flex items-center justify-center h-9 w-9 text-body" title="불러오는 중">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* 필터 박스 */}
          <div className="px-6 pt-4">
            <div className="bg-card rounded-lg border border-default p-4 mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAllFiltersReset}
                  className="h-8 px-3 flex items-center text-sm text-body border border-input rounded-md hover:bg-hover transition-colors"
                >
                  필터 초기화
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="h-8 px-3 flex items-center text-sm text-body border border-input rounded-md hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  새로고침
                </button>
              </div>
            </div>
          </div>

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="mx-6 mt-4 mb-2">
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

          {/* 칼럼 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <colgroup>
                {columnDefs.map((column) => (
                  <col key={column.key} style={{ width: `${columnWidths[column.key]}px` }} />
                ))}
              </colgroup>
              <thead className="bg-muted">
                <tr>
                  {columnDefs.map((column, index) => (
                    <th
                      key={column.key}
                      className={`px-6 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider relative border-r border-default ${
                        column.sortable || column.filterable 
                          ? 'cursor-pointer hover:bg-hover transition-colors' 
                          : ''
                      }`}
                      onClick={(e) => {
                        if (column.sortable || column.filterable) {
                          handleColumnClick(column.key, e);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{column.label}</span>
                        {(column.sortable || column.filterable) && (
                          <div className="flex items-center space-x-1">
                            {activeFilters[column.key] && (
                              <span className="text-indigo-600">●</span>
                            )}
                            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* 리사이징 핸들 */}
                      {index < columnDefs.length - 1 && (
                        <div
                          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-300 ${
                            isResizing === column.key ? 'bg-indigo-500' : ''
                          }`}
                          onMouseDown={(e) => handleMouseDown(column.key, e)}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border-default">
                {error ? (
                  <tr>
                    <td colSpan={columnDefs.length} className="px-6 py-8 text-center">
                      <div className="text-red-600 dark:text-red-400 mb-4">
                        <svg className="mx-auto h-12 w-12 text-red-400 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="mt-2 text-sm font-medium text-red-900 dark:text-red-100">
                          {error}
                        </div>
                        <div className="mt-1 text-sm text-red-700 dark:text-red-200">
                          필터 조건을 확인하거나 새로고츨 버튼을 눌러보세요.
                        </div>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={handleAllFiltersReset}
                          className="inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-body bg-card hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          필터 초기화
                        </button>
                        <button
                          onClick={handleRefresh}
                          disabled={loading}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                          다시 시도
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : columns.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={columnDefs.length} className="px-6 py-8 text-center">
                      <div className="text-muted">
                        <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <div className="mt-2 text-sm font-medium text-title">
                          조건에 맞는 칼럼이 없습니다.
                        </div>
                        <div className="mt-1 text-sm text-body">
                          다른 필터 조건을 시도해보세요.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  columns.map((column) => (
                    <tr key={column.id} className="hover:bg-hover">
                      {/* 관리 */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-3">
                          <button 
                            onClick={() => router.push(`/nimda/dashboard/columns/write?edit=${column.id}`)}
                            className="inline-flex items-center px-3 py-1.5 border border-indigo-300 dark:border-indigo-600 text-xs font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-400 dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(column.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 text-xs font-medium rounded-md text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-400 dark:hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                      {/* 제목 */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-title truncate">
                          {column.title}
                        </div>
                        {column.subtitle && (
                          <div className="text-sm text-body truncate">
                            {column.subtitle}
                          </div>
                        )}
                      </td>
                      {/* 유형 */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {column.category}
                        </span>
                      </td>
                      {/* 조회수 */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-title text-center">
                        {column.viewCount.toLocaleString()}
                      </td>
                      {/* 상태 */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => handleStatusClick(column.id, column.isPublished, e)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${getStatusStyle(column.isPublished)}`}
                        >
                          {getStatusDisplay(column.isPublished)}
                        </button>
                      </td>
                      {/* 작성일 */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-body text-center">
                        {formatDate(column.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-default">
              <div className="flex items-center justify-between">
                <div className="text-sm text-body">
                  총 {pagination.total}개 중 {((pagination.page - 1) * pagination.limit) + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-input rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hover text-body"
                  >
                    이전
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = pagination.page <= 3 
                      ? i + 1 
                      : pagination.page >= pagination.totalPages - 2
                        ? pagination.totalPages - 4 + i
                        : pagination.page - 2 + i;
                    
                    if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded-md text-sm ${
                          pagination.page === pageNum
                            ? 'bg-indigo-600 dark:bg-indigo-700 text-white border-indigo-600 dark:border-indigo-700'
                            : 'border-input hover:bg-hover text-body'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-input rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hover text-body"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 로딩 오버레이 */}
          {loading && columns.length > 0 && (
            <div className="absolute inset-0 bg-card bg-opacity-75 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          )}
        </div>
      </div>

      {/* 필터링 팝업 */}
      {popupConfig.isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setPopupConfig(prev => ({ ...prev, isOpen: false }))}
          />
          <div
            className="fixed z-50 bg-card border border-default rounded-lg shadow-lg p-4 w-64"
            style={{
              left: popupConfig.position.x,
              top: popupConfig.position.y
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-title">
                {columnDefs.find(c => c.key === popupConfig.column)?.label} 필터
              </h3>
              {activeFilters[popupConfig.column] && (
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  적용중
                </span>
              )}
            </div>
            
            {/* 정렬 순서 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-body mb-1">
                정렬 순서
              </label>
              <select
                value={filters[popupConfig.column]?.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>

            {/* 필터 값 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-body mb-1">
                필터 값
              </label>
              {getFilterOptions(popupConfig.column).length > 0 ? (
                <select
                  value={filters[popupConfig.column]?.filterValue || ''}
                  onChange={(e) => handleFilterChange('filterValue', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {getFilterOptions(popupConfig.column).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters[popupConfig.column]?.filterValue || ''}
                  onChange={(e) => handleFilterChange('filterValue', e.target.value)}
                  placeholder="검색어 입력..."
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* 버튼 그룹 */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleFilterApply}
                className="px-3 py-1 text-sm bg-indigo-600 dark:bg-indigo-700 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                적용
              </button>
              <button
                onClick={handleFilterReset}
                className="px-3 py-1 text-sm bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600"
              >
                초기화
              </button>
              <button
                onClick={() => setPopupConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-3 py-1 text-sm text-body border border-input rounded-md hover:bg-hover"
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}

      {/* 상태 변경 팝업 */}
      {statusPopup.isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setStatusPopup(prev => ({ ...prev, isOpen: false }))}
          />
          <div
            className="fixed z-50 bg-card border border-default rounded-lg shadow-lg p-3 w-28 status-popup"
            style={{
              left: statusPopup.position.x,
              top: statusPopup.position.y
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(statusPopup.columnId, true);
                }}
                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                게시하기
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(statusPopup.columnId, false);
                }}
                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                비공개
              </button>
            </div>
          </div>
        </>
      )}

      {/* 삭제 확인 모달 */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md mx-4 border border-default">
            <h3 className="text-lg font-semibold mb-4 text-title">칼럼 삭제</h3>
            <p className="text-body mb-6">
              <span className="font-medium">&quot;{deleteModal.columnTitle}&quot;</span> 칼럼을 정말로 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ isOpen: false, columnId: '', columnTitle: '' })}
                className="px-4 py-2 text-body border border-input rounded-md hover:bg-hover"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function ColumnsManagementPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg shadow p-6 border border-default">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
              <p className="text-body">칼럼 관리 페이지를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    }>
      <ColumnsManagementPageContent />
    </Suspense>
  );
}