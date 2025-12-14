'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import 'katex/dist/katex.min.css';
import { useAuth } from '../../../contexts/AuthContext';

interface ColumnData {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  category: string;
  authorId: string;
  videoUrl?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AdjacentColumn {
  id: string;
  title: string;
}

interface AdjacentColumns {
  previous: AdjacentColumn | null;
  next: AdjacentColumn | null;
}

export default function ColumnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [column, setColumn] = useState<ColumnData | null>(null);
  const [adjacentColumns, setAdjacentColumns] = useState<AdjacentColumns | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 칼럼 데이터와 인접 칼럼 데이터를 병렬로 가져오기
        const [columnResponse, adjacentResponse] = await Promise.all([
          fetch(`/api/column/${params.id}`),
          fetch(`/api/column/${params.id}/adjacent`)
        ]);
        
        if (!columnResponse.ok) {
          if (columnResponse.status === 404) {
            setError('칼럼을 찾을 수 없습니다.');
          } else {
            setError('칼럼을 불러오는데 실패했습니다.');
          }
          return;
        }

        const columnData = await columnResponse.json();
        setColumn(columnData);

        if (adjacentResponse.ok) {
          const adjacentData = await adjacentResponse.json();
          setAdjacentColumns(adjacentData);
        }
      } catch (err) {
        setError('네트워크 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-body">칼럼을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !column) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="bg-card p-8 rounded-lg shadow-md text-center border border-default">
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">오류</h2>
          <p className="text-body mb-6">{error || '알 수 없는 오류가 발생했습니다.'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            이전 페이지로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 목록 가기 버튼 */}
        <button
          onClick={() => router.push('/column')}
          className="flex items-center gap-2 text-body hover:text-title mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록 가기
        </button>

        {/* 칼럼 헤더 */}
        <div className="bg-card rounded-lg shadow-sm p-8 mb-6 border border-default">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              {column.category}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-title mb-4">
            {column.title}
          </h1>
          
          {column.subtitle && (
            <p className="text-xl text-body mb-4 font-medium">
              {column.subtitle}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{formatDate(column.createdAt)}</span>
            <span>조회수 {column.viewCount.toLocaleString()}</span>
          </div>
        </div>

        {/* 비디오 (있는 경우) */}
        {column.videoUrl && (
          <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-default">
            <h2 className="text-lg font-semibold mb-4 text-title">관련 영상</h2>
            {extractYouTubeVideoId(column.videoUrl) ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeVideoId(column.videoUrl)}`}
                  title="YouTube video"
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            ) : (
              <a
                href={column.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {column.videoUrl}
              </a>
            )}
          </div>
        )}

        {/* 칼럼 내용 */}
        <div className="bg-card rounded-lg shadow-sm p-8 border border-default">
          <div className="prose prose-lg max-w-none prose-gray dark:prose-invert prose-headings:text-title prose-p:text-body prose-p:leading-relaxed prose-strong:text-title">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                ...createMarkdownComponents({
                  questionNumber: 1,
                  imageErrorPrefix: '칼럼 이미지 로드 실패',
                  blockquoteStyle: 'default'
                }),
                // 비디오 임베드 지원 (커스텀 추가)
                iframe: ({ node, src, ...props }) => {
                  // YouTube 비디오 감지
                  if (src && (src.includes('youtube.com') || src.includes('youtu.be'))) {
                    return (
                      <div className="my-6">
                        <div className="aspect-video">
                          <iframe
                            {...props}
                            src={src}
                            className="w-full h-full rounded-lg"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                      </div>
                    );
                  }
                  // 일반 iframe
                  return (
                    <div className="my-6">
                      <iframe
                        {...props}
                        src={src}
                        className="w-full rounded-lg border border-gray-300"
                        style={{ minHeight: '400px' }}
                      />
                    </div>
                  );
                },
                // 커스텀 추가 컴포넌트 (기본 createMarkdownComponents에서 제공되지 않는 기능)
              }}
            >
              {column.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* 이전/다음 칼럼 네비게이션 */}
        <div className="mt-8">
          <div className="flex justify-between items-center gap-4">
            {/* 이전 칼럼 */}
            <div className="flex-1">
              {adjacentColumns?.previous ? (
                <button
                  onClick={() => router.push(`/column/${adjacentColumns.previous!.id}`)}
                  className="w-full text-left p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-default group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-muted group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-muted mb-1">이전 칼럼</div>
                      <div className="text-sm font-medium text-title group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {adjacentColumns.previous.title}
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="w-full p-4 bg-muted dark:bg-hover rounded-lg border border-default">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-muted opacity-75 mb-1">이전 칼럼</div>
                      <div className="text-sm text-muted opacity-75">첫 번째 칼럼입니다</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 다음 칼럼 */}
            <div className="flex-1">
              {adjacentColumns?.next ? (
                <button
                  onClick={() => router.push(`/column/${adjacentColumns.next!.id}`)}
                  className="w-full text-right p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-default group"
                >
                  <div className="flex items-center gap-3 justify-end">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-muted mb-1">다음 칼럼</div>
                      <div className="text-sm font-medium text-title group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {adjacentColumns.next.title}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-muted group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="w-full p-4 bg-muted dark:bg-hover rounded-lg border border-default">
                  <div className="flex items-center gap-3 justify-end">
                    <div className="min-w-0 flex-1 text-right">
                      <div className="text-sm text-muted opacity-75 mb-1">다음 칼럼</div>
                      <div className="text-sm text-muted opacity-75">마지막 칼럼입니다</div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}