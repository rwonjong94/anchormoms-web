import { Suspense } from 'react';
import CartPageClient from './CartPageClient';

export default function CartPage() {
  return (
    <Suspense>
      <CartPageClient />
    </Suspense>
  );
}