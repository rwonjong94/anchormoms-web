import { Suspense } from 'react';
import CartPageClient from '@/app/cart/CartPageClient';

export default function ShoppingCartPage() {
  return (
    <Suspense>
      <CartPageClient />
    </Suspense>
  );
}


