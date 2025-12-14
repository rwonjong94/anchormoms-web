'use client';

import { memo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/ImageWithFallback';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import useSWR from 'swr';

interface StoreProduct {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  price: number;
  saleRate: number;
  thumbnailImage?: string;
  productFile?: string;
}

interface Purchase {
  id: string;
  userId: string;
  storeProductId: string;
  price: number;
  quantity: number;
  status: string;
  purchaseDate: string;
  storeProduct: StoreProduct;
}

interface PurchasesResponse {
  purchases: Purchase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  return response.json();
};

const PERIOD_OPTIONS = [
  { id: '1month', name: '1개월' },
  { id: '3months', name: '3개월' },
  { id: '1year', name: '1년' },
  { id: 'custom', name: '기간 직접 선택' },
];

export default function ShoppingPurchasesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('1month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (selectedPeriod === 'custom') return;
    let startDateObj: Date;
    switch (selectedPeriod) {
      case '1month':
        startDateObj = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        break;
      case '3months':
        startDateObj = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        break;
      case '1year':
        startDateObj = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      default:
        startDateObj = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    }
    setStartDate(startDateObj.toISOString().split('T')[0]);
    setEndDate(todayStr);
  }, [selectedPeriod]);

  // 구매 내역 가져오기
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  
  const { data: purchasesResponse, error, isLoading: purchasesLoading } = useSWR<PurchasesResponse>(
    startDate && endDate ? `/api/purchase/history?${queryParams.toString()}` : null,
    fetcher
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // 파일 다운로드 핸들러
  const handleDownload = async (purchaseId: string, fileType: 'exam' | 'answer', title: string) => {
    setIsDownloading(`${purchaseId}-${fileType}`);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        showError('로그인이 필요합니다.');
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/purchase/${purchaseId}/download?type=${fileType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });

      if (response.status === 401 || response.status === 403) {
        showError('세션이 만료되었습니다. 다시 로그인해주세요.');
        router.push('/auth/login');
        return;
      }
      if (!response.ok) {
        // 에러 본문이 JSON이 아닐 수도 있으므로 텍스트로 안전하게 처리
        const errorText = await response.text().catch(() => '');
        const message = ((): string => {
          try {
            const json = JSON.parse(errorText);
            return json.message || '다운로드에 실패했습니다.';
          } catch {
            if (response.status === 404) return '파일을 찾을 수 없습니다.';
            if (response.status >= 500) return '서버 오류로 다운로드에 실패했습니다.';
            return '다운로드에 실패했습니다.';
          }
        })();
        throw new Error(message);
      }

      // 파일명 추출 (Content-Disposition)
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      const serverFilename = filenameMatch ? decodeURIComponent(filenameMatch[1] || filenameMatch[2]) : undefined;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = serverFilename || `${title}_${fileType === 'exam' ? '문제지' : '답안지'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('다운로드 오류:', error);
      showError(error instanceof Error ? error.message : '다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const purchases = purchasesResponse?.purchases || [];

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <div className="bg-card rounded-lg shadow-sm border border-default">
            {/* 헤더 */}
            <div className="p-6 border-b border-default">
              <h2 className="text-xl font-semibold text-title mb-6">구매 목록</h2>
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-title whitespace-nowrap">조회 기간:</label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-3 py-2 border border-default rounded-lg bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PERIOD_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedPeriod === 'custom' && (
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-title whitespace-nowrap">시작일:</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="px-3 py-2 border border-default rounded-lg bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-title whitespace-nowrap">종료일:</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-3 py-2 border border-default rounded-lg bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {startDate && endDate && (
                  <div className="text-sm text-body">
                    조회 기간: {new Date(startDate).toLocaleDateString('ko-KR')} ~ {new Date(endDate).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>
            </div>

            {/* 구매 목록 */}
            <div className="p-6">
              {purchasesLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-muted rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                        <div className="w-24 h-8 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 mb-4">구매 내역을 불러오는 중 오류가 발생했습니다.</p>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    다시 시도
                  </button>
                </div>
              )}

              {!purchasesLoading && !error && purchases.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="mt-4 text-muted">선택한 기간에 구매한 상품이 없습니다.</p>
                  <button onClick={() => router.push('/store')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    자료 둘러보기
                  </button>
                </div>
              )}

              {!purchasesLoading && !error && purchases.length > 0 && (
                <div className="space-y-4">
                  {purchases.map((purchase, index) => (
                    <PurchaseItem
                      key={purchase.id}
                      purchase={purchase}
                      onDownload={handleDownload}
                      isDownloading={isDownloading}
                      priority={index === 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PurchaseItem = memo(function PurchaseItem({ 
  purchase, 
  onDownload, 
  isDownloading,
  priority = false
}: { 
  purchase: Purchase;
  onDownload: (purchaseId: string, fileType: 'exam' | 'answer', title: string) => void;
  isDownloading: string | null;
  priority?: boolean;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => price.toLocaleString();

  return (
    <div className="flex items-center space-x-4 p-4 border border-default rounded-lg hover:bg-muted/50 transition-colors">
      <ThumbnailImage storeProduct={purchase.storeProduct} priority={priority} />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-title truncate">{purchase.storeProduct?.title || '제목 없음'}</h3>
        {purchase.storeProduct?.subtitle && (
          <p className="text-sm text-body mt-1 truncate">{purchase.storeProduct.subtitle}</p>
        )}
        <div className="flex items-center space-x-4 mt-2 text-sm text-body">
          <span>₩{formatPrice(purchase.price)}</span>
          <span>구매일: {formatDate(purchase.purchaseDate)}</span>
        </div>
      </div>
      {purchase.storeProduct?.productFile && (
        <div className="flex justify-center flex-shrink-0">
          <button
            onClick={() => onDownload(purchase.id, 'exam', purchase.storeProduct.title)}
            disabled={isDownloading === `${purchase.id}-exam`}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{isDownloading === `${purchase.id}-exam` ? '다운로드 중...' : '다운로드'}</span>
          </button>
        </div>
      )}
    </div>
  );
});

const ThumbnailImage = memo(function ThumbnailImage({ storeProduct, priority = false }: { storeProduct?: StoreProduct; priority?: boolean }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  if (!storeProduct) {
    return (
      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative flex items-center justify-center">
        <div className="text-muted text-xs font-bold text-center">
          <div>상품 정보</div>
          <div>없음</div>
        </div>
      </div>
    );
  }
  const thumbnailPath = `/stores/${storeProduct.id}/thumbnail.png`;
  return (
    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative">
      <ImageWithFallback
        src={thumbnailPath}
        alt={storeProduct.title}
        width={80}
        height={80}
        className="object-contain w-full h-full"
        priority={priority}
        fallbackText="썸네일 로드 실패"
      />
    </div>
  );
});



