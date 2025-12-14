'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Student {
  id: string;
  name: string;
  grade: number;
}

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

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export default function HomeworkVideosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [videos, setVideos] = useState<HomeworkVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<HomeworkVideo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [modalData, setModalData] = useState<VideoModalData>({ title: '', videoUrl: '', studentId: '' });
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchVideos();
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    filterVideos();
  }, [videos, selectedStudentId, startDate, endDate]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/homework-videos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      } else {
        setError('숙제 영상을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch homework videos:', error);
      setError('숙제 영상을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = [...videos];
    
    // Student filter
    if (selectedStudentId) {
      filtered = filtered.filter(video => video.studentId === selectedStudentId);
    }
    
    // Date filter
    if (startDate) {
      filtered = filtered.filter(video => new Date(video.createdAt) >= new Date(startDate));
    }
    
    if (endDate) {
      filtered = filtered.filter(video => new Date(video.createdAt) <= new Date(endDate));
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
      setModalData({
        title: '',
        videoUrl: '',
        studentId: user?.students?.[0]?.id || '',
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

  const handleSaveVideo = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const method = editingVideoId ? 'PUT' : 'POST';
      const url = editingVideoId ? `/api/homework-videos/${editingVideoId}` : '/api/homework-videos';
      
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
      } else {
        console.error('영상 저장 실패:', response.status);
      }
    } catch (error) {
      console.error('Failed to save video:', error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/homework-videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        await fetchVideos();
      } else {
        console.error('영상 삭제 실패:', response.status);
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/settings')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">숙제 영상 업로드</h1>
                <p className="text-sm text-gray-600">학생별 숙제 영상을 관리하고 업로드하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Student Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">학생 선택</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">전체 학생</option>
                  {user?.students?.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.grade}학년)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">기간 필터</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="flex items-center text-gray-500">~</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Add Video Button */}
            <button
              onClick={() => openVideoModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              영상 추가
            </button>
          </div>
        </div>

        {/* Videos Gallery */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">등록된 영상이 없습니다</h3>
            <p className="mt-2 text-gray-600">첫 번째 숙제 영상을 업로드해보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const videoId = getYouTubeVideoId(video.videoUrl);
              return (
                <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Video Thumbnail */}
                  <div className="aspect-video bg-gray-200">
                    {videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={video.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      학생: {video.studentName}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {new Date(video.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex justify-between">
                      <button
                        onClick={() => openVideoModal(video)}
                        className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800"
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

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingVideoId ? '영상 수정' : '영상 추가'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    value={modalData.title}
                    onChange={(e) => setModalData({ ...modalData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="영상 제목을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">학생</label>
                  <select
                    value={modalData.studentId}
                    onChange={(e) => setModalData({ ...modalData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {user?.students?.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.grade}학년)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube 링크</label>
                  <input
                    type="url"
                    value={modalData.videoUrl}
                    onChange={(e) => setModalData({ ...modalData, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeVideoModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveVideo}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}