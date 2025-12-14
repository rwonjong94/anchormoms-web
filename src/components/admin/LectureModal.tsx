'use client';

import { useState, useEffect } from 'react';

interface LectureCategory {
  id: string;
  name: string;
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

interface LectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture?: Lecture | null;
  categories: LectureCategory[];
  onCategoriesUpdate?: () => void;
}

export default function LectureModal({ isOpen, onClose, lecture, categories, onCategoriesUpdate }: LectureModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    categoryId: '',
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [localCategories, setLocalCategories] = useState<LectureCategory[]>(categories);

  useEffect(() => {
    if (lecture) {
      setFormData({
        title: lecture.title,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        categoryId: lecture.categoryId,
      });
      if (lecture.thumbnail) {
        setThumbnailPreview(`/${lecture.thumbnail}?v=${new Date(lecture.updatedAt).getTime()}`);
      }
    } else {
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        categoryId: categories[0]?.id || '',
      });
      setThumbnailPreview('');
    }
    setThumbnailFile(null);
    setNewCategoryName('');
    setShowNewCategoryInput(false);
    setLocalCategories(categories);
  }, [lecture, categories, isOpen]);

  // ESC 키 처리 (모달 닫기)
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscKey);
      return () => window.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, loading, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return null;

    try {
      const response = await fetch('/api/lectures/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        
        // 로컬 카테고리 리스트에 새 카테고리 추가
        setLocalCategories(prev => [...prev, newCategory]);
        
        // 상위 컴포넌트에게 카테고리 업데이트를 알림
        if (onCategoriesUpdate) {
          onCategoriesUpdate();
        }
        
        return newCategory.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create category:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let categoryId = formData.categoryId;

      // 새 카테고리 생성
      if (showNewCategoryInput && newCategoryName.trim()) {
        const newCategoryId = await createNewCategory();
        if (newCategoryId) {
          categoryId = newCategoryId;
          // 새 카테고리 입력 상태 초기화
          setShowNewCategoryInput(false);
          setNewCategoryName('');
        }
      }

      const lectureData = {
        ...formData,
        categoryId,
      };

      const url = lecture ? `/api/lectures/${lecture.id}` : '/api/lectures';
      const method = lecture ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(lectureData),
      });

      if (response.ok) {
        const savedLecture = await response.json();

        // 썸네일 업로드
        if (thumbnailFile) {
          // 파일명은 항상 'thumbnail.png'로 고정
          const renamedThumbnailFile = new File([thumbnailFile], 'thumbnail.png', { type: thumbnailFile.type });
          
          const formData = new FormData();
          formData.append('thumbnail', renamedThumbnailFile);

          const thumbnailResponse = await fetch(`/api/lectures/${savedLecture.id}/thumbnail`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            },
            body: formData,
          });

          // 썸네일 업로드 성공 시 즉시 프리뷰 업데이트 (캐시 버스팅 적용)
          if (thumbnailResponse.ok) {
            const thumbnailData = await thumbnailResponse.json();
            if (thumbnailData.thumbnail) {
              // 캐시 버스팅을 위해 현재 시간을 파라미터로 추가
              setThumbnailPreview(`/${thumbnailData.thumbnail}?v=${Date.now()}`);
            }
          }
        }

        onClose();
      } else {
        const error = await response.text();
        console.error('강의 저장 실패:', error);
      }
    } catch (error) {
      console.error('Failed to save lecture:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-default">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-title">
            {lecture ? '강의 수정' : '강의 추가'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-body"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 강의 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-body mb-2">
              강의 제목 *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="강의 제목을 입력하세요"
            />
          </div>

          {/* 강의 카테고리 */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-body mb-2">
              강의 카테고리 *
            </label>
            <div className="space-y-2">
              {!showNewCategoryInput ? (
                <div className="flex space-x-2">
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">카테고리 선택</option>
                    {localCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(true)}
                    className="px-3 py-2 text-sm bg-muted text-body rounded-md hover:bg-hover transition-colors"
                  >
                    새 카테고리
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="새 카테고리 이름"
                    className="flex-1 px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName('');
                    }}
                    className="px-3 py-2 text-sm bg-muted text-body rounded-md hover:bg-hover transition-colors"
                  >
                    취소
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 강의 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-body mb-2">
              강의 설명 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="강의에 대한 설명을 입력하세요"
            />
          </div>

          {/* YouTube 링크 */}
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-body mb-2">
              강의 영상 (YouTube 링크) *
            </label>
            <input
              type="url"
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          {/* 썸네일 업로드 */}
          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium text-body mb-2">
              강의 썸네일 이미지
            </label>
            <div className="space-y-4">
              {thumbnailPreview && (
                <div className="aspect-video w-48 bg-muted rounded-lg overflow-hidden border border-default">
                  <img
                    src={thumbnailPreview}
                    alt="썸네일 미리보기"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                id="thumbnail"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-body">
                권장 크기: 16:9 비율 (예: 1280x720px)
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-input text-body rounded-md hover:bg-hover transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              {loading ? '저장 중...' : lecture ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}