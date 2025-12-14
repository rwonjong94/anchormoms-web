'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onRangeSelect?: (startTime: number, endTime: number) => void;
  cropMode?: boolean;
  externalRangeStart?: number | null;
  externalRangeEnd?: number | null;
  dragDisabled?: boolean;
  skipSeekOnRangeChange?: boolean;
  seekDisabled?: boolean; // 진행바 클릭으로 시간 이동 비활성화
}

export default function AudioPlayer({ 
  audioUrl, 
  className = '', 
  onTimeUpdate,
  onLoadedMetadata,
  onRangeSelect,
  cropMode = false,
  externalRangeStart = null,
  externalRangeEnd = null,
  dragDisabled = false,
  skipSeekOnRangeChange = false,
  seekDisabled = false
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 범위 선택을 위한 상태
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<'start' | 'end' | null>(null);
  
  // 드래그 중 최신 range 값을 추적하기 위한 ref (클로저 문제 해결)
  const currentRangeStartRef = useRef<number | null>(null);
  const currentRangeEndRef = useRef<number | null>(null);

  // 외부에서 전달된 범위 정보 동기화 및 시작점으로 이동
  useEffect(() => {
    if (externalRangeStart !== null && externalRangeEnd !== null) {
      // 드래그 중이 아닐 때만 range 상태 업데이트
      if (!isDragging) {
        setRangeStart(externalRangeStart);
        setRangeEnd(externalRangeEnd);
        // ref도 함께 업데이트
        currentRangeStartRef.current = externalRangeStart;
        currentRangeEndRef.current = externalRangeEnd;
      }
      
      // skipSeekOnRangeChange가 true이거나 드래그 중이면 재생 위치 이동 안함
      if (!skipSeekOnRangeChange && !isDragging && audioRef.current) {
        audioRef.current.currentTime = externalRangeStart;
        setCurrentTime(externalRangeStart);
      }
    } else if (externalRangeStart === null && externalRangeEnd === null) {
      // 외부에서 범위가 해제되면 내부 상태도 초기화 (드래그 중이 아닐 때만)
      if (!isDragging) {
        setRangeStart(null);
        setRangeEnd(null);
        // ref도 함께 초기화
        currentRangeStartRef.current = null;
        currentRangeEndRef.current = null;
      }
    }
  }, [externalRangeStart, externalRangeEnd, skipSeekOnRangeChange, isDragging]);

  // 드래그 이벤트는 handleMarkerMouseUp에서 자동으로 정리됨

  // 시간을 분:초 형식으로 포맷팅
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 재생/일시정지 토글
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('재생 오류:', error);
      setError('오디오 재생에 실패했습니다.');
    }
  };

  // 진행률 바 클릭으로 시간 이동
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || seekDisabled) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 음량 조절
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // 재생 속도 조절
  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };


  // 범위 선택을 위한 진행률 바 클릭 처리
  const handleProgressClickForRange = (e: React.MouseEvent<HTMLDivElement>) => {
    // 드래그 중이거나 드래그 대상이 있으면 클릭 무시 (마커 드래그와 진행률 바 클릭 충돌 방지)
    if (isDragging || dragTargetRef.current || !audioRef.current || !progressRef.current || seekDisabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = (clickX / rect.width) * duration;

    if (cropMode) {
      // 범위가 완전히 설정된 후에는 클릭으로 새로운 범위 생성 방지
      if (rangeStart === null) {
        // 첫 번째 클릭: 시작점 설정
        setRangeStart(clickTime);
        currentRangeStartRef.current = clickTime;
      } else if (rangeEnd === null) {
        // 두 번째 클릭: 끝점 설정하고 범위 완성
        const start = Math.min(rangeStart, clickTime);
        const end = Math.max(rangeStart, clickTime);
        setRangeStart(start);
        setRangeEnd(end);
        currentRangeStartRef.current = start;
        currentRangeEndRef.current = end;
        // onRangeSelect 호출로 자동 클립 추가가 트리거됨
        onRangeSelect?.(start, end);
      }
      // 범위가 완전히 설정된 후(rangeStart !== null && rangeEnd !== null)에는 
      // 클릭으로 새로운 범위를 만들지 않고 드래그로만 조정 가능
    } else {
      // 일반 모드에서는 시간 이동 (드래그 중이 아닐 때만)
      audioRef.current.currentTime = clickTime;
      setCurrentTime(clickTime);
    }
  };


  // 처음으로 되감기
  const handleRewind = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  // 드래그 관련 함수들 - ref로 현재 값 추적
  const dragTargetRef = useRef<'start' | 'end' | null>(null);
  
  const handleMarkerMouseMove = useCallback((e: MouseEvent) => {
    if (!progressRef.current || !duration || !dragTargetRef.current) return;
    
    // 드래그 중이라는 것을 명확히 표시
    e.preventDefault();
    e.stopPropagation();
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = Math.max(0, Math.min((clickX / rect.width) * duration, duration));
    
    // 드래그 중에는 마커 위치만 업데이트하고 다른 side effect 방지
    if (dragTargetRef.current === 'start') {
      setRangeStart(clickTime);
      currentRangeStartRef.current = clickTime; // ref도 함께 업데이트
    } else if (dragTargetRef.current === 'end') {
      setRangeEnd(clickTime);
      currentRangeEndRef.current = clickTime; // ref도 함께 업데이트
    }
    
    // 드래그 중에는 오디오 재생 위치를 변경하지 않음
    // 드래그 중에는 onRangeSelect도 호출하지 않음 (mouseUp에서만 호출)
  }, [duration]);

  const handleMarkerMouseUp = useCallback(() => {
    // 전역 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleMarkerMouseMove);
    document.removeEventListener('mouseup', handleMarkerMouseUp);
    
    // dragTargetRef를 먼저 정리하여 추가 이벤트 처리를 방지
    dragTargetRef.current = null;
    setDragTarget(null);
    
    // 드래그 종료를 지연 처리하여 마지막 mousemove 이벤트와 progress click 충돌 방지
    setTimeout(() => {
      setIsDragging(false);
      
      // 콜백 호출 - ref로 최신 값 사용 (클로저 문제 해결)
      if (currentRangeStartRef.current !== null && currentRangeEndRef.current !== null) {
        const start = Math.min(currentRangeStartRef.current, currentRangeEndRef.current);
        const end = Math.max(currentRangeStartRef.current, currentRangeEndRef.current);
        onRangeSelect?.(start, end);
      }
    }, 50); // 50ms 지연으로 race condition 방지 및 충돌 해결
  }, [onRangeSelect, handleMarkerMouseMove]); // rangeStart, rangeEnd 의존성 제거

  // 드래그 시작
  const handleMarkerMouseDown = useCallback((e: React.MouseEvent, target: 'start' | 'end') => {
    // 드래그가 비활성화된 경우 드래그 시작 방지
    if (dragDisabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragTarget(target);
    dragTargetRef.current = target;
    
    // 전역 마우스 이벤트 리스너 추가
    document.addEventListener('mousemove', handleMarkerMouseMove);
    document.addEventListener('mouseup', handleMarkerMouseUp);
  }, [handleMarkerMouseMove, handleMarkerMouseUp, dragDisabled]);

  // 오디오 이벤트 핸들러들
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      const audioDuration = audio.duration;
      setDuration(audioDuration);
      setIsLoading(false);
      onLoadedMetadata?.(audioDuration);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time, duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handleError = () => {
      setError('오디오 파일을 로드할 수 없습니다.');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setError(null);
    };

    // 이벤트 리스너 등록
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // 음량과 재생 속도 초기 설정
    audio.volume = volume;
    audio.playbackRate = playbackRate;

    return () => {
      // 이벤트 리스너 정리
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl, duration, volume, onTimeUpdate, onLoadedMetadata]);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-600">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* 숨겨진 오디오 엘리먼트 */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* 컨트롤 패널 */}
      <div className="flex items-center space-x-4">
        {/* 재생/일시정지 버튼 */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-full transition-colors"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* 되감기 버튼 */}
        <button
          onClick={handleRewind}
          disabled={isLoading}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-50"
          title="처음으로"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* 진행률 바와 시간 */}
        <div className="flex-1 flex items-center space-x-3">
          {/* 현재 시간 */}
          <span className="text-sm text-gray-600 font-mono min-w-10">
            {formatTime(currentTime)}
          </span>

          {/* 진행률 바 */}
          <div
            ref={progressRef}
            onClick={handleProgressClickForRange}
            className={`flex-1 h-2 bg-gray-200 rounded-full relative ${
              seekDisabled ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            {/* 범위 선택 배경 */}
            {rangeStart !== null && rangeEnd !== null && duration > 0 && (
              <div
                className="absolute h-full bg-green-200 rounded-full"
                style={{
                  left: `${(rangeStart / duration) * 100}%`,
                  width: `${((rangeEnd - rangeStart) / duration) * 100}%`
                }}
              />
            )}
            
            {/* 진행률 바 */}
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-100"
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
              }}
            />
            
            {/* 범위 선택 마커 */}
            {rangeStart !== null && duration > 0 && (
              <div
                className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-10 bg-green-500 rounded-sm shadow-sm ${
                  dragDisabled 
                    ? 'cursor-default' 
                    : 'cursor-grab'
                } ${
                  !dragDisabled && isDragging && dragTarget === 'start' ? 'cursor-grabbing scale-110' : !dragDisabled ? 'hover:scale-105' : ''
                } transition-transform`}
                style={{
                  left: `${(rangeStart / duration) * 100}%`,
                  marginLeft: '-6px'
                }}
                onMouseDown={(e) => handleMarkerMouseDown(e, 'start')}
                title={dragDisabled ? "시작점 (드래그 비활성화)" : "시작점을 드래그하여 조정"}
              />
            )}
            {rangeEnd !== null && duration > 0 && (
              <div
                className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-10 bg-green-500 rounded-sm shadow-sm ${
                  dragDisabled 
                    ? 'cursor-default' 
                    : 'cursor-grab'
                } ${
                  !dragDisabled && isDragging && dragTarget === 'end' ? 'cursor-grabbing scale-110' : !dragDisabled ? 'hover:scale-105' : ''
                } transition-transform`}
                style={{
                  left: `${(rangeEnd / duration) * 100}%`,
                  marginLeft: '-6px'
                }}
                onMouseDown={(e) => handleMarkerMouseDown(e, 'end')}
                title={dragDisabled ? "끝점 (드래그 비활성화)" : "끝점을 드래그하여 조정"}
              />
            )}
            
            {/* 진행률 바 핸들 */}
            {duration > 0 && (
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full shadow-sm transition-all duration-100"
                style={{
                  left: `${(currentTime / duration) * 100}%`,
                  marginLeft: '-8px'
                }}
              />
            )}
          </div>

          {/* 총 시간 */}
          <span className="text-sm text-gray-600 font-mono min-w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* 재생 속도 컨트롤 */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-600">속도</span>
          <select
            value={playbackRate}
            onChange={handlePlaybackRateChange}
            className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>

        {/* 음량 컨트롤 */}
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>


      {/* 로딩 상태 */}
      {isLoading && (
        <div className="mt-3 text-center">
          <span className="text-sm text-gray-500">오디오 로딩 중...</span>
        </div>
      )}

      {/* 커스텀 슬라이더 스타일 */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}