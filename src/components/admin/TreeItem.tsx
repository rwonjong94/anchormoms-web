'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, FileAudio, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getSttStatusText, getSttStatusColor } from '@/lib/api/clips';

interface AudioClip {
  id: string;
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
  fileSize: string;
  createdAt: string;
}

interface SelectedItem {
  type: 'original' | 'clip';
  counselingId: string;
  clipId?: string;
  name: string;
  url: string;
  duration: number;
  createdAt: string;
}

interface ClipSttStatus {
  clipId: string;
  transcriptStatus: string;
  summaryStatus: string;
  errorMessage?: string;
}

interface TreeItemProps {
  counselingId: string;
  name: string;
  title?: string; // 상담 제목 추가
  url: string;
  duration: number;
  createdAt: string;
  clips?: any[]; // Prisma JSON 배열, AudioClip 형태의 객체들
  selectedItem: SelectedItem | null;
  onSelect: (item: SelectedItem) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClipEdit?: (clipId: string) => void;
  onClipDelete?: (clipId: string) => void;
  onClipSttProcess?: (clipId: string) => void;
  onClipSummaryRegenerate?: (clipId: string) => void;
  isProcessing?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  clipsSttStatus?: ClipSttStatus[]; // 클립별 STT 상태 추가
}

export default function TreeItem({
  counselingId,
  name,
  title,
  url,
  duration,
  createdAt,
  clips = [],
  selectedItem,
  onSelect,
  onEdit,
  onDelete,
  onClipEdit,
  onClipDelete,
  onClipSttProcess,
  onClipSummaryRegenerate,
  isProcessing = false,
  hasError = false,
  errorMessage,
  clipsSttStatus = []
}: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasClips = clips.length > 0;
  const isOriginalSelected = selectedItem?.type === 'original' && selectedItem?.counselingId === counselingId;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}분 ${secs}초`;
  };

  const formatClipTime = (startTime: number, endTime: number) => {
    const formatTimeStamp = (time: number) => {
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return `${formatTimeStamp(startTime)}-${formatTimeStamp(endTime)}`;
  };

  // 클립의 STT 상태 정보 가져오기
  const getClipSttStatus = (clipId: string) => {
    return clipsSttStatus.find(status => status.clipId === clipId);
  };

  // 클립 STT 상태 아이콘 렌더링
  const renderClipSttStatusIcon = (clipId: string) => {
    const clipStatus = getClipSttStatus(clipId);
    if (!clipStatus) return null;

    const { transcriptStatus, summaryStatus } = clipStatus;
    
    // 전사와 요약 중 하나라도 처리중이면 처리중 표시
    if (transcriptStatus === 'processing' || summaryStatus === 'processing') {
      return <Clock className="w-3 h-3 text-blue-600 animate-spin" aria-label="STT 처리중" />;
    }
    
    // 전사와 요약 중 하나라도 실패하면 실패 표시
    if (transcriptStatus === 'failed' || summaryStatus === 'failed') {
      return <XCircle className="w-3 h-3 text-red-600" aria-label={clipStatus.errorMessage || "STT 처리 실패"} />;
    }
    
    // 전사와 요약 모두 완료된 경우
    if (transcriptStatus === 'completed' && summaryStatus === 'completed') {
      return <CheckCircle className="w-3 h-3 text-green-600" aria-label="전사 및 요약 완료" />;
    }
    
    // 전사만 완료된 경우
    if (transcriptStatus === 'completed') {
      return <AlertCircle className="w-3 h-3 text-yellow-600" aria-label="전사 완료, 요약 대기중" />;
    }
    
    // 기본적으로는 대기 상태
    return <AlertCircle className="w-3 h-3 text-gray-400" aria-label="STT 대기중" />;
  };

  const handleOriginalSelect = () => {
    onSelect({
      type: 'original',
      counselingId,
      name: title || name,
      url,
      duration,
      createdAt
    });
  };

  const handleClipSelect = (clip: any) => {
    // 클립 데이터는 startTime/endTime 또는 start/end 필드를 가질 수 있음
    const startTime = clip.startTime ?? clip.start;
    const endTime = clip.endTime ?? clip.end;
    
    console.log('클립 선택:', {
      clipId: clip.id,
      clipUrl: clip.url,
      originalUrl: url,
      hasClipFile: !!clip.url,
      clipName: clip.name
    });
    
    onSelect({
      type: 'clip',
      counselingId,
      clipId: clip.id,
      name: `${title || name} - ${clip.name || `클립 (${formatClipTime(startTime, endTime)})`}`,
      url: clip.url || url, // 클립 파일이 있으면 클립 URL, 없으면 원본 URL 사용
      duration: clip.duration || (endTime - startTime),
      createdAt: createdAt, // 원본 오디오의 createdAt 사용
      // @ts-expect-error: SelectedItem 타입 확장 필드 사용
      clipStartTime: startTime,
      // @ts-expect-error: SelectedItem 타입 확장 필드 사용
      clipEndTime: endTime,
      originalUrl: url // 원본 오디오 URL 저장
    });
  };

  return (
    <div className="select-none">
      {/* 원본 파일 */}
      <div
        onClick={handleOriginalSelect}
        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors group ${
          isOriginalSelected
            ? 'bg-indigo-50 border border-indigo-500'
            : 'hover:bg-gray-50 border border-transparent'
        }`}
      >
        {/* 확장/축소 버튼 */}
        <div className="flex items-center">
          {hasClips && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          
          {/* 폴더 아이콘 */}
          {hasClips ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-600 mr-2" />
            ) : (
              <Folder className="w-4 h-4 text-blue-600 mr-2" />
            )
          ) : (
            <FileAudio className="w-4 h-4 text-green-600 mr-2" />
          )}
        </div>

        {/* 파일 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium text-gray-900 truncate">
              {title || name}
            </div>
            
            {/* 상태 인디케이터 */}
            {isProcessing && (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border border-indigo-600 border-t-transparent"></div>
                <span className="text-xs text-indigo-600">처리 중</span>
              </div>
            )}
            
            {hasError && (
              <div className="relative group">
                <div className="flex items-center text-red-600">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                {errorMessage && (
                  <div className="absolute left-0 top-5 z-10 invisible group-hover:visible bg-red-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                    {errorMessage}
                    <div className="absolute bottom-full left-2 border-4 border-transparent border-b-red-600"></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(createdAt).toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="편집"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 클립들 (확장된 경우만 표시) */}
      {isExpanded && hasClips && (
        <div className="ml-6 mt-1 space-y-1">
          {clips.map((clip) => {
            const isClipSelected = selectedItem?.type === 'clip' && selectedItem?.clipId === clip.id;
            // 클립 데이터는 startTime/endTime 또는 start/end 필드를 가질 수 있음
            const startTime = clip.startTime ?? clip.start;
            const endTime = clip.endTime ?? clip.end;
            
            return (
              <div
                key={clip.id}
                onClick={() => handleClipSelect(clip)}
                className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors group ${
                  isClipSelected
                    ? 'bg-indigo-50 border border-indigo-500'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <FileAudio className="w-4 h-4 text-orange-600 mr-2" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-900 truncate">
                      {clip.name || `클립 (${formatClipTime(startTime, endTime)})`}
                    </div>
                    {/* 클립 STT 상태 아이콘 */}
                    {renderClipSttStatusIcon(clip.id)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatClipTime(startTime, endTime)}
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* 클립 STT 처리 버튼 */}
                  {onClipSttProcess && (() => {
                    const clipStatus = getClipSttStatus(clip.id);
                    const canProcess = !clipStatus || 
                      (clipStatus.transcriptStatus !== 'processing' && clipStatus.summaryStatus !== 'processing');
                    
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClipSttProcess(clip.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          canProcess 
                            ? 'text-gray-400 hover:text-green-500 hover:bg-green-50' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={canProcess ? "STT 처리" : "STT 처리중"}
                        disabled={!canProcess}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </button>
                    );
                  })()}
                  
                  {/* 클립 요약 재생성 버튼 */}
                  {onClipSummaryRegenerate && (() => {
                    const clipStatus = getClipSttStatus(clip.id);
                    const canRegenerate = clipStatus && 
                      clipStatus.transcriptStatus === 'completed' && 
                      clipStatus.summaryStatus !== 'processing';
                    
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClipSummaryRegenerate(clip.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          canRegenerate 
                            ? 'text-gray-400 hover:text-purple-500 hover:bg-purple-50' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={canRegenerate ? "요약 재생성" : "전사 완료 후 사용 가능"}
                        disabled={!canRegenerate}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    );
                  })()}
                  
                  {onClipEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClipEdit(clip.id);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      title="편집"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  {onClipDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClipDelete(clip.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}