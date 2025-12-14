'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/contexts/ToastContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStoreProducts, useStoreProductTypes } from '@/hooks/useStore';
import { PageContainer, PageHeader, Card, Button, Badge, Grid, LoadingSpinner, EmptyState } from '@/components/ui';
import WithSidebar from '@/components/layouts/WithSidebar';
import StoreSidebar from '@/components/sidebars/StoreSidebar';

interface StoreProduct {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  type: string;
  content: string;
  price: number;
  saleRate: number;
  productFile?: string;
  thumbnailImage?: string;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function StorePageClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { products: allProducts, pagination, loading: productsLoading, error } = useStoreProducts(1, 100);
  const { types, loading: typesLoading } = useStoreProductTypes();

  const filteredProducts = selectedCategory === 'all' 
    ? allProducts 
    : allProducts.filter(product => product.type === selectedCategory);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

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

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    const newUrl = params.toString() ? `/store?${params.toString()}` : '/store';
    router.push(newUrl, { scroll: false });
  };

  const categories = [
    { id: 'all', name: '전체', color: 'bg-gray-100 text-gray-800' },
    ...types.map(type => ({
      id: type,
      name: type,
      color: 'bg-blue-100 text-blue-800'
    }))
  ];

  return (
    <PageContainer maxWidth="xl">
      <WithSidebar sidebar={
        <Card>
          <div className="space-y-2">
            {!typesLoading && categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'text-body hover:bg-hover'
                }`}
              >
                <Badge variant="primary" size="sm" className="mr-2">
                  {category.name}
                </Badge>
                <span className="text-sm">
                  {category.id === 'all' 
                    ? allProducts.length
                    : allProducts.filter(p => p.type === category.id).length
                  }개
                </span>
              </button>
            ))}
            {typesLoading && (
              <>
                <div className="px-3 py-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                </div>
                <div className="px-3 py-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                </div>
              </>
            )}
          </div>
        </Card>
      }>
        <div className="space-y-0">
          {productsLoading && (
            <Grid cols={4} gap="lg">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </Card>
              ))}
            </Grid>
          )}
          {error && (
            <EmptyState
              icon={
                <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="문제지를 불러오는 중 오류가 발생했습니다"
              action={
                <Button onClick={() => window.location.reload()}>
                  다시 시도
                </Button>
              }
            />
          )}
          {!productsLoading && !error && (
            <Grid cols={4} gap="lg">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <StoreProductCard key={product.id} product={product} categories={categories} />
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    icon={
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    }
                    title="선택한 카테고리에 상품이 없습니다"
                    description="다른 카테고리를 선택해보세요."
                  />
                </div>
              )}
            </Grid>
          )}
        </div>
      </WithSidebar>
    </PageContainer>
  );
}

function StoreProductCard({ product, categories }: { product: StoreProduct; categories: { id: string; name: string; color: string }[] }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleCategoryClick = (e: React.MouseEvent, categoryType: string) => {
    e.stopPropagation();
    router.push(`/store?category=${categoryType}`);
  };

  const handleCardClick = () => {
    router.push(`/store/product/${product.id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, 1);
      showSuccess('장바구니에 추가되었습니다!');
    } catch (error) {
      showError('장바구니 추가에 실패했습니다.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handlePurchase = (e: React.MouseEvent) => {
    e.stopPropagation();
    const saleActive = isOnSale();
    const discountedPrice = getDiscountedPrice();
    const directPurchaseData = {
      id: 'direct-purchase',
      userId: '',
      examPaperId: product.id,
      quantity: 1,
      createdAt: new Date().toISOString(),
      examPaper: {
        id: product.id,
        title: product.title,
        type: product.type,
        price: product.price,
        salePrice: saleActive ? discountedPrice : null,
        thumbnailImage: product.thumbnailImage,
        downloadCount: product.downloadCount,
        viewCount: product.viewCount,
        createdAt: product.createdAt,
      },
    };
    sessionStorage.setItem('directPurchaseItem', JSON.stringify(directPurchaseData));
    router.push('/cart?mode=direct');
  };

  const getCategoryInfo = (type: string) => {
    const categoryInfo = categories.find(cat => cat.id === type);
    return categoryInfo || { name: type, color: 'bg-blue-100 text-blue-800' };
  };

  const isOnSale = () => {
    return product.saleRate && product.saleRate > 0;
  };

  const getDiscountedPrice = () => {
    if (!isOnSale()) return product.price;
    return Math.round(product.price * (1 - product.saleRate / 100));
  };

  const categoryInfo = getCategoryInfo(product.type);
  const saleActive = isOnSale();
  const discountedPrice = getDiscountedPrice();

  return (
    <Card 
      onClick={handleCardClick}
      hover
      className="cursor-pointer group"
      padding="none"
    >
      <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden">
        <img
          src={`/stores/${product.id}/thumbnail.png`}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="mb-2">
          <Badge 
            variant="primary" 
            size="sm"
            onClick={(e) => handleCategoryClick(e, product.type)}
            className="cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            {product.type}
          </Badge>
        </div>
        <h3 className="font-semibold text-title line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        {product.subtitle && (
          <p className="text-sm text-body line-clamp-1">
            {product.subtitle}
          </p>
        )}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            {saleActive ? (
              <>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  ₩{discountedPrice.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ₩{product.price.toLocaleString()}
                </span>
                <Badge variant="danger" size="sm">
                  -{product.saleRate}%
                </Badge>
              </>
            ) : (
              <span className="text-lg font-bold text-title">
                ₩{product.price.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              loading={isAddingToCart}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              장바구니
            </Button>
            <Button
              onClick={handlePurchase}
              variant="success"
              size="sm"
              className="flex-1"
            >
              바로 구매
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}


