'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import LectureModal from '@/components/admin/LectureModal';
import SaveStatusToast from '@/components/SaveStatusToast';

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

export default function LecturesManagePage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [categories, setCategories] = useState<LectureCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);

  // Toast 상태 관리
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // 삭제 확인 팝업 상태
  const [deletePopup, setDeletePopup] = useState<{
    isOpen: boolean;
    lectureId: string;
    lectureTitle: string;
  }>({
    isOpen: false,
    lectureId: '',
    lectureTitle: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchLectures();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lectures/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchLectures = useCallback(async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = selectedCategory 
        ? `${baseUrl}/api/lectures?categoryId=${selectedCategory}`
        : `${baseUrl}/api/lectures`;
      
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLectures(data);
      } else {
        console.error('Failed to fetch lectures, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch lectures:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Toast 헬퍼 함수
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ isVisible: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleCreateLecture = () => {
    setEditingLecture(null);
    setIsModalOpen(true);
  };

  const handleEditLecture = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setIsModalOpen(true);
  };

  // 삭제 확인 팝업 열기
  const handleDeleteClick = (lectureId: string, lectureTitle: string) => {
    setDeletePopup({
      isOpen: true,
      lectureId,
      lectureTitle
    });
  };

  // 강의 삭제 실행
  const handleDeleteLecture = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lectures/${deletePopup.lectureId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        await fetchLectures();
      }
    } catch (error) {
      console.error('Failed to delete lecture:', error);
    } finally {
      setDeletePopup({ isOpen: false, lectureId: '', lectureTitle: '' });
    }
  };

  const handleTogglePublish = async (lectureId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lectures/${lectureId}/toggle-publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        await fetchLectures();
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLecture(null);
    fetchLectures();
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <h1 className="sr-only">강의 관리</h1>
              {/* 왼쪽에 강의 추가 버튼 이동 */}
              <button
                onClick={handleCreateLecture}
                className="bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>강의 추가</span>
              </button>
            </div>
          </div>

          {/* 필터 박스 */}
          <div className="bg-card rounded-lg border border-default p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm text-muted mb-1">카테고리</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">전체 카테고리</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.Lecture?.length || 0})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                {selectedCategory ? (
                  <p className="text-sm text-body">선택된 카테고리: {categories.find(c => c.id === selectedCategory)?.name} / {lectures.length}개</p>
                ) : (
                  <p className="text-sm text-body">전체 강의: {lectures.length}개</p>
                )}
              </div>
            </div>
          </div>

          {/* 강의 갤러리 */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {lectures.map((lecture) => (
                <div key={lecture.id} className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-default">
                  {/* 썸네일 */}
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {lecture.thumbnail ? (
                      <img
                        src={`/${lecture.thumbnail}?v=${new Date(lecture.updatedAt).getTime()}`}
                        alt={lecture.title}
                        className="w-full h-full object-cover"
                        key={`${lecture.id}-${lecture.updatedAt}`}
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

                  {/* 강의 정보 */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                        {lecture.category.name}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleTogglePublish(lecture.id)}
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            lecture.isPublished
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {lecture.isPublished ? '게시됨' : '비공개'}
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-title mb-2 line-clamp-2">{lecture.title}</h3>
                    <p className="text-sm text-body mb-4 line-clamp-3">{lecture.description}</p>

                    {/* 액션 버튼 */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditLecture(lecture)}
                        className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteClick(lecture.id, lecture.title)}
                        className="flex-1 bg-red-600 dark:bg-red-700 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lectures.length === 0 && !loading && (
            <div className="text-center py-12 bg-card rounded-lg border border-default">
              <svg className="w-24 h-24 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-title mb-2">강의가 없습니다</h3>
              <p className="text-body mb-4">첫 번째 강의를 추가해보세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 강의 추가/수정 모달 */}
      {isModalOpen && (
        <LectureModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          lecture={editingLecture}
          categories={categories}
          onCategoriesUpdate={fetchCategories}
        />
      )}

      {/* 삭제 확인 팝업 */}
      {deletePopup.isOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-96 max-w-md mx-4 border border-default">
              <h3 className="text-lg font-semibold text-title mb-4">강의 삭제 확인</h3>
              <p className="text-body mb-6">
                다음 강의를 삭제하시겠습니까?
                <br />
                <span className="font-medium text-title mt-2 block">
                  "{deletePopup.lectureTitle}"
                </span>
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>주의:</strong> 강의와 관련된 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletePopup({ isOpen: false, lectureId: '', lectureTitle: '' })}
                  className="px-4 py-2 text-sm font-medium text-body bg-muted dark:bg-hover border border-input rounded-md hover:bg-hover dark:hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteLecture}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 border border-transparent rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast 메시지 */}
      <SaveStatusToast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </AdminLayout>
  );
}