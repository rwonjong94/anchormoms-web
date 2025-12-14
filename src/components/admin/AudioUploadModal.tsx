'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Play, Pause, RotateCcw, Scissors, Edit, Check } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

interface AudioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onUploadSuccess: (counseling: any) => void;
  onUploadAndEdit?: (counseling: any) => void; // 업로드 후 바로 편집 모드로
}

export default function AudioUploadModal({ isOpen, onClose, studentId, onUploadSuccess, onUploadAndEdit }: AudioUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [counselingTitle, setCounselingTitle] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
  // 편집 상태
  const [editMode, setEditMode] = useState<'none' | 'clip'>('none');
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [clips, setClips] = useState<Array<{id: string, start: number, end: number, name: string}>>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editingClipName, setEditingClipName] = useState<string>('');
  const [isDragUpdate, setIsDragUpdate] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 기본 타이틀 생성 함수
  const generateDefaultTitle = () => {
    const today = new Date().toLocaleDateString('ko-KR');
    return `${today} 상담`;
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isUploading) {
        // 편집 모드 중이면 편집 모드만 취소
        if (editMode !== 'none') {
          setEditMode('none');
          setRangeStart(null);
          setRangeEnd(null);
          setEditError(null);
        } else {
          handleClose();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isUploading, editMode]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 음성 파일인지 확인
      if (!file.type.startsWith('audio/')) {
        alert('음성 파일만 업로드할 수 있습니다.');
        return;
      }
      
      setSelectedFile(file);
      
      // 기본 타이틀 설정 (파일 선택 시 최초 1회만)
      if (!counselingTitle) {
        setCounselingTitle(generateDefaultTitle());
      }
      
      // 미리보기를 위한 Blob URL 생성
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  const handleRegister = async () => {
    if (!selectedFile || !counselingTitle.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('title', counselingTitle.trim());
      
      // 클립 정보도 함께 전송
      if (clips.length > 0) {
        formData.append('clips', JSON.stringify(clips));
      }

      const token = localStorage.getItem('adminToken');
      
      // 토큰 디버깅 (임시)
      
      // 토큰 확인
      if (!token) {
        alert('인증 토큰이 없습니다. 다시 로그인해 주세요.');
        setIsUploading(false);
        return;
      }
      
      // XMLHttpRequest를 사용하여 업로드 진행률 추적
      const xhr = new XMLHttpRequest();
      
      // 업로드 진행률 추적
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };

      // 업로드 완료 처리
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            
            // 클립이 있으면 편집 모드로, 없으면 일반 모드로
            if (clips.length > 0 && onUploadAndEdit) {
              onUploadAndEdit(response);
            } else {
              onUploadSuccess(response);
            }
            
            handleClose();
          } catch (parseError) {
            console.error('Response parsing error:', parseError);
            alert('서버 응답을 처리하는 중 오류가 발생했습니다.');
            setIsUploading(false);
          }
        } else if (xhr.status === 401) {
          console.error('Authentication failed - token may be expired');
          alert('인증이 만료되었습니다. 다시 로그인해 주세요.');
          // 토큰 제거하고 로그인 페이지로 이동하는 로직을 추가할 수 있음
          localStorage.removeItem('adminToken');
          setIsUploading(false);
        } else {
          console.error('Upload failed with status:', xhr.status);
          
          // 서버 응답 메시지 확인
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            alert(`업로드에 실패했습니다: ${errorResponse.message || errorResponse.error || `상태 코드: ${xhr.status}`}`);
          } catch {
            alert(`업로드에 실패했습니다. (상태 코드: ${xhr.status})`);
          }
          setIsUploading(false);
        }
      };

      xhr.onerror = () => {
        console.error('Network error during upload');
        alert('네트워크 오류로 업로드에 실패했습니다.');
        setIsUploading(false);
      };

      xhr.open('POST', `/api/nimda/students/${studentId}/audio-counselings/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (error) {
      console.error('Upload failed:', error);
      alert('업로드에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Blob URL 정리
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setSelectedFile(null);
    setCounselingTitle('');
    setAudioUrl(null);
    setIsUploading(false);
    setUploadProgress(0);
    setDuration(0);
    
    // 편집 상태 초기화
    setEditMode('none');
    setRangeStart(null);
    setRangeEnd(null);
    setClips([]);
    setEditError(null);
    setSelectedClipId(null);
    setEditingClipId(null);
    setEditingClipName('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onClose();
  };

  // 시간 포맷 유틸리티 함수
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 편집 모드 핸들러
  const handleClipMode = () => {
    const newMode = editMode === 'clip' ? 'none' : 'clip';
    setEditMode(newMode);
    setEditError(null);
    
    // 모드 변경 시 항상 범위 및 선택된 클립 초기화
    setRangeStart(null);
    setRangeEnd(null);
    setSelectedClipId(null);
  };

  const handleRangeSelect = (start: number, end: number) => {
    setRangeStart(start);
    setRangeEnd(end);
    setEditError(null);
    
    // 드래그 업데이트로 표시하여 실제 드래그로 인한 변경임을 나타냄
    setIsDragUpdate(true);
    
    // 클립 모드에서 범위가 완전히 선택되면 자동으로 클립 추가
    if (editMode === 'clip' && start !== null && end !== null && Math.abs(end - start) >= 1) {
      // 짧은 지연 후 자동 클립 추가 (파라미터로 받은 값 사용)
      setTimeout(() => {
        handleAddClipWithRange(start, end);
      }, 100);
    }
  };

  // 파라미터로 받은 범위 값으로 클립 추가 (자동 클립 추가용)
  const handleAddClipWithRange = (start: number, end: number) => {
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
  };

  const handleAddClip = () => {
    if (rangeStart !== null && rangeEnd !== null) {
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
    setRangeStart(clip.start);
    setRangeEnd(clip.end);
    setIsDragUpdate(false); // 편집 모드 진입은 드래그 업데이트 아님
  };

  const handleSaveClipName = () => {
    if (!editingClipId || !editingClipName.trim()) return;
    
    // 드래그로 변경된 경우에만 범위를 업데이트, 그렇지 않으면 이름만 업데이트
    setClips(prev => prev.map(clip => 
      clip.id === editingClipId 
        ? { 
            ...clip, 
            name: editingClipName.trim(),
            // 드래그 업데이트가 있었던 경우에만 범위 변경
            ...(isDragUpdate && rangeStart !== null && rangeEnd !== null ? {
              start: rangeStart,
              end: rangeEnd
            } : {})
          }
        : clip
    ));
    
    setEditingClipId(null);
    setEditingClipName('');
    setIsDragUpdate(false);
  };

  const handleCancelEditClipName = () => {
    setEditingClipId(null);
    setEditingClipName('');
    
    // 편집 취소 시 선택된 클립이 있다면 해당 클립의 원래 구간으로 복원
    if (selectedClipId) {
      const selectedClip = clips.find(clip => clip.id === selectedClipId);
      if (selectedClip) {
        setRangeStart(selectedClip.start);
        setRangeEnd(selectedClip.end);
      }
    } else {
      // 선택된 클립이 없다면 범위 초기화
      setRangeStart(null);
      setRangeEnd(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">상담 등록</h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6">
          {!selectedFile ? (
            /* 파일 선택 영역 */
            <div className="text-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-lg p-8 cursor-pointer transition-colors"
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">음성 파일을 선택하세요</p>
                <p className="text-sm text-gray-500">MP3, M4A, WAV 등의 음성 파일을 지원합니다</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            /* 상담 등록 폼 */
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
              {audioUrl && (
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
                    audioUrl={audioUrl}
                    cropMode={editMode === 'clip'}
                    onRangeSelect={handleRangeSelect}
                    onTimeUpdate={(time, dur) => {
                      setDuration(dur);
                    }}
                    onLoadedMetadata={(dur) => setDuration(dur)}
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
                  {editError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{editError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 업로드 진행률 */}
              {isUploading && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">업로드 중...</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{uploadProgress.toFixed(1)}% 완료</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          {selectedFile && (
            <button
              onClick={handleRegister}
              disabled={isUploading || !counselingTitle.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? '등록 중...' : '등록'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
