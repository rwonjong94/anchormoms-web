'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface VideoData {
  questionId: string;
  questionNum: number;
  title: string;
  videoUrl: string | null;
  duration: string;
}

interface ExamVideoData {
  examId: string;
  examTitle: string;
  examType: string;
  examNum: number;
  totalQuestions: number;
  videoCount: number;
  videos: VideoData[];
}

declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoLecturePage() {
  const params = useParams();
  const [examVideoData, setExamVideoData] = useState<ExamVideoData | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // API에서 시험 비디오 데이터 가져오기
  useEffect(() => {
    const fetchExamVideos = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/${params.id}/videos`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error('시험 비디오 정보를 가져오는데 실패했습니다.');
        }

        const data: ExamVideoData = await response.json();
        setExamVideoData(data);
        
        // 첫 번째 비디오를 기본 선택
        if (data.videos.length > 0) {
          setCurrentVideo(data.videos[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchExamVideos();
    }
  }, [params.id]);

  // YouTube API 스크립트 로드
  useEffect(() => {
    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else {
      setIsApiReady(true);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // 플레이어 초기화
  useEffect(() => {
    if (!isApiReady || !currentVideo || !containerRef.current) return;

    // 기존 플레이어 파괴
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    const videoId = extractVideoId(currentVideo.videoUrl);
    if (!videoId) {
      console.error('Invalid YouTube URL:', currentVideo.videoUrl);
      return;
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          console.log('Player is ready');
        },
        onError: (event: any) => {
          console.error('YouTube Player Error:', event.data);
        },
      },
    });
  }, [isApiReady, currentVideo]);

  const extractVideoId = (url: string | null) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleVideoSelect = (video: VideoData) => {
    setCurrentVideo(video);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-page">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-page">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-2">오류가 발생했습니다</div>
          <div className="text-body">{error}</div>
        </div>
      </div>
    );
  }

  if (!examVideoData || examVideoData.videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-page">
        <div className="text-center">
          <div className="text-body text-lg mb-2">비디오 강의가 없습니다</div>
          <div className="text-muted">해당 시험의 동영상 강의를 준비 중입니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 타이틀 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-title">
            {examVideoData.examTitle}
          </h1>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 중앙 비디오 영역 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 동영상 플레이어 */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {currentVideo?.videoUrl ? (
              <div ref={containerRef} className="w-full h-full"></div>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="text-lg mb-2">비디오를 선택해주세요</div>
                  <div className="text-gray-300">오른쪽 목차에서 강의를 선택하세요</div>
                </div>
              </div>
            )}
          </div>

          {/* 현재 비디오 정보 */}
          {currentVideo && (
            <div className="bg-card rounded-lg shadow-sm border border-default p-6">
              <h2 className="text-xl font-semibold text-title mb-2">
                {currentVideo.title}
              </h2>
            </div>
          )}

        </div>

        {/* 오른쪽 비디오 목차 */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm border border-default p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-title mb-4">비디오 목차</h3>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {examVideoData.videos.map((video) => (
                <button
                  key={video.questionId}
                  onClick={() => handleVideoSelect(video)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    currentVideo?.questionId === video.questionId
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-body'
                  }`}
                >
                                  <div className="font-medium text-sm">
                    {video.title}
                  </div>
                </button>
              ))}
            </div>
            
            {examVideoData.videoCount < examVideoData.totalQuestions && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  {examVideoData.totalQuestions - examVideoData.videoCount}개 강의가 추가 예정입니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
} 