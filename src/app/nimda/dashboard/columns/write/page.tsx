'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import dynamic from 'next/dynamic';
import { copyWithoutNotification } from '@/utils/clipboard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import 'katex/dist/katex.min.css';

// 동적 import로 MDEditor 로드 (SSR 방지)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface ColumnData {
  title: string;
  subtitle?: string;
  content: string;
  category: string;
  videoUrl?: string;
  isPublished: boolean;
  imageFiles?: File[];
  imageUrls?: string[];
  imagePaths?: string[];
}

const CATEGORIES = [
  '수학 기초',
  '문제 해설',
  '학습 방법',
  '시험 전략',
  '학부모 가이드',
  '기타'
];

function AdminColumnWritePageContent() {
  const { requireAuth, loading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [formData, setFormData] = useState<ColumnData>({
    title: '',
    subtitle: '',
    content: '',
    category: '수학 기초',
    videoUrl: '',
    isPublished: false,
    imageFiles: [],
    imageUrls: [],
    imagePaths: []
  });

  const [currentColumnId, setCurrentColumnId] = useState<string | null>(null);

  // 마크다운에서 이미지 경로 추출 함수
  const extractImagePaths = (content: string): string[] => {
    const imageRegex = /!\[.*?\]\((\/images\/columns\/[^)]+)\)/g;
    const paths: string[] = [];
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      paths.push(match[1]);
    }
    return paths;
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedImageIndex, setCopiedImageIndex] = useState<number | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewColumn, setPreviewColumn] = useState<any>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerSrc, setImageViewerSrc] = useState('');

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // 이미지 뷰어 열기
  const openImageViewer = (src: string) => {
    setImageViewerSrc(src);
    setImageViewerOpen(true);
  };

  // ESC 키 처리 (미리보기 모달 및 이미지 뷰어 닫기)
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewModalOpen) {
          setPreviewModalOpen(false);
          setPreviewColumn(null);
        } else if (imageViewerOpen) {
          setImageViewerOpen(false);
        }
      }
    };

    if (previewModalOpen || imageViewerOpen) {
      window.addEventListener('keydown', handleEscKey);
      return () => window.removeEventListener('keydown', handleEscKey);
    }
  }, [previewModalOpen, imageViewerOpen]);


  // 수정 모드일 때 기존 칼럼 데이터 불러오기
  useEffect(() => {
    if (isEditMode && editId && isAuthenticated) {
      const fetchColumn = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('adminToken');
          
          if (!token) {
            setError('관리자 로그인이 필요합니다.');
            return;
          }
          
          const response = await fetch(`/api/nimda/columns/${editId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const columnData = await response.json();
            
            // 마크다운 콘텐츠에서 이미지 경로 추출
            const imagePaths = extractImagePaths(columnData.content);
            
            setFormData({
              title: columnData.title,
              subtitle: columnData.subtitle || '',
              content: columnData.content,
              category: columnData.category,
              videoUrl: columnData.videoUrl || '',
              isPublished: columnData.isPublished,
              imageFiles: [], // 파일 객체는 복원할 수 없음
              imageUrls: imagePaths, // 추출된 경로를 URL로 사용
              imagePaths: imagePaths
            });
          } else {
            if (response.status === 401) {
              setError('관리자 권한이 필요합니다.');
            } else if (response.status === 404) {
              setError('칼럼을 찾을 수 없습니다.');
            } else {
              const errorData = await response.json();
              setError(errorData.error || '칼럼을 불러오는데 실패했습니다.');
            }
          }
        } catch (err) {
          setError('네트워크 오류가 발생했습니다.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchColumn();
    }
  }, [isEditMode, editId, isAuthenticated]);



  // 이미지 업로드 처리
  // 칼럼 초안 생성 함수
  const createDraftColumn = async () => {
    if (!formData.title.trim()) {
      throw new Error('제목을 입력해주세요.');
    }

    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nimda/columns/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: formData.title,
        category: formData.category,
      }),
    });

    if (!response.ok) {
      throw new Error('칼럼 초안 생성에 실패했습니다.');
    }

    const result = await response.json();
    return result.id;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        // 새 작성 모드이고 칼럼 ID가 없으면 먼저 초안 생성
        let columnId = editId || currentColumnId;
        if (!columnId && !isEditMode) {
          columnId = await createDraftColumn();
          setCurrentColumnId(columnId);
        }

        
        const newFiles = Array.from(files);
        
        // 각 파일을 서버에 업로드
        const uploadPromises = newFiles.map(async (file, index) => {
          const currentImageCount = (formData.imageFiles || []).length;
          const imageIndex = currentImageCount + index;
          
          // FormData 생성
          const uploadFormData = new FormData();
          uploadFormData.append('image', file);
          uploadFormData.append('imageIndex', imageIndex.toString());
          // 칼럼 ID 전달 (이제 항상 있음)
          if (columnId) {
            uploadFormData.append('columnId', columnId);
          }
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nimda/images/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            },
            body: uploadFormData,
          });
          
          if (!response.ok) {
            throw new Error('이미지 업로드 실패');
          }
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || '업로드 실패');
          }
          
          // Backend에서 반환하는 imagePath는 이미 /images/columns/filename 형식
          const imagePath = result.imagePath; // 예: /images/columns/columnId_hash.jpg
          return {
            file,
            url: imagePath, // nginx를 통한 정적 파일 접근 경로
            path: imagePath // 복사용 상대 경로
          };
        } catch (error) {
          console.error('이미지 업로드 에러:', error);
          // 업로드 실패 시 임시 경로 사용
          return {
            file,
            url: URL.createObjectURL(file),
            path: `업로드 실패: ${file.name}`
          };
        }
      });
      
      // 모든 업로드 완료 대기
      const uploadResults = await Promise.all(uploadPromises);
      
      // 상태 업데이트
      const newImageFiles = [...(formData.imageFiles || []), ...uploadResults.map(r => r.file)];
      const newImageUrls = [...(formData.imageUrls || []), ...uploadResults.map(r => r.url)];
      const newImagePaths = [...(formData.imagePaths || []), ...uploadResults.map(r => r.path)];
      
      setFormData({
        ...formData,
        imageFiles: newImageFiles,
        imageUrls: newImageUrls,
        imagePaths: newImagePaths
      });
      } catch (error) {
        console.error('이미지 업로드 프로세스 에러:', error);
        setError(error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  // 이미지 삭제
  const removeImage = async (index: number) => {
    
    // 서버에서 실제 이미지 파일 삭제
    const imagePathToDelete = formData.imagePaths?.[index];
    if (imagePathToDelete) {
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`/api/nimda/images/delete?path=${encodeURIComponent(imagePathToDelete)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('칼럼 이미지 파일 삭제 완료:', imagePathToDelete);
      } catch (error) {
        console.error('칼럼 이미지 파일 삭제 실패:', error);
      }
    }
    
    const newImageFiles = (formData.imageFiles || []).filter((_, i) => i !== index);
    const newImageUrls = (formData.imageUrls || []).filter((_, i) => i !== index);
    const newImagePaths = (formData.imagePaths || []).filter((_, i) => i !== index);
    
    setFormData({
      ...formData,
      imageFiles: newImageFiles,
      imageUrls: newImageUrls,
      imagePaths: newImagePaths
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const url = isEditMode ? `/api/nimda/columns/${editId}` : '/api/nimda/columns';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (isEditMode ? '칼럼 수정에 실패했습니다.' : '칼럼 저장에 실패했습니다.'));
      }

      const result = await response.json();
      // 성공 시 대시보드로 리다이렉트하면서 성공 메시지를 전달할 수 있음
      router.push(`/nimda/dashboard/columns?success=${isEditMode ? 'edit' : 'true'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 표시
  if (loading || !isAuthenticated || isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg shadow p-6 border border-default">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
              <p className="text-body">페이지를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full">
          {/* 메인 콘텐츠 */}
          <div>
            <div className="bg-card rounded-lg shadow border border-default">
              {/* 헤더 */}
              <div className="px-6 py-4 border-b border-default">
                <div className="flex justify-between items-center">
                  <h1 className="sr-only">{isEditMode ? '칼럼 수정' : '칼럼 작성'}</h1>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => router.push('/nimda/dashboard/columns')}
                      className="px-4 py-2 text-body border border-input rounded-md hover:bg-hover"
                    >
                      목록으로
                    </button>
                  </div>
                </div>
              </div>

              {/* 작성 폼 */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-title">기본 정보</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 제목 */}
                    <div className="md:col-span-2">
                      <label htmlFor="title" className="block text-sm font-medium text-body mb-2">
                        제목 *
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="칼럼 제목을 입력하세요"
                        required
                      />
                    </div>

                    {/* 부제목 */}
                    <div className="md:col-span-2">
                      <label htmlFor="subtitle" className="block text-sm font-medium text-body mb-2">
                        부제목 (선택사항)
                      </label>
                      <input
                        type="text"
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="칼럼 부제목을 입력하세요"
                      />
                    </div>

                    {/* 카테고리 */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-body mb-2">
                        카테고리
                      </label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    {/* 비디오 URL */}
                    <div>
                      <label htmlFor="videoUrl" className="block text-sm font-medium text-body mb-2">
                        비디오 URL (선택사항)
                      </label>
                      <input
                        type="url"
                        id="videoUrl"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>

                  </div>
                </div>

                {/* 마크다운 에디터 */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-title">내용 작성</h2>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-body">
                        칼럼 내용
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewColumn({
                            title: formData.title,
                            subtitle: formData.subtitle,
                            content: formData.content,
                            category: formData.category,
                            videoUrl: formData.videoUrl,
                            isPublished: formData.isPublished
                          });
                          setPreviewModalOpen(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>미리보기</span>
                      </button>
                    </div>
                    <div className="border border-input rounded-md">
                      <MDEditor
                        value={formData.content}
                        onChange={(value) => setFormData({ ...formData, content: value || '' })}
                        preview="edit"
                        height={400}
                        data-color-mode="light"
                      />
                    </div>
                  </div>

                  {/* 이미지 업로드 */}
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      이미지 업로드 (선택사항)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {formData.imageUrls && formData.imageUrls.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-5 gap-3">
                          {formData.imageUrls.map((url, index) => (
                            <div key={index} className="relative">
                              <div className="relative group">
                                <img
                                  src={url}
                                  alt={`이미지 ${index + 1}`}
                                  className="w-full h-20 object-contain border border-default rounded-lg cursor-pointer bg-muted"
                                  onClick={() => openImageViewer(url)}
                                />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeImage(index);
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 dark:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 dark:hover:bg-red-500"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="mt-1 text-xs text-body break-all">
                                <div className="flex items-center justify-between">
                                  <span className="truncate flex-1">
                                    {formData.imagePaths?.[index] || '경로 생성 오류'}
                                  </span>
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const pathToCopy = formData.imagePaths?.[index] || '';
                                      if (pathToCopy) {
                                        await copyWithoutNotification(pathToCopy);
                                        setCopiedImageIndex(index);
                                        setTimeout(() => setCopiedImageIndex(null), 2000);
                                      }
                                    }}
                                    className={`ml-1 px-2 py-1 rounded text-xs transition-colors ${
                                      copiedImageIndex === index
                                        ? 'bg-blue-700 dark:bg-blue-800 text-white'
                                        : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500'
                                    }`}
                                    title="경로 복사"
                                  >
                                    {copiedImageIndex === index ? '복사됨' : '복사'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>


                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* 제출 버튼 */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push('/nimda/dashboard/columns')}
                    className="px-6 py-2 text-body border border-input rounded-md hover:bg-hover"
                  >
                    뒤로가기
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting 
                      ? (isEditMode ? '수정 중...' : '저장 중...') 
                      : '저장'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 칼럼 미리보기 모달 */}
      {previewModalOpen && previewColumn && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl max-h-[90vh] m-4 bg-card rounded-lg shadow-lg overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-default bg-muted">
              <h3 className="text-lg font-semibold text-title">
                칼럼 미리보기
              </h3>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 hover:bg-hover rounded-md transition-colors"
              >
                <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            
            {/* 모달 내용 */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-6">
                {/* 동영상 영역 (최우선 표시) */}
                {previewColumn.videoUrl && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-title">관련 영상</h2>
                    {(() => {
                      // YouTube 비디오 ID 추출 함수
                      const extractYouTubeVideoId = (url: string): string | null => {
                        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                        return match ? match[1] : null;
                      };
                      
                      const videoId = extractYouTubeVideoId(previewColumn.videoUrl);
                      
                      if (videoId) {
                        return (
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title="YouTube video"
                              className="w-full h-full rounded-lg"
                              allowFullScreen
                            />
                          </div>
                        );
                      } else {
                        return (
                          <a
                            href={previewColumn.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {previewColumn.videoUrl}
                          </a>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* 칼럼 헤더 정보 */}
                <div className="mb-6">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {previewColumn.category}
                    </span>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-title mb-4">
                    {previewColumn.title || '제목을 입력하세요'}
                  </h1>
                  
                  {previewColumn.subtitle && (
                    <p className="text-xl text-body mb-4 font-medium">
                      {previewColumn.subtitle}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted">
                    <span>{new Date().toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                    <span>조회수 0</span>
                  </div>
                </div>

                {/* 본문 내용 */}
                <div className="prose prose-lg max-w-none prose-gray dark:prose-invert prose-headings:text-title prose-p:text-body prose-p:leading-relaxed prose-strong:text-title">
                  {previewColumn.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                      components={createMarkdownComponents({
                        questionNumber: 1,
                        imageErrorPrefix: '칼럼 이미지 로드 실패',
                        blockquoteStyle: 'default'
                      })}
                    >
                      {previewColumn.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted italic">내용을 입력하면 여기에 미리보기가 표시됩니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 뷰어 모달 */}
      {imageViewerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] m-4">
            <img
              src={imageViewerSrc}
              alt="확대 이미지"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setImageViewerOpen(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 dark:bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-opacity-70 dark:hover:bg-opacity-90"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminColumnWritePage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg shadow p-6 border border-default">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
              <p className="text-body">로딩 중...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    }>
      <AdminColumnWritePageContent />
    </Suspense>
  );
}