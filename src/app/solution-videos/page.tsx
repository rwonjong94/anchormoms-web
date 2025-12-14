'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/utils/api';
import SaveStatusToast from '@/components/SaveStatusToast';

interface HomeworkVideo {
  id: string;
  title: string;
  videoUrl: string;
  studentId: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
}

interface VideoModalData {
  title: string;
  videoUrl: string;
  studentId: string;
}

export default function SolutionVideosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, selectedStudent } = useAuth();

  // Homework videos states
  const [videos, setVideos] = useState<HomeworkVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<HomeworkVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  // Video modal states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [modalData, setModalData] = useState<VideoModalData>({ title: '', videoUrl: '', studentId: '' });
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  // Toast states
  const [saveToast, setSaveToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch homework videos
  useEffect(() => {
    if (isAuthenticated) {
      fetchVideos();
    }
  }, [isAuthenticated]);

  // Filter videos when filters change
  useEffect(() => {
    filterVideos();
  }, [videos, selectedStudent]);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Homework videos functions
  const fetchVideos = async () => {
    try {
      setVideosLoading(true);
      setVideosError(null);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getApiUrl()}/api/homework-videos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      } else {
        setVideosError('학생 설명 영상을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch homework videos:', error);
      setVideosError('학생 설명 영상을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setVideosLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = [...videos];
    
    // Student filter - automatically filter by selected student
    if (selectedStudent?.id) {
      filtered = filtered.filter(video => video.studentId === selectedStudent.id);
    }
    
    setFilteredVideos(filtered);
  };

  const openVideoModal = (video?: HomeworkVideo) => {
    if (video) {
      setModalData({
        title: video.title,
        videoUrl: video.videoUrl,
        studentId: video.studentId,
      });
      setEditingVideoId(video.id);
    } else {
      // 새 영상 추가 시: 현재 선택된 학생이 있으면 그 학생을, 없으면 첫 번째 학생을 기본값으로 설정
      const defaultStudentId = selectedStudent?.id || user?.students?.[0]?.id || '';
      setModalData({
        title: '',
        videoUrl: '',
        studentId: defaultStudentId,
      });
      setEditingVideoId(null);
    }
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setModalData({ title: '', videoUrl: '', studentId: '' });
    setEditingVideoId(null);
  };

  // Toast 헬퍼 함수
  const showSaveToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setSaveToast({ isVisible: true, message, type });
  };

  const closeSaveToast = () => {
    setSaveToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleSaveVideo = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const method = editingVideoId ? 'PUT' : 'POST';
      const url = editingVideoId ? `${getApiUrl()}/api/homework-videos/${editingVideoId}` : `${getApiUrl()}/api/homework-videos`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(modalData),
      });
      
      if (response.ok) {
        await fetchVideos();
        closeVideoModal();
        showSaveToast('풀이 설명 영상이 성공적으로 저장되었습니다.', 'success');
      } else {
        showSaveToast('풀이 설명 영상 저장에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Failed to save video:', error);
      showSaveToast('풀이 설명 영상 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('이 풀이 설명 영상을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getApiUrl()}/api/homework-videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        await fetchVideos();
        showSaveToast('풀이 설명 영상이 성공적으로 삭제되었습니다.', 'success');
      } else {
        showSaveToast('풀이 설명 영상 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      showSaveToast('풀이 설명 영상 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-title">학생 설명 영상</h1>
        </div>

        <div>
          {/* 메인 콘텐츠 - 전체 너비 사용 */}
          <div>
            <div className="bg-card rounded-lg shadow-sm border border-default p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-title">학생 설명 영상 목록</h2>
                
                <div className="flex justify-end">
                  {/* Add Video Button */}
                  <button
                    onClick={() => openVideoModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 dark:hover:bg-blue-400"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    설명 영상 추가
                  </button>
                </div>
              </div>
              
              {videosLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : videosError ? (
                <div className="bg-error rounded-lg p-6">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-red-800">{videosError}</p>
                    </div>
                  </div>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-title">등록된 영상이 없습니다</h3>
                  <p className="mt-2 text-muted">첫 번째 학생 설명 영상을 업로드해보세요!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredVideos.map((video) => {
                    const videoId = getYouTubeVideoId(video.videoUrl);
                    return (
                      <div key={video.id} className="video-card bg-gray-50 dark:bg-gray-800 rounded-lg border border-default overflow-hidden">
                        {/* Video Thumbnail */}
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                          {videoId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`}
                              title={video.title}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-title mb-2 line-clamp-2">
                            {video.title}
                          </h3>
                          <p className="text-sm text-body mb-2">
                            학생: {video.studentName}
                          </p>
                          <p className="text-sm text-muted mb-4">
                            {new Date(video.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex justify-between gap-2">
                            <button
                              onClick={() => openVideoModal(video)}
                              className="px-3 py-1 text-sm font-medium text-primary hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700 hover:border-blue-300 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md border border-red-200 dark:border-red-700 hover:border-red-300 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-default w-96 shadow-lg rounded-md bg-card">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-title mb-4">
                {editingVideoId ? '설명 영상 수정' : '설명 영상 추가'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-body mb-1">제목</label>
                  <input
                    type="text"
                    value={modalData.title}
                    onChange={(e) => setModalData({ ...modalData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card text-body"
                    placeholder="설명 영상 제목을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-body mb-1">학생</label>
                  <select
                    value={modalData.studentId}
                    onChange={(e) => setModalData({ ...modalData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card text-body"
                  >
                    {user?.students?.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.grade}학년)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-body mb-1">YouTube 링크</label>
                  <input
                    type="url"
                    value={modalData.videoUrl}
                    onChange={(e) => setModalData({ ...modalData, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card text-body"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeVideoModal}
                  className="px-4 py-2 text-sm font-medium text-body bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveVideo}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Status Toast */}
      <SaveStatusToast
        isVisible={saveToast.isVisible}
        message={saveToast.message}
        type={saveToast.type}
        onClose={closeSaveToast}
      />
    </div>
  );
}
