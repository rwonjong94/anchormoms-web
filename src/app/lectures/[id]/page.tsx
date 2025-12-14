'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export default function LectureDetailPage() {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [relatedLectures, setRelatedLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lectureId = params.id as string;

  useEffect(() => {
    // 로딩 중일 때는 아무것도 하지 않음
    if (isLoading) {
      return;
    }
    
    // 로딩 완료 후 인증되지 않은 경우에만 리다이렉트
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    fetchLecture();
  }, [isAuthenticated, lectureId, router, isLoading]);

  const fetchLecture = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/lectures/${lectureId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Check if lecture is published
        if (!data.isPublished) {
          setError('이 강의는 현재 공개되지 않았습니다.');
          return;
        }
        
        setLecture(data);
        
        // Fetch related lectures from the same category
        await fetchRelatedLectures(data.categoryId);
      } else if (response.status === 404) {
        setError('강의를 찾을 수 없습니다.');
      } else {
        setError('강의를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch lecture:', error);
      setError('강의를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedLectures = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/lectures?categoryId=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        // Include all published lectures (including current lecture)
        const related = data.filter((l: Lecture) => l.isPublished);
        setRelatedLectures(related);
      }
    } catch (error) {
      console.error('Failed to fetch related lectures:', error);
    }
  };

  const videoId = lecture?.videoUrl ? getYouTubeVideoId(lecture.videoUrl) : null;

  // 인증 로딩 중이거나 강의 데이터 로딩 중인 경우
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-body">
            {isLoading ? '인증 정보를 확인하는 중...' : '강의를 불러오는 중...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-title mb-2">오류가 발생했습니다</h1>
          <p className="text-body mb-4">{error}</p>
          <button
            onClick={() => router.push('/lectures')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            강의 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Navigation */}
      <div className="bg-card shadow border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => router.push('/lectures')}
              className="flex items-center text-sm font-medium text-body hover:text-title"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              강의 목록
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Related Lectures */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-lg p-6 border-default">
              <h3 className="text-lg font-semibold text-title mb-4">
                {lecture.category.name} 강의
              </h3>
              
              {relatedLectures.length > 0 ? (
                <div className="space-y-4">
                  {relatedLectures.map((relatedLecture) => {
                    const isCurrentLecture = relatedLecture.id === lectureId;
                    return (
                      <div
                        key={relatedLecture.id}
                        onClick={() => {
                          if (!isCurrentLecture) {
                            router.push(`/lectures/${relatedLecture.id}`);
                          }
                        }}
                        className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${
                          isCurrentLecture 
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 cursor-default shadow-md' 
                            : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent hover:shadow-sm'
                        }`}
                      >
                        
                        {/* Thumbnail */}
                        <div className={`flex-shrink-0 w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden ${
                          isCurrentLecture ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''
                        }`}>
                          {relatedLecture.thumbnail ? (
                            <img
                              src={`/${relatedLecture.thumbnail}`}
                              alt={relatedLecture.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className={`w-6 h-6 ${
                                isCurrentLecture 
                                  ? 'text-blue-500 dark:text-blue-400' 
                                  : 'text-gray-400 dark:text-gray-500'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium line-clamp-2 ${
                            isCurrentLecture 
                              ? 'text-blue-800 dark:text-blue-200 font-semibold' 
                              : 'text-title'
                          }`}>
                            {relatedLecture.title}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted text-center py-8">
                  이 카테고리의 다른 강의가 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <div className="bg-card rounded-lg shadow-lg overflow-hidden mb-8 border-default">
              <div className="aspect-video">
                {videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={lecture.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <div className="text-center text-muted">
                      <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium">동영상을 불러올 수 없습니다</p>
                      <p className="text-sm mt-1">올바른 YouTube 링크가 설정되지 않았습니다.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lecture Info */}
            <div className="bg-card rounded-lg shadow-lg p-6 border-default">
              {/* Header */}
              <div className="mb-6">
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                    {lecture.category.name}
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-title mb-4">{lecture.title}</h1>
              </div>

              {/* Description */}
              <div className="border-t border-input pt-6">
                <h2 className="text-xl font-semibold text-title mb-4">강의 소개</h2>
                <div className="prose prose-lg max-w-none text-body">
                  <p className="whitespace-pre-line leading-relaxed">{lecture.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}