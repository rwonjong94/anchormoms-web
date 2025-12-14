'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { PageContainer, PageHeader, Card, Button, Badge, Grid, Input, EmptyState, LoadingSpinner } from '@/components/ui';

interface Column {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  category: string;
  authorId: string;
  videoUrl?: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ColumnListResponse {
  columns: Column[];
  total: number;
  hasMore: boolean;
}

export default function ColumnPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 첫 번째 이미지 URL 추출 함수
  const extractFirstImage = (content: string): string | null => {
    // 마크다운 이미지 패턴 ![alt](url) 매칭
    const markdownImageMatch = content.match(/!\[.*?\]\((.*?)\)/);
    if (markdownImageMatch && markdownImageMatch[1]) {
      return markdownImageMatch[1];
    }
    
    // HTML img 태그 패턴 <img src="url"> 매칭
    const htmlImageMatch = content.match(/<img[^>]*src\s*=\s*['"']([^'"']*)['"'][^>]*>/);
    if (htmlImageMatch && htmlImageMatch[1]) {
      return htmlImageMatch[1];
    }
    
    return null;
  };

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      '학습방법': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      '시험정보': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      '진학상담': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      '교재분석': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      '수학팁': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      '입시분석': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      '학습도구': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
      '기타': 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
    };
    
    return colorMap[category] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
  };

  // 칼럼 목록 불러오기
  const fetchColumns = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      const params = new URLSearchParams({
        limit: '10',
        offset: (currentPage * 10).toString(),
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      });

      const response = await fetch(`/api/column?${params}`);
      if (!response.ok) {
        throw new Error('칼럼 목록을 불러오는데 실패했습니다.');
      }

      const data: ColumnListResponse = await response.json();
      
      if (reset) {
        setColumns(data.columns);
        setPage(1);
      } else {
        setColumns(prev => [...prev, ...data.columns]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 목록 불러오기
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/column/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('카테고리 목록을 불러오는데 실패했습니다:', err);
    }
  };

  // 컴포넌트 마운트 시 카테고리와 칼럼 목록 불러오기
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchColumns(true);
  }, [selectedCategory]);


  // 검색 기능 (클라이언트 사이드)
  const filteredColumns = columns.filter(column =>
    searchQuery === '' || 
    column.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    column.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button 
            onClick={() => fetchColumns(true)}
            className="mt-4 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-500"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <div className="space-y-6">

        {/* 필터 및 검색 (숨김) */}

        {/* 칼럼 목록 */}
        {loading && filteredColumns.length === 0 ? (
          <LoadingSpinner size="lg" text="칼럼을 불러오는 중..." />
        ) : filteredColumns.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="작성된 칼럼이 없습니다"
            description="아직 등록된 칼럼이 없습니다. 곧 유용한 정보를 제공해드릴 예정입니다."
          />
        ) : (
          <div className="space-y-4">
            {filteredColumns.map((column: Column) => (
              <Card key={column.id} hover className="group">
                <Link href={`/column/${column.id}`} className="block">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-title mb-2 group-hover:text-primary transition-colors">
                        {column.title}
                      </h3>
                      {column.subtitle && (
                        <p className="text-body text-sm mb-3 font-medium">
                          {column.subtitle}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-muted">
                        <Badge variant="primary" size="sm">
                          {column.category}
                        </Badge>
                        <span>조회수 {column.viewCount.toLocaleString()}</span>
                        <span>{new Date(column.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    
                    {/* 썸네일 이미지 */}
                    {(() => {
                      const firstImageUrl = extractFirstImage(column.content);
                      return firstImageUrl ? (
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted dark:bg-hover border border-default">
                            <img
                              src={firstImageUrl}
                              alt={column.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center text-muted">
                                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                  </div>
                                `;
                              }}
                            />
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </Link>
              </Card>
            ))}
            
            {/* 더 보기 버튼 */}
            {hasMore && searchQuery === '' && (
              <div className="text-center pt-6">
                <Button
                  onClick={() => fetchColumns(false)}
                  disabled={loading}
                  loading={loading}
                  size="lg"
                >
                  더 보기
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
} 