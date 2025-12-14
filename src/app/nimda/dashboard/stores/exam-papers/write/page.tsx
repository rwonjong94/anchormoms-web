'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useExamPaperTypes } from '@/hooks/useExamPapers';
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

interface ExamPaperData {
  type: string;
  title: string;
  subtitle?: string;
  category: string;
  content: string;
  price: number;
  saleRate: number;
  saleStartDate?: string;
  saleEndDate?: string;
  thumbnailImage?: string;
  productFile?: string;
  imageFiles?: File[];
  imageUrls?: string[];
  imagePaths?: string[];
}

function AdminExamPaperWritePageContent() {
  const { requireAuth, loading, isAuthenticated } = useAdminAuth();
  const { types } = useExamPaperTypes();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [examPaperData, setExamPaperData] = useState<ExamPaperData>({
    type: '문제집',
    title: '',
    subtitle: '',
    category: 'workbook',
    content: '',
    price: 0,
    saleRate: 0,
    saleStartDate: '',
    saleEndDate: '',
    thumbnailImage: '',
    productFile: '',
    imageFiles: [],
    imageUrls: [],
    imagePaths: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [attachmentFiles, setAttachmentFiles] = useState<{
    examPaper?: File;
    answerKey?: File;
  }>({});
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | ''>('');
  const [contentImages, setContentImages] = useState<{url: string, path: string}[]>([]);
  const [copiedImageIndex, setCopiedImageIndex] = useState<{type: string, index: number} | null>(null);
  const [tempImageFiles, setTempImageFiles] = useState<{[path: string]: File}>({});
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerSrc, setImageViewerSrc] = useState('');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  useEffect(() => {
    if (isEditMode && editId) {
      // 기존 문제지 수정 - 데이터 로드
      loadExistingExamPaper(editId);
    }
    // 새로운 작성 시에는 아무것도 하지 않음 (빈 상태 유지)
  }, [isEditMode, editId]);

  // ESC 키로 이미지 뷰어 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (imageViewerOpen) {
          setImageViewerOpen(false);
        }
        if (typeDropdownOpen) {
          setTypeDropdownOpen(false);
        }
      }
    };

    if (imageViewerOpen || typeDropdownOpen) {
      window.addEventListener('keydown', handleEscKey);
      return () => window.removeEventListener('keydown', handleEscKey);
    }
  }, [imageViewerOpen, typeDropdownOpen]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (typeDropdownOpen && !target.closest('.type-dropdown-container')) {
        setTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [typeDropdownOpen]);


  const loadExistingExamPaper = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/stores/exam-papers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExamPaperData({
          type: data.type || '문제집',
          title: data.title || '',
          subtitle: data.subtitle || '',
          category: data.category || 'workbook',
          content: data.content || '',
          price: data.price || 0,
          saleRate: data.saleRate || 0,
          saleStartDate: data.saleStartDate ? new Date(data.saleStartDate).toISOString().split('T')[0] : '',
          saleEndDate: data.saleEndDate ? new Date(data.saleEndDate).toISOString().split('T')[0] : '',
          thumbnailImage: data.thumbnailImage || '',
          productFile: data.productFile || '',
          imageFiles: [],
          imageUrls: [],
          imagePaths: [],
        });

        if (data.thumbnailImage) {
          // 썸네일 이미지 경로를 올바른 URL로 설정
          setThumbnailPreview(`/stores/${id}/thumbnail.png`);
        }
      }
    } catch (error) {
      console.error('문제지 데이터 로드 실패:', error);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    // 새로운 작성 시에는 로컬 미리보기만 설정
    if (!isEditMode || !editId) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      // 새로운 작성 시에는 thumbnailImage를 설정하지 않음 (나중에 업로드 후 설정)
      return;
    }

    try {
      const formData = new FormData();
      formData.append('thumbnail', file);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/stores/exam-papers/${editId}/upload-thumbnail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setExamPaperData(prev => ({
          ...prev,
          thumbnailImage: result.imagePath,
        }));
        setThumbnailPreview(URL.createObjectURL(file));
      } else {
        throw new Error('썸네일 업로드 실패');
      }
    } catch (error) {
      console.error('썸네일 업로드 오류:', error);
      alert('썸네일 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleAttachmentUpload = async (file: File, type: 'examPaper' | 'answerKey' | 'zipFile') => {
    // 새로운 작성 시에는 파일 정보만 저장
    if (!isEditMode || !editId) {
      setAttachmentFiles(prev => ({ ...prev, [type]: file }));
      setExamPaperData(prev => ({
        ...prev,
        productFile: file.name
      }));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/stores/exam-papers/${editId}/upload-attachment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setExamPaperData(prev => ({
          ...prev,
          productFile: result.filePath,
        }));
        setAttachmentFiles(prev => ({
          ...prev,
          [type]: file,
        }));
      } else {
        throw new Error('첨부파일 업로드 실패');
      }
    } catch (error) {
      console.error('첨부파일 업로드 오류:', error);
      alert('첨부파일 업로드 중 오류가 발생했습니다.');
    }
  };

  // 커스텀 이미지 업로드 처리
  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // 새로운 작성 시에는 로컬에만 저장
    if (!isEditMode || !editId) {
      for (const file of files) {
        const imageUrl = URL.createObjectURL(file);
        // 임시 경로로 파일명 사용
        const tempPath = `temp/${file.name}`;
        setContentImages(prev => [...prev, { url: imageUrl, path: tempPath }]);
        setTempImageFiles(prev => ({ ...prev, [tempPath]: file }));
      }
      e.target.value = '';
      return;
    }

    // 편집 모드에서는 실제 업로드
    for (const file of files) {
      try {
        const imagePath = await handleImageUpload(file);
        const imageUrl = URL.createObjectURL(file);
        
        setContentImages(prev => [...prev, { url: imageUrl, path: imagePath }]);
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        alert('이미지 업로드 중 오류가 발생했습니다.');
      }
    }
    
    // 파일 input 초기화
    e.target.value = '';
  };

  // 이미지 제거
  const removeContentImage = (index: number) => {
    setContentImages(prev => {
      const imageToRemove = prev[index];
      URL.revokeObjectURL(imageToRemove.url); // 메모리 정리
      
      // 임시 파일이면 tempImageFiles에서도 제거
      if (imageToRemove.path.startsWith('temp/')) {
        setTempImageFiles(files => {
          const { [imageToRemove.path]: removed, ...rest } = files;
          return rest;
        });
      }
      
      return prev.filter((_, i) => i !== index);
    });
  };

  // 이미지 경로 복사
  const copyImagePath = async (path: string, index: number, event?: React.MouseEvent) => {
    // 이벤트 전파 중단하여 폼 검증 방지
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    await copyWithoutNotification(path);
    setCopiedImageIndex({type: 'content', index});
    setTimeout(() => setCopiedImageIndex(null), 2000);
  };

  // 이미지 뷰어 열기
  const openImageViewer = (src: string) => {
    setImageViewerSrc(src);
    setImageViewerOpen(true);
  };

  // 첫 저장 후 대기 중인 파일들 업로드
  const uploadPendingFiles = async (examPaperId: string) => {
    const token = localStorage.getItem('adminToken');

    try {
      // 썸네일 업로드
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('thumbnail', thumbnailFile);
        
        const response = await fetch(`/api/nimda/stores/exam-papers/${examPaperId}/upload-thumbnail`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          setExamPaperData(prev => ({ ...prev, thumbnailImage: result.imagePath }));
        }
      }

      // 첨부파일 업로드
      for (const [type, file] of Object.entries(attachmentFiles)) {
        if (file) {
          const formData = new FormData();
          formData.append('attachment', file);
          
          const response = await fetch(`/api/nimda/stores/exam-papers/${examPaperId}/upload-attachment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            setExamPaperData(prev => ({
              ...prev,
              productFile: result.filePath,
            }));
          }
        }
      }

      // 임시 내용 이미지들 업로드 및 마크다운 경로 업데이트
      const tempImages = contentImages.filter(img => img.path.startsWith('temp/'));
      let updatedContent = examPaperData.content;
      
      for (const tempImage of tempImages) {
        // 저장된 임시 파일 객체 사용
        const file = tempImageFiles[tempImage.path];
        if (file) {
          try {
            const formData = new FormData();
            formData.append('image', file);
            
            const uploadResponse = await fetch(`/api/nimda/stores/exam-papers/${examPaperId}/upload-image`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData,
            });
            
            if (uploadResponse.ok) {
              const result = await uploadResponse.json();
              // 마크다운 내용에서 임시 경로를 실제 경로로 교체
              updatedContent = updatedContent.replace(new RegExp(tempImage.path, 'g'), result.imagePath);
              
              // contentImages 배열에서도 경로 업데이트
              setContentImages(prev => prev.map(img => 
                img.path === tempImage.path 
                  ? { ...img, path: result.imagePath }
                  : img
              ));
            }
          } catch (error) {
            console.error('임시 이미지 업로드 실패:', error);
          }
        }
      }
      
      // 업데이트된 마크다운 내용 저장
      if (updatedContent !== examPaperData.content) {
        setExamPaperData(prev => ({ ...prev, content: updatedContent }));
      }

      // 업로드 완료 후 임시 파일들 정리
      setThumbnailFile(null);
      setAttachmentFiles({});
      setTempImageFiles({});
      
    } catch (error) {
      console.error('파일 업로드 오류:', error);
    }
  };

  // 마크다운 에디터에서 이미지 업로드 처리
  const handleImageUpload = async (file: File): Promise<string> => {
    // 새로운 작성 시에는 임시 경로 반환
    if (!isEditMode || !editId) {
      // 임시 이미지를 content images에 추가
      const imageUrl = URL.createObjectURL(file);
      const tempPath = `temp/${file.name}`;
      setContentImages(prev => [...prev, { url: imageUrl, path: tempPath }]);
      setTempImageFiles(prev => ({ ...prev, [tempPath]: file }));
      return tempPath;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/stores/exam-papers/${editId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.imagePath;
      } else {
        throw new Error('이미지 업로드 실패');
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  };

  const validateForm = (): string | null => {
    if (!examPaperData.title.trim()) {
      return '제목을 입력해주세요.';
    }
    
    if (examPaperData.price < 0) {
      return '가격은 0원 이상이어야 합니다.';
    }
    
    if (examPaperData.saleRate < 0 || examPaperData.saleRate > 100) {
      return '할인율은 0% ~ 100% 사이여야 합니다.';
    }
    
    // 할인율이 설정된 경우 날짜 검증
    if (examPaperData.saleRate > 0) {
      if (!examPaperData.saleStartDate) {
        return '할인 시작일을 선택해주세요.';
      }
      
      if (!examPaperData.saleEndDate) {
        return '할인 종료일을 선택해주세요.';
      }
      
      const startDate = new Date(examPaperData.saleStartDate);
      const endDate = new Date(examPaperData.saleEndDate);
      
      if (endDate <= startDate) {
        return '할인 종료일은 시작일보다 나중이어야 합니다.';
      }
    }
    
    if (!examPaperData.content.trim()) {
      return '내용을 입력해주세요.';
    }
    
    return null;
  };

  const handleSave = async () => {
    // 폼 검증
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setSaveStatus('saving');

    try {
      const token = localStorage.getItem('adminToken');
      const url = isEditMode 
        ? `/api/nimda/stores/exam-papers/${editId}`
        : '/api/nimda/stores/exam-papers';
      
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: examPaperData.type.trim(),
          title: examPaperData.title.trim(),
          subtitle: examPaperData.subtitle?.trim() || null,
          category: examPaperData.category,
          content: examPaperData.content.trim(),
          price: examPaperData.price,
          saleRate: examPaperData.saleRate,
          saleStartDate: examPaperData.saleStartDate || null,
          saleEndDate: examPaperData.saleEndDate || null,
          thumbnailImage: examPaperData.thumbnailImage || null,
          productFile: examPaperData.productFile || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSaveStatus('saved');
        
        if (!isEditMode) {
          // 새로 생성된 경우 대기 중인 파일들 업로드
          await uploadPendingFiles(result.id);
        }
        
        // 저장 완료 후 항상 목록 페이지로 이동
        router.push('/nimda/dashboard/stores/exam-papers');
      } else {
        const errorData = await response.json();
        setSaveStatus('error');
        throw new Error(errorData.message || '저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setSaveStatus('error');
    } finally {
      setIsSubmitting(false);
      
      // 저장 상태를 3초 후에 초기화
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="sr-only">{isEditMode ? '문제지 수정' : '새 문제지 작성'}</h1>
          </div>

          <div className="space-y-8">
            {/* 기본 정보 */}
            <div className="bg-card rounded-lg shadow-sm border border-default p-6">
              <h2 className="text-xl font-semibold text-title mb-4">기본 정보</h2>
              
              <div className="space-y-6">
                {/* 타입 */}
                <div className="relative type-dropdown-container">
                  <label className="block text-sm font-medium text-body mb-2">
                    타입 *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={examPaperData.type}
                      onChange={(e) => {
                        setExamPaperData(prev => ({ ...prev, type: e.target.value }));
                        setCustomTypeInput(e.target.value);
                      }}
                      onFocus={() => setTypeDropdownOpen(true)}
                      className="w-full px-3 py-2 pr-10 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="타입을 입력하거나 선택하세요"
                    />
                    <button
                      type="button"
                      onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                      className="absolute inset-y-0 right-0 flex items-center px-2 text-muted hover:text-body"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* 드롭다운 목록 */}
                    {typeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-default rounded-md shadow-lg max-h-60 overflow-auto">
                        {types.length > 0 ? (
                          types.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setExamPaperData(prev => ({ ...prev, type }));
                                setCustomTypeInput(type);
                                setTypeDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-hover focus:bg-hover focus:outline-none"
                            >
                              {type}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-muted text-sm">
                            등록된 타입이 없습니다
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 제목 & 부제목 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      제목 *
                    </label>
                    <input
                      type="text"
                      value={examPaperData.title}
                      onChange={(e) => setExamPaperData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      부제목
                    </label>
                    <input
                      type="text"
                      value={examPaperData.subtitle}
                      onChange={(e) => setExamPaperData(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 가격 및 할인 정보 */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-2">
                        가격 (원) *
                      </label>
                      <input
                        type="number"
                        value={examPaperData.price}
                        onChange={(e) => setExamPaperData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-body mb-2">
                        할인율 (%)
                      </label>
                      <input
                        type="number"
                        value={examPaperData.saleRate}
                        onChange={(e) => setExamPaperData(prev => ({ ...prev, saleRate: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-body mb-2">
                        할인 시작일
                      </label>
                      <input
                        type="date"
                        value={examPaperData.saleStartDate}
                        onChange={(e) => setExamPaperData(prev => ({ ...prev, saleStartDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={!examPaperData.saleRate || examPaperData.saleRate === 0}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-body mb-2">
                        할인 종료일
                      </label>
                      <input
                        type="date"
                        value={examPaperData.saleEndDate}
                        onChange={(e) => setExamPaperData(prev => ({ ...prev, saleEndDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={!examPaperData.saleRate || examPaperData.saleRate === 0}
                        min={examPaperData.saleStartDate}
                      />
                    </div>
                  </div>

                  {/* 할인 가격 표시 */}
                  {examPaperData.saleRate > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <div>
                        <p className="text-sm text-gray-600">할인 적용 가격</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-blue-600">
                            {Math.round(examPaperData.price * (1 - examPaperData.saleRate / 100)).toLocaleString()}원
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {examPaperData.price.toLocaleString()}원
                          </span>
                          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            {examPaperData.saleRate}% 할인
                          </span>
                        </div>
                      </div>
                      
                      {examPaperData.saleStartDate && examPaperData.saleEndDate && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-sm text-gray-600">
                            할인 기간: {new Date(examPaperData.saleStartDate).toLocaleDateString('ko-KR')} ~ {new Date(examPaperData.saleEndDate).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 썸네일 이미지 & 첨부파일 */}
            <div className="bg-card rounded-lg shadow-sm border border-default p-6">
              <h2 className="text-xl font-semibold text-title mb-4">파일 업로드</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 썸네일 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-body mb-2">
                    썸네일 이미지
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleThumbnailUpload(file);
                    }}
                    className="block w-full text-sm text-body file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  
                  {thumbnailPreview && (
                    <div className="mt-4">
                      <img
                        src={thumbnailPreview}
                        alt="썸네일 미리보기"
                        className="w-32 h-32 object-cover rounded-md border"
                      />
                    </div>
                  )}
                </div>

                {/* 첨부파일 */}
                <div>
                  <label className="block text-sm font-medium text-body mb-2">
                    첨부파일 (ZIP)
                  </label>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAttachmentUpload(file, 'zipFile');
                    }}
                    className="block w-full text-sm text-body file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {examPaperData.productFile && (
                    <div className="mt-2 text-sm text-body">
                      업로드된 파일: {examPaperData.productFile}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="bg-card rounded-lg shadow-sm border border-default p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-title">내용</h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPreview(!showPreview);
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {showPreview ? '편집 모드' : '미리보기'}
                </button>
              </div>

              {/* 설명 문구 */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  💡 <strong>물품 설명을 적어주세요.</strong> 고객이 쉽게 이해할 수 있도록 상세한 설명을 작성해주시면 됩니다.
                </p>
              </div>

              {showPreview ? (
                <div className="border border-input rounded-md p-4 min-h-[400px] bg-page">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={createMarkdownComponents()}
                  >
                    {examPaperData.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div data-color-mode="light">
                  <MDEditor
                    value={examPaperData.content}
                    onChange={(value) => setExamPaperData(prev => ({ ...prev, content: value || '' }))}
                    preview="edit"
                    hideToolbar={false}
                    height={500}
                    data-color-mode="light"
                    onDrop={async (event) => {
                      event.preventDefault();
                      const files = Array.from(event.dataTransfer?.files || []);
                      const imageFiles = files.filter(file => file.type.startsWith('image/'));
                      
                      if (imageFiles.length > 0 && isEditMode && editId) {
                        for (const file of imageFiles) {
                          try {
                            const imagePath = await handleImageUpload(file);
                            const imageMarkdown = `![${file.name}](/${imagePath})`;
                            setExamPaperData(prev => ({
                              ...prev,
                              content: prev.content + '\n' + imageMarkdown + '\n'
                            }));
                          } catch (error) {
                            alert('이미지 업로드 실패: ' + error.message);
                          }
                        }
                      } else if (imageFiles.length > 0) {
                        alert('문제지를 먼저 저장한 후 이미지를 업로드해주세요.');
                      }
                    }}
                    onPaste={async (event) => {
                      const items = Array.from(event.clipboardData?.items || []);
                      const imageItems = items.filter(item => item.type.startsWith('image/'));
                      
                      if (imageItems.length > 0 && isEditMode && editId) {
                        event.preventDefault();
                        for (const item of imageItems) {
                          const file = item.getAsFile();
                          if (file) {
                            try {
                              const imagePath = await handleImageUpload(file);
                              const imageMarkdown = `![이미지](/${imagePath})`;
                              setExamPaperData(prev => ({
                                ...prev,
                                content: prev.content + '\n' + imageMarkdown + '\n'
                              }));
                            } catch (error) {
                              alert('이미지 업로드 실패: ' + error.message);
                            }
                          }
                        }
                      } else if (imageItems.length > 0) {
                        event.preventDefault();
                        alert('문제지를 먼저 저장한 후 이미지를 업로드해주세요.');
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* 저장 상태 및 버튼 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <div className="flex items-center text-sm text-muted">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                    저장 중...
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    저장됨
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center text-sm text-red-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    저장 실패
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/nimda/dashboard/stores/exam-papers')}
                  className="px-6 py-2 border border-input rounded-md text-body hover:bg-hover transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '저장 중...' : (isEditMode ? '수정' : '저장')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageViewerOpen(false);
              }}
              className="absolute top-4 right-4 bg-black bg-opacity-50 dark:bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-opacity-70 dark:hover:bg-opacity-90"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminExamPaperWritePage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    }>
      <AdminExamPaperWritePageContent />
    </Suspense>
  );
}