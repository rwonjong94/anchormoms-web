'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DirectPurchaseItem {
  id: string;
  userId: string;
  examPaperId: string;
  quantity: number;
  createdAt: string;
  examPaper: {
    id: string;
    title: string;
    description?: string;
    type?: string;
    price: number;
    salePrice?: number;
    thumbnailImage?: string;
    downloadCount: number;
    viewCount: number;
    isActive?: boolean;
    createdAt: string;
  };
}

export default function CartPageClient() {
  const { user } = useAuth();
  const { cartData, isLoading, error, updateCartItem, removeCartItem, clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [directPurchaseItem, setDirectPurchaseItem] = useState<DirectPurchaseItem | null>(null);

  const isDirectMode = searchParams.get('mode') === 'direct';

  useEffect(() => {
    if (isDirectMode) {
      const storedItem = sessionStorage.getItem('directPurchaseItem');
      if (storedItem) {
        try {
          const parsedItem = JSON.parse(storedItem);
          setDirectPurchaseItem(parsedItem);
        } catch (error) {
          router.push('/cart');
        }
      } else {
        router.push('/cart');
      }
    }
  }, [isDirectMode, router]);

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

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(cartItemId, newQuantity);
    } catch (error) {
      alert('수량 변경에 실패했습니다.');
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    if (!confirm('이 상품을 장바구니에서 제거하시겠습니까?')) return;
    try {
      await removeCartItem(cartItemId);
    } catch (error) {
      alert('상품 제거에 실패했습니다.');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('장바구니를 모두 비우시겠습니까?')) return;
    try {
      await clearCart();
    } catch (error) {
      alert('장바구니 비우기에 실패했습니다.');
    }
  };

  const handlePurchase = () => {
    if (!displayData?.items.length) {
      alert('상품이 없습니다.');
      return;
    }
    if (isDirectMode) {
      sessionStorage.removeItem('directPurchaseItem');
      alert('결제 기능은 준비 중입니다. (바로 구매)');
    } else {
      alert('결제 기능은 준비 중입니다.');
    }
  };

  const getCategoryInfo = (category: string) => {
    const categories: Record<string, { name: string; color: string }> = {
      workbook: { name: '문제집', color: 'bg-blue-100 text-blue-800' },
      '문제집': { name: '문제집', color: 'bg-blue-100 text-blue-800' },
      test: { name: '시험지', color: 'bg-green-100 text-green-800' },
      '시험지': { name: '시험지', color: 'bg-green-100 text-green-800' },
      solution: { name: '해설', color: 'bg-purple-100 text-purple-800' },
      '해설': { name: '해설', color: 'bg-purple-100 text-purple-800' },
      material: { name: '학습답지', color: 'bg-orange-100 text-orange-800' },
      '학습답지': { name: '학습답지', color: 'bg-orange-100 text-orange-800' },
    };
    return categories[category] || { name: category || '문제집', color: 'bg-gray-100 text-gray-800' };
  };

  if (isDirectMode && !directPurchaseItem) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isDirectMode && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            장바구니를 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const displayData = isDirectMode && directPurchaseItem ? {
    items: [directPurchaseItem],
    totalCount: directPurchaseItem.quantity,
    totalPrice: directPurchaseItem.examPaper.price * directPurchaseItem.quantity,
    totalSalePrice: (directPurchaseItem.examPaper.salePrice || directPurchaseItem.examPaper.price) * directPurchaseItem.quantity,
  } : cartData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isDirectMode ? '바로 구매' : '장바구니'}
            </h1>
            {isDirectMode && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                선택한 상품을 바로 구매합니다
              </p>
            )}
          </div>
          {!isDirectMode && displayData?.items.length ? (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              전체 삭제
            </button>
          ) : null}
        </div>

        {!displayData?.items.length ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"/>
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              장바구니가 비어있습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              자료에서 원하는 문제지를 찾아보세요
            </p>
            <Link
              href="/store"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              자료 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {displayData.items.map((item) => {
                const categoryInfo = getCategoryInfo(item.examPaper.type || '');
                const effectivePrice = item.examPaper.salePrice || item.examPaper.price;
                return (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img
                          src={`/stores/${item.examPaper.id}/thumbnail.png`}
                          alt={item.examPaper.title}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${categoryInfo.color} mb-2`}>
                              {categoryInfo.name}
                            </span>
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                              {item.examPaper.title}
                            </h3>
                            {item.examPaper.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                {item.examPaper.description}
                              </p>
                            )}
                          </div>
                          {!isDirectMode && (
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-4"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-2">
                            {item.examPaper.salePrice && item.examPaper.salePrice < item.examPaper.price ? (
                              <>
                                <span className="font-bold text-red-600 dark:text-red-400">
                                  ₩{(effectivePrice || 0).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  ₩{(item.examPaper.price || 0).toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-900 dark:text-white">
                                ₩{(effectivePrice || 0).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {isDirectMode ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    const updatedItem = { ...directPurchaseItem!, quantity: item.quantity - 1 };
                                    setDirectPurchaseItem(updatedItem);
                                    sessionStorage.setItem('directPurchaseItem', JSON.stringify(updatedItem));
                                  }
                                }}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                -
                              </button>
                              <span className="w-12 text-center text-gray-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  const updatedItem = { ...directPurchaseItem!, quantity: item.quantity + 1 };
                                  setDirectPurchaseItem(updatedItem);
                                  sessionStorage.setItem('directPurchaseItem', JSON.stringify(updatedItem));
                                }}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                -
                              </button>
                              <span className="w-12 text-center text-gray-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-right mt-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">소계: </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ₩{((effectivePrice || 0) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">주문 요약</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">총 상품 수량</span>
                  <span className="text-gray-900 dark:text-white font-medium">{displayData.totalCount || 0}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">상품 금액</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ₩{(displayData.totalPrice || 0).toLocaleString()}
                  </span>
                </div>
                {(displayData.totalPrice || 0) !== (displayData.totalSalePrice || 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 dark:text-red-400">할인 금액</span>
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      -₩{((displayData.totalPrice || 0) - (displayData.totalSalePrice || 0)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">최종 결제금액</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₩{(displayData.totalSalePrice || 0).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handlePurchase}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  결제하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


