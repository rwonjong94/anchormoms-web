import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem {
  id: string;
  userId: string;
  examPaperId: string;
  quantity: number;
  createdAt: string;
  examPaper: {
    id: string;
    title: string;
    description?: string;
    price: number;
    salePrice?: number;
    thumbnailImage?: string;
    downloadCount: number;
    viewCount: number;
    isActive: boolean;
    createdAt: string;
  };
}

export interface CartResponse {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  totalSalePrice: number;
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart data');
  }

  return response.json();
};

export function useCart() {
  const { user } = useAuth();
  
  const {
    data: cartData,
    error,
    mutate,
    isLoading
  } = useSWR<CartResponse>(
    user ? '/api/cart' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const {
    data: cartCount,
    mutate: mutateCount
  } = useSWR<{ count: number }>(
    user ? '/api/cart/count' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const addToCart = async (storeProductId: string, quantity: number = 1) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storeProductId, quantity }),
    });

    if (!response.ok) {
      throw new Error('Failed to add item to cart');
    }

    const result = await response.json();
    
    // Cart 데이터 갱신
    await mutate();
    await mutateCount();
    
    return result;
  };

  const updateCartItem = async (cartItemId: string, quantity: number) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error('Failed to update cart item');
    }

    const result = await response.json();
    
    // Cart 데이터 갱신
    await mutate();
    await mutateCount();
    
    return result;
  };

  const removeCartItem = async (cartItemId: string) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove cart item');
    }

    // Cart 데이터 갱신
    await mutate();
    await mutateCount();
  };

  const clearCart = async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/cart', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }

    // Cart 데이터 갱신
    await mutate();
    await mutateCount();
  };

  return {
    cartData,
    cartCount: cartCount?.count || 0,
    isLoading,
    error,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refreshCart: mutate,
  };
}