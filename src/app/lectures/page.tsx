'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface LectureCategory {
  id: string;
  name: string;
  createdAt: string;
  Lecture: Lecture[];
}

interface Lecture {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  categoryId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
}

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [categories, setCategories] = useState<LectureCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Lectures page useEffect - isAuthenticated:', isAuthenticated, 'user:', user, 'isLoading:', isLoading);
    
    // 로딩 중일 때는 아무것도 하지 않음
    if (isLoading) {
      return;
    }
    
    // 로딩 완료 후 인증되지 않은 경우에만 리다이렉트
    if (!isAuthenticated) {
      console.log('Not authenticated after loading, redirecting to login');
      router.push('/auth/login');
      return;
    }
    
    console.log('Fetching categories and lectures...');
    fetchCategories();
    fetchLectures();
  }, [isAuthenticated, user, selectedCategory, router, isLoading]);

  // 검색 기능 (클라이언트 사이드)
  const filteredLectures = lectures.filter(lecture =>
    searchQuery === '' || 
    lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lecture.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from', `${process.env.NEXT_PUBLIC_API_URL}/api/lectures/categories`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lectures/categories`);
      console.log('Categories response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Categories data:', data);
        setCategories(data);
      } else {
        console.error('Categories fetch failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = selectedCategory 
        ? `${baseUrl}/api/lectures?categoryId=${selectedCategory}`
        : `${baseUrl}/api/lectures`;
      
      console.log('Fetching lectures with URL:', url);
      console.log('Selected category:', selectedCategory);
      
      const response = await fetch(url);
      console.log('Lectures response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched lectures raw data:', data);
        // Only show published lectures for users
        const publishedLectures = data.filter((lecture: Lecture) => lecture.isPublished);
        console.log('Published lectures:', publishedLectures);
        setLectures(publishedLectures);
      } else {
        console.error('Failed to fetch lectures, status:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch lectures:', error);
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-title mb-2">강의</h1>
          <p className="text-body">고수준의 수학 강의를 만나보세요</p>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex justify-end">
          <div className="flex space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card text-title"
            >
              <option value="">전체 카테고리</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력하세요"
                className="pl-10 pr-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-card text-title placeholder-muted"
              />
              <svg
                className="w-5 h-5 text-muted absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 강의 목록 - 갤러리 형식 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-body">강의를 불러오는 중...</p>
          </div>
        ) : filteredLectures.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body">
              {searchQuery ? '검색 결과가 없습니다.' : selectedCategory ? '선택한 카테고리에 게시된 강의가 없습니다.' : '아직 게시된 강의가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLectures.map((lecture) => (
              <div
                key={lecture.id}
                className="bg-card rounded-lg shadow-sm border border-default overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/lectures/${lecture.id}`)}
              >
                {/* 썸네일 이미지 */}
                <div className="aspect-video bg-muted dark:bg-hover flex items-center justify-center">
                  {lecture.thumbnail ? (
                    <img
                      src={`/${lecture.thumbnail}?v=${new Date(lecture.updatedAt).getTime()}`}
                      alt={lecture.title}
                      className="w-full h-full object-cover"
                      key={`${lecture.id}-${lecture.updatedAt}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center text-muted">
                            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="text-muted text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">썸네일 없음</span>
                    </div>
                  )}
                </div>

                {/* 컨텐츠 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                      {lecture.category.name}
                    </span>
                    <div className="flex items-center text-muted">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="font-bold text-title mb-2 line-clamp-2">{lecture.title}</h3>
                  <p className="text-sm text-body mb-4 line-clamp-3">{lecture.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}