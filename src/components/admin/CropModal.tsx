'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Scissors, Edit, Check } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioCounseling: {
    id: string;
    audioUrl: string;
    originalDuration: number;
    title?: string; // 타이틀 추가
    clips?: any[]; // 클립 정보 추가
  };
  studentId: string;
  onCropSuccess: (croppedUrl: string) => void;
}

export default function CropModal({ 
  isOpen, 
  onClose, 
  audioCounseling,
  studentId, 
  onCropSuccess 
}: CropModalProps) {
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 편집 상태 (AudioUploadModal과 동일한 상태 관리)
  const [editMode, setEditMode] = useState<'none' | 'clip'>('none');
  const [clips, setClips] = useState<Array<{id: string, start: number, end: number, name: string, createdAt: string}>>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editingClipName, setEditingClipName] = useState<string>('');
  const [isDragUpdate, setIsDragUpdate] = useState<boolean>(false);
  
  // setTimeout 충돌 방지를 위한 타이머 상태
  const [clipAddTimeout, setClipAddTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // 타이틀 편집 관련 상태
  const [counselingTitle, setCounselingTitle] = useState<string>('');
  const [originalTitle, setOriginalTitle] = useState<string>('');

  // 모달이 열릴 때 기존 데이터 로드
  useEffect(() => {
    if (isOpen) {
      // 타이틀 로드
      const title = audioCounseling.title || '';
      setCounselingTitle(title);
      setOriginalTitle(title);
      
      // 클립 데이터 로드
      if (audioCounseling.clips) {
        const formattedClips = audioCounseling.clips.map((clip, index) => ({
          id: clip.id || `clip_${Date.now()}_${index}`,
          start: clip.startTime ?? clip.start ?? 0,
          end: clip.endTime ?? clip.end ?? 0,
          name: clip.name || `클립 ${index + 1}`,
          createdAt: clip.createdAt || new Date().toISOString()
        }));
        setClips(formattedClips);
      } else {
        setClips([]);
      }
    }
  }, [isOpen, audioCounseling.clips, audioCounseling.title]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      // 타이머가 있다면 정리
      if (clipAddTimeout) {
        clearTimeout(clipAddTimeout);
        setClipAddTimeout(null);
      }
      
      setRangeStart(null);
      setRangeEnd(null);
      setIsProcessing(false);
      setError(null);
      
      // 편집 상태 초기화 (AudioUploadModal과 동일)
      setEditMode('none');
      setClips([]);
      setSelectedClipId(null);
      setEditingClipId(null);
      setEditingClipName('');
      setIsDragUpdate(false);
      
      // 타이틀 상태 초기화
      setCounselingTitle('');
      setOriginalTitle('');
    }
  }, [isOpen, clipAddTimeout]);

  // 시간 포맷 유틸리티 함수 (AudioUploadModal과 동일)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRangeSelect = (start: number, end: number) => {
    setRangeStart(start);
    setRangeEnd(end);
    setError(null);
    
    // 드래그 업데이트로 표시하여 실제 드래그로 인한 변경임을 나타냄
    setIsDragUpdate(true);
    
    console.log('범위 선택:', {
      start,
      end,
      editMode,
      editingClipId,
      selectedClipId
    });
    
    // 클립 편집 중인 경우: 클립 배열을 실시간으로 업데이트하고 자동 추가는 하지 않음
    if (editingClipId) {
      console.log('편집 중인 클립의 범위 업데이트:', {
        clipId: editingClipId,
        newStart: start,
        newEnd: end
      });
      
      // 편집 중인 클립의 범위를 실시간으로 업데이트
      setClips(prev => prev.map(clip => 
        clip.id === editingClipId 
          ? { ...clip, start, end }
          : clip
      ));
      
      console.log('편집 중인 클립 범위 실시간 업데이트 완료:', {
        clipId: editingClipId,
        updatedStart: start,
        updatedEnd: end
      });
      
      return; // 편집 중이면 자동 클립 추가하지 않음
    }
    
    // 클립 모드에서 범위가 완전히 선택되면 자동으로 클립 추가
    if (editMode === 'clip' && start !== null && end !== null && Math.abs(end - start) >= 1) {
      // 기존 타이머가 있다면 취소
      if (clipAddTimeout) {
        clearTimeout(clipAddTimeout);
        setClipAddTimeout(null);
      }
      
      // 새로운 타이머 설정 (100ms 후 자동 클립 추가)
      const timeout = setTimeout(() => {
        handleAddClipWithRange(start, end);
        setClipAddTimeout(null);
      }, 100);
      setClipAddTimeout(timeout);
    }
  };

  // 편집 모드 핸들러 (AudioUploadModal과 동일)
  const handleClipMode = () => {
    const newMode = editMode === 'clip' ? 'none' : 'clip';
    setEditMode(newMode);
    setError(null);
    
    // 모드 변경 시 항상 범위 및 선택된 클립 초기화
    setRangeStart(null);
    setRangeEnd(null);
    setSelectedClipId(null);
  };

  // 파라미터로 받은 범위 값으로 클립 추가 (자동 클립 추가용)
  const handleAddClipWithRange = (start: number, end: number) => {
    // 선택된 클립이 있고 편집 중인 경우 → 기존 ID 재사용 (드래그로 범위 변경)
    if (selectedClipId && editingClipId === selectedClipId) {
      setClips(prev => prev.map(clip => 
        clip.id === selectedClipId 
          ? { ...clip, start, end }
          : clip
      ));
      setRangeStart(start);
      setRangeEnd(end);
      setIsDragUpdate(true);
      console.log('기존 클립 ID 재사용으로 범위 업데이트:', {
        clipId: selectedClipId,
        start,
        end
      });
      return;
    }
    
    // 동일한 시간 범위의 클립이 이미 존재하는지 확인 (오차 0.1초 허용)
    const existingClip = clips.find(clip => 
      Math.abs(clip.start - start) < 0.1 && Math.abs(clip.end - end) < 0.1
    );
    
    if (existingClip) {
      // 이미 동일한 클립이 존재하면 해당 클립을 선택만 함
      setSelectedClipId(existingClip.id);
      setRangeStart(existingClip.start);
      setRangeEnd(existingClip.end);
      setIsDragUpdate(false);
      setEditMode('none');
      console.log('기존 클립 선택:', {
        clipId: existingClip.id,
        start: existingClip.start,
        end: existingClip.end
      });
      return;
    }
    
    // 완전히 새로운 클립 생성
    const newClip = {
      id: `clip_${Date.now()}`,
      start: start,
      end: end,
      name: `클립 ${clips.length + 1}`,
      createdAt: new Date().toISOString()
    };
    
    setClips(prev => [...prev, newClip]);
    
    // 새로 추가된 클립을 자동으로 편집 모드로 전환
    setEditingClipId(newClip.id);
    setEditingClipName(newClip.name);
    
    // 클립 추가 후 선택 상태 설정 (마커 표시를 위해)
    setSelectedClipId(newClip.id);
    setRangeStart(newClip.start);
    setRangeEnd(newClip.end);
    setIsDragUpdate(false); // 편집 모드 진입은 드래그 업데이트 아님
    setEditMode('none'); // clip 모드는 해제
    
    console.log('새 클립 생성:', {
      clipId: newClip.id,
      start: newClip.start,
      end: newClip.end
    });
  };

  const handleAddClip = () => {
    // 수동 추가 시 자동 추가 타이머 취소
    if (clipAddTimeout) {
      clearTimeout(clipAddTimeout);
      setClipAddTimeout(null);
    }
    
    if (rangeStart !== null && rangeEnd !== null) {
      // 수동 추가는 자동 추가와 동일한 로직을 사용하여 중복 방지
      handleAddClipWithRange(rangeStart, rangeEnd);
    }
  };

  const handleRemoveClip = (clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId));
    
    // 삭제된 클립이 선택된 클립이면 선택 해제
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
      setRangeStart(null);
      setRangeEnd(null);
    }
  };

  const handleClipClick = (clip: {id: string, start: number, end: number, name: string}) => {
    // 편집 중인 클립이면 클릭 무시
    if (editingClipId === clip.id) {
      return;
    }
    
    // 이미 선택된 클립을 다시 클릭하면 선택 해제
    if (selectedClipId === clip.id) {
      setSelectedClipId(null);
      setRangeStart(null);
      setRangeEnd(null);
      setIsDragUpdate(false);
      return;
    }
    
    // 새로운 클립 선택
    setSelectedClipId(clip.id);
    setRangeStart(clip.start);
    setRangeEnd(clip.end);
    setIsDragUpdate(false); // 클릭으로 인한 변경이므로 드래그 업데이트 아님
    
    // 편집 모드는 해제 (범위만 표시)
    setEditMode('none');
  };

  const handleEditClipName = (clip: {id: string, start: number, end: number, name: string}) => {
    setEditingClipId(clip.id);
    setEditingClipName(clip.name);
    
    // 편집 시작 시 현재 클립의 구간을 설정하여 마커를 표시
    setSelectedClipId(clip.id); // 클립을 선택 상태로 만들어 마커 표시
    setRangeStart(clip.start);
    setRangeEnd(clip.end);
    setIsDragUpdate(false); // 편집 모드 진입은 드래그 업데이트 아님
    
    console.log('클립 편집 모드 시작:', {
      clipId: clip.id,
      name: clip.name,
      start: clip.start,
      end: clip.end
    });
  };

  const handleSaveClipName = () => {
    if (!editingClipId || !editingClipName.trim()) return;
    
    // 현재 범위가 설정되어 있으면 무조건 업데이트 (드래그 여부와 관계없이)
    const shouldUpdateRange = rangeStart !== null && rangeEnd !== null;
    
    setClips(prev => prev.map(clip => 
      clip.id === editingClipId 
        ? { 
            ...clip, 
            name: editingClipName.trim(),
            // 범위가 설정되어 있으면 업데이트 (드래그든 수동이든 상관없이)
            ...(shouldUpdateRange ? {
              start: rangeStart!,
              end: rangeEnd!
            } : {})
          }
        : clip
    ));
    
    console.log('클립 편집 저장:', {
      clipId: editingClipId,
      name: editingClipName.trim(),
      shouldUpdateRange,
      start: rangeStart,
      end: rangeEnd,
      isDragUpdate
    });
    
    setEditingClipId(null);
    setEditingClipName('');
    setIsDragUpdate(false);
  };

  const handleCancelEditClipName = () => {
    const cancelingClipId = editingClipId;
    
    setEditingClipId(null);
    setEditingClipName('');
    setIsDragUpdate(false);
    
    // 편집 취소 시 선택된 클립이 있다면 해당 클립의 원래 구간으로 복원
    if (selectedClipId) {
      const selectedClip = clips.find(clip => clip.id === selectedClipId);
      if (selectedClip) {
        setRangeStart(selectedClip.start);
        setRangeEnd(selectedClip.end);
        
        console.log('클립 편집 취소 - 원래 범위로 복원:', {
          clipId: selectedClipId,
          originalStart: selectedClip.start,
          originalEnd: selectedClip.end
        });
      }
    } else {
      // 선택된 클립이 없다면 범위 초기화
      setRangeStart(null);
      setRangeEnd(null);
      
      console.log('클립 편집 취소 - 범위 초기화');
    }
    
    console.log('클립 편집 모드 종료:', {
      canceledClipId: cancelingClipId
    });
  };

  const handleCrop = async () => {
    // 편집 중인 클립이 있다면 먼저 저장
    if (editingClipId && editingClipName.trim()) {
      handleSaveClipName();
      
      // handleSaveClipName 완료 후 상태가 업데이트될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 0));
    } else if (editingClipId) {
      // 편집 중이지만 빈 이름인 경우 취소
      handleCancelEditClipName();
    }

    const titleChanged = counselingTitle.trim() !== originalTitle;
    const hasClips = clips.length > 0;
    
    // 타이틀 변경이나 클립 변경 중 하나는 있어야 함 (범위 선택 제거)
    if (!titleChanged && !hasClips) {
      setError('타이틀을 변경하거나 클립을 추가해주세요.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      
      // 타이틀 업데이트가 필요한 경우
      if (titleChanged) {
        const titleResponse = await fetch(`/api/nimda/students/${studentId}/audio-counselings/${audioCounseling.id}/title`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: counselingTitle.trim(),
          }),
        });

        if (!titleResponse.ok) {
          const errorData = await titleResponse.json();
          setError(errorData.message || '타이틀 업데이트에 실패했습니다.');
          return;
        }
      }

      // 클립 업데이트가 필요한 경우 (기존 클립과 다른 경우)
      if (clips.length > 0) {
        // 클립 배열에서 ID 및 시간 범위 중복 제거 (혹시 모를 중복 방지)
        const uniqueClips = clips.reduce((acc: Array<{ id: string; start: number; end: number; name: string; createdAt: string }>, clip: { id: string; start: number; end: number; name: string; createdAt: string }) => {
          // ID가 같거나 시간 범위가 동일한 클립이 이미 있는지 확인
          const isDuplicate = acc.find(existing => 
            existing.id === clip.id || 
            (Math.abs(existing.start - clip.start) < 0.1 && Math.abs(existing.end - clip.end) < 0.1)
          );
          
          if (!isDuplicate) {
            acc.push(clip);
          }
          return acc;
        }, []);
        
        console.log('클립 업데이트 전송:', {
          originalCount: clips.length,
          uniqueCount: uniqueClips.length,
          clipIds: uniqueClips.map(c => c.id)
        });
        
        const clipsResponse = await fetch(`/api/nimda/students/${studentId}/audio-counselings/${audioCounseling.id}/clips`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clips: uniqueClips,
          }),
        });

        if (!clipsResponse.ok) {
          const errorData = await clipsResponse.json();
          setError(errorData.message || '클립 업데이트에 실패했습니다.');
          return;
        }

        // 업데이트된 클립 정보를 받아옴 (backend에서 생성된 URL 포함)
        const updatedData = await clipsResponse.json();
        console.log('Updated clips data from backend:', updatedData);
      }

      // 성공으로 처리하고 모달 닫기 (crop API 제거)
      // 타이틀이나 클립 업데이트된 경우 성공으로 간주
      if (titleChanged || clips.length > 0) {
        // onCropSuccess를 호출하여 부모 컴포넌트에서 데이터 새로고침하게 함
        onCropSuccess('');
      }
      onClose();
      
    } catch (error) {
      console.error('Edit operation failed:', error);
      setError('오디오 편집 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* 모달 컨텐츠 - AudioUploadModal과 동일한 스타일 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Scissors className="w-5 h-5 text-indigo-600" />
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900">오디오 편집</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6">
          <div className="space-y-6">
            {/* 상담 타이틀 입력 */}
            <div>
              <input
                type="text"
                value={counselingTitle}
                onChange={(e) => setCounselingTitle(e.target.value)}
                placeholder="상담 제목을 입력하세요"
                className="w-full px-3 py-2 text-lg font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* 음성 플레이어 및 편집 도구 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">오디오</h4>
                  
                  {/* 클립 모드 설명 */}
                  {editMode === 'clip' && (
                    <p className="text-xs text-blue-600">
                      {rangeStart === null 
                        ? "첫 번째 클릭으로 시작점을 설정하세요."
                        : rangeEnd === null 
                        ? "두 번째 클릭으로 끝점을 설정하면 자동으로 클립이 추가됩니다."
                        : "구간이 선택되었습니다. 새로운 구간을 선택하려면 Clip 버튼을 다시 누르세요."
                      }
                    </p>
                  )}
                </div>
                
                {/* 편집 도구 버튼 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleClipMode}
                    className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center space-x-1 ${
                      editMode === 'clip'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Scissors className="w-3 h-3" />
                    <span>Clip</span>
                  </button>
                </div>
              </div>

              {/* 고급 오디오 플레이어 */}
              <AudioPlayer
                audioUrl={audioCounseling.audioUrl}
                cropMode={editMode === 'clip'}
                onRangeSelect={handleRangeSelect}
                externalRangeStart={rangeStart}
                externalRangeEnd={rangeEnd}
                dragDisabled={selectedClipId !== null && editingClipId === null}
                skipSeekOnRangeChange={editingClipId !== null}
                className="mb-4"
              />

              {/* 클립 리스트 */}
              {(clips.length > 0 || (editMode === 'clip' && rangeStart !== null && rangeEnd !== null)) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-900">생성된 클립 ({clips.length}개)</h5>
                    
                    {/* 클립 선택 상태 표시 */}
                    {editMode === 'clip' && rangeStart !== null && rangeEnd !== null && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-green-600 font-medium">
                          ✓ 클립 추가됨: {formatTime(rangeStart)} - {formatTime(rangeEnd)} ({formatTime(rangeEnd - rangeStart)})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {clips.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                    {clips.map((clip) => (
                      <div
                        key={clip.id}
                        className={`flex flex-col p-3 rounded-lg border transition-colors ${
                          selectedClipId === clip.id
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200'
                        } ${editingClipId === clip.id ? '' : 'cursor-pointer hover:bg-gray-50'}`}
                        onClick={() => handleClipClick(clip)}
                      >
                        {/* 클립 헤더 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Scissors className="w-4 h-4 text-blue-600" />
                          </div>
                          {editingClipId !== clip.id && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClipName(clip);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                title="이름 수정"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveClip(clip.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="클립 삭제"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 클립 이름 */}
                        <div className="mb-2">
                          {editingClipId === clip.id ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={editingClipName}
                                onChange={(e) => setEditingClipName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveClipName();
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditClipName();
                                  }
                                }}
                                className="text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveClipName();
                                }}
                                className="p-1 text-green-600 hover:text-green-800 rounded transition-colors"
                                title="저장"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEditClipName();
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                title="취소"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-gray-900 truncate">{clip.name}</div>
                          )}
                        </div>

                        {/* 클립 시간 정보 */}
                        <div className="text-xs text-gray-500">
                          {formatTime(clip.start)} - {formatTime(clip.end)}
                        </div>
                        <div className="text-xs text-gray-400">
                          길이: {formatTime(clip.end - clip.start)}
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* 편집 상태 표시 */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleCrop}
              disabled={
                counselingTitle.trim() === originalTitle && 
                clips.length === 0 || 
                isProcessing
              }
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>편집 중...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>편집 완료</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
