'use client';

import { useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';

interface ExamPaper {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  price: number;
  saleRate: number;
  saleStartDate?: string;
  saleEndDate?: string;
  thumbnailImage?: string;
  downloadCount: number;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
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

export default function ExamPaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // 문제지 상세 정보 가져오기
  const { data: examPaper, error, isLoading } = useSWR<ExamPaper>(
    `/api/stores/exam-papers/${resolvedParams.id}`,
    fetcher
  );

  // 로그인이 필요한 페이지
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">로그인이 필요한 페이지입니다.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!examPaper) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(examPaper.id, 1);
      // 성공적으로 추가됨 - alert 제거, 자동으로 SWR이 업데이트
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert('장바구니 추가에 실패했습니다.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    const categories: Record<string, { name: string; color: string }> = {
      workbook: { name: '문제집', color: 'bg-blue-100 text-blue-800' },
    };
    return categories[category] || { name: '문제집', color: 'bg-blue-100 text-blue-800' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !examPaper) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            문제지를 불러오는 중 오류가 발생했습니다.
          </p>
          <Link
            href="/store"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            자료로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 할인 정보 계산
  const isOnSale = () => {
    if (!examPaper.saleRate || examPaper.saleRate === 0) return false;
    
    const now = new Date();
    const startDate = examPaper.saleStartDate ? new Date(examPaper.saleStartDate) : null;
    const endDate = examPaper.saleEndDate ? new Date(examPaper.saleEndDate) : null;
    
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    
    return true;
  };

  const getDiscountedPrice = () => {
    if (!isOnSale()) return examPaper.price;
    return Math.round(examPaper.price * (1 - examPaper.saleRate / 100));
  };

  const getSalePeriodText = () => {
    if (!examPaper.saleStartDate || !examPaper.saleEndDate) return '한정 기간';
    
    const startDate = new Date(examPaper.saleStartDate);
    const endDate = new Date(examPaper.saleEndDate);
    
    return `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`;
  };

  const categoryInfo = getCategoryInfo(examPaper.category);
  const saleActive = isOnSale();
  const discountedPrice = getDiscountedPrice();
  const salePeriodText = getSalePeriodText();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 브레드크럼 */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/store" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                자료
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/store" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {categoryInfo.name}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white font-medium">
              {examPaper.title}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 이미지 섹션 */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img
                src={`/stores/${examPaper.id}/thumbnail.png`}
                alt={examPaper.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 상품 정보 섹션 */}
          <div className="space-y-6">
            {/* 제목과 가격 */}
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex-1 pr-6">
                {examPaper.title}
              </h1>
              
              {/* 가격 섹션 */}
              <div className="text-right flex-shrink-0">
                {saleActive ? (
                  <div className="space-y-1">
                    {/* 원래 가격 (사선) */}
                    <p className="text-lg text-gray-500 dark:text-gray-400 line-through text-right">
                      ₩{examPaper.price.toLocaleString()}
                    </p>
                    {/* 할인 가격 (강조) */}
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ₩{discountedPrice.toLocaleString()}
                    </p>
                    {/* 할인 정보 */}
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs font-semibold">
                        -{examPaper.saleRate}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {salePeriodText}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₩{examPaper.price.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* 설명 */}
            {examPaper.description && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  상품 설명
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {examPaper.description}
                </p>
              </div>
            )}

            {/* 상품 정보 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                상품 정보
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600 dark:text-gray-400">등록일</div>
                <div className="text-gray-900 dark:text-white">
                  {new Date(examPaper.createdAt).toLocaleDateString('ko-KR')}
                </div>
                <div className="text-gray-600 dark:text-gray-400">파일 형식</div>
                <div className="text-gray-900 dark:text-white">PDF</div>
              </div>
            </div>

            {/* 상품 설명 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                상품 설명
              </h3>
              <div 
                className="prose prose-gray dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: examPaper.content }}
              />
            </div>

            {/* 구매 버튼 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
              >
                {isAddingToCart ? '추가 중...' : '장바구니에 추가'}
              </button>
              
              <button
                onClick={() => {
                  // 바로 구매 - 해당 상품만 담긴 cart 페이지로 이동
                  const directPurchaseData = {
                    id: 'direct-purchase',
                    userId: user?.id,
                    examPaperId: examPaper.id,
                    quantity: 1,
                    createdAt: new Date().toISOString(),
                    examPaper: {
                      id: examPaper.id,
                      title: examPaper.title,
                      description: examPaper.description,
                      type: examPaper.category,
                      price: examPaper.price,
                      salePrice: saleActive ? discountedPrice : null,
                      thumbnailImage: examPaper.thumbnailImage,
                      downloadCount: examPaper.downloadCount,
                      viewCount: examPaper.viewCount,
                      isActive: examPaper.isActive,
                      createdAt: examPaper.createdAt,
                    },
                  };
                  
                  // 바로 구매 데이터를 sessionStorage에 저장
                  sessionStorage.setItem('directPurchaseItem', JSON.stringify(directPurchaseData));
                  
                  // cart 페이지로 이동 (바로 구매 모드)
                  router.push('/cart?mode=direct');
                }}
                className="py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
              >
                바로 구매
              </button>
            </div>

            {/* 주의사항 */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">구매 전 확인사항</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 구매 후 즉시 다운로드 가능합니다.</li>
                    <li>• 디지털 상품 특성상 환불이 제한될 수 있습니다.</li>
                    <li>• 저작권 보호를 위해 무단 배포를 금지합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}