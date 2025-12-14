import { Suspense } from 'react';
import StorePageClient from './StorePageClient';

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

export default function StorePage() {
  return (
    <Suspense>
      <StorePageClient />
    </Suspense>
  );
}

// 상품 카드 컴포넌트
function StoreProductCard() { return null; }
