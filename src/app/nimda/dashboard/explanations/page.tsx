'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Student {
  id: string;
  name: string;
  grade: number;
  user: User;
}

interface ExplanationVideo {
  id: string;
  title: string;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
  Student: Student;
}

export default function ExplanationsManagePage() {
  const [explanationVideos, setExplanationVideos] = useState<ExplanationVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentFilter, setParentFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // 필터 조건이 모두 비어있으면 비디오를 보여주지 않음
    if (!parentFilter && !studentFilter) {
      setExplanationVideos([]);
      setLoading(false);
      return;
    }
    
    fetchExplanationVideos();
  }, [parentFilter, studentFilter, startDate, endDate]);

  const fetchExplanationVideos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (parentFilter) params.append('parentName', parentFilter);
      if (studentFilter) params.append('studentName', studentFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/explanations/admin?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setExplanationVideos(data);
      } else {
        console.error('Failed to fetch explanation videos:', response.status);
        setExplanationVideos([]);
      }
    } catch (error) {
      console.error('Failed to fetch explanation videos:', error);
      setExplanationVideos([]);
    } finally {
      setLoading(false);
    }
  }, [parentFilter, studentFilter, startDate, endDate]);

  const extractYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="sr-only">설명 관리</h1>
          </div>

          {/* 필터 섹션 */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-default mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 부모 검색 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  부모 이름 검색
                </label>
                <input
                  type="text"
                  value={parentFilter}
                  onChange={(e) => setParentFilter(e.target.value)}
                  placeholder="부모 이름으로 검색"
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 학생 검색 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  학생 이름 검색
                </label>
                <input
                  type="text"
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  placeholder="학생 이름으로 검색"
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 시작 날짜 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  시작 날짜
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 종료 날짜 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  종료 날짜
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 필터 초기화 버튼 */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setParentFilter('');
                  setStudentFilter('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 text-sm text-body bg-muted rounded-md hover:bg-hover transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>

          {/* 비디오 갤러리 */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : !parentFilter && !studentFilter ? (
            <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-default">
              <svg className="w-24 h-24 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-title mb-2">검색 조건을 입력하세요</h3>
              <p className="text-body">부모 이름 또는 학생 이름을 입력하여 설명 영상을 검색할 수 있습니다.</p>
            </div>
          ) : explanationVideos.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-default">
              <svg className="w-24 h-24 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-title mb-2">검색 결과가 없습니다</h3>
              <p className="text-body">해당 조건에 맞는 설명 영상이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {explanationVideos.map((video) => {
                const videoId = extractYouTubeVideoId(video.videoUrl);
                return (
                  <div key={video.id} className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-default">
                    {/* YouTube 썸네일 */}
                    <div className="aspect-video bg-muted">
                      {videoId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={video.title}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 비디오 정보 */}
                    <div className="p-4">
                      {/* 학생 정보 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            {video.Student.name} ({video.Student.grade}학년)
                          </span>
                          <span className="text-xs text-muted">
                            부모: {video.Student.user.name}
                          </span>
                        </div>
                      </div>

                      {/* 제목 */}
                      <h3 className="font-bold text-title mb-2 line-clamp-2">{video.title}</h3>

                      {/* 게시 날짜 */}
                      <p className="text-sm text-body mb-4">
                        게시일: {formatDate(video.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}