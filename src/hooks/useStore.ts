import useSWR from 'swr';

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

interface StoreProductsResponse {
  examPapers: StoreProduct[];
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

export function useStoreProducts(page = 1, limit = 20) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const { data, error, mutate } = useSWR<StoreProductsResponse>(
    `/api/stores/exam-papers?${queryParams.toString()}`,
    fetcher
  );

  return {
    products: data?.examPapers || [],
    pagination: data?.pagination,
    loading: !error && !data,
    error,
    mutate,
  };
}

export function useStoreProductTypes() {
  const { data, error, mutate } = useSWR<string[]>(
    '/api/stores/exam-papers/types',
    fetcher
  );

  return {
    types: data || [],
    loading: !error && !data,
    error,
    mutate,
  };
}

export function useStoreProduct(id: string) {
  const { data, error, mutate } = useSWR<StoreProduct>(
    id ? `/api/stores/exam-papers/${id}` : null,
    fetcher
  );

  return {
    product: data,
    loading: !error && !data,
    error,
    mutate,
  };
}