'use client';

import TreeItem from './TreeItem';
import { useCounselingClipsSttStatus } from '@/hooks/useClips';

interface AudioClip {
  id: string;
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
  fileSize: string;
  createdAt: string;
}

interface AudioCounseling {
  id: string;
  title?: string; // 상담 제목
  audioUrl: string;
  originalDuration: number;
  fileSize: string;
  status: string;
  createdAt: string;
  clips?: any[]; // Prisma JSON 배열, AudioClip 형태의 객체들
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

interface CounselingTreeProps {
  counselings: AudioCounseling[];
  selectedItem: SelectedItem | null;
  onSelect: (item: SelectedItem) => void;
  onEdit: (counseling: AudioCounseling) => void;
  onDelete: (counseling: AudioCounseling, event: React.MouseEvent) => void;
  onClipEdit?: (counselingId: string, clipId: string) => void;
  onClipDelete?: (counselingId: string, clipId: string) => void;
  onClipSttProcess?: (counselingId: string, clipId: string) => void;
  onClipSummaryRegenerate?: (counselingId: string, clipId: string) => void;
  sttStatus?: {
    transcriptStatus?: string;
    summaryStatus?: string;
    transcript?: any;
    summary?: string;
    errorMessage?: string;
  };
  processingCounselingId?: string;
  studentId: string; // 클립 STT 상태 조회를 위해 추가
}

export default function CounselingTree({
  counselings,
  selectedItem,
  onSelect,
  onEdit,
  onDelete,
  onClipEdit,
  onClipDelete,
  onClipSttProcess,
  onClipSummaryRegenerate,
  sttStatus,
  processingCounselingId,
  studentId
}: CounselingTreeProps) {
  
  const generateCounselingName = (counseling: AudioCounseling) => {
    const date = new Date(counseling.createdAt).toLocaleDateString('ko-KR');
    return `${date} 상담`;
  };

  if (counselings.length === 0) {
    return (
      <p className="text-sm text-muted italic p-4 text-center">
        상담 기록이 없습니다
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {counselings.map((counseling) => {
        const isProcessing = processingCounselingId === counseling.id && 
          (sttStatus?.transcriptStatus === 'processing' || sttStatus?.summaryStatus === 'processing');
        const hasError = processingCounselingId === counseling.id && 
          (sttStatus?.transcriptStatus === 'failed' || sttStatus?.summaryStatus === 'failed');
        
        return (
          <CounselingTreeItemWithSttStatus
            key={counseling.id}
            counseling={counseling}
            studentId={studentId}
            selectedItem={selectedItem}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onClipEdit={onClipEdit}
            onClipDelete={onClipDelete}
            onClipSttProcess={onClipSttProcess}
            onClipSummaryRegenerate={onClipSummaryRegenerate}
            isProcessing={isProcessing}
            hasError={hasError}
            errorMessage={hasError ? sttStatus?.errorMessage : undefined}
          />
        );
      })}
    </div>
  );
}

// 클립 STT 상태를 가져와서 TreeItem에 전달하는 래퍼 컴포넌트
function CounselingTreeItemWithSttStatus({
  counseling,
  studentId,
  selectedItem,
  onSelect,
  onEdit,
  onDelete,
  onClipEdit,
  onClipDelete,
  onClipSttProcess,
  onClipSummaryRegenerate,
  isProcessing,
  hasError,
  errorMessage
}: {
  counseling: AudioCounseling;
  studentId: string;
  selectedItem: SelectedItem | null;
  onSelect: (item: SelectedItem) => void;
  onEdit: (counseling: AudioCounseling) => void;
  onDelete: (counseling: AudioCounseling, event: React.MouseEvent) => void;
  onClipEdit?: (counselingId: string, clipId: string) => void;
  onClipDelete?: (counselingId: string, clipId: string) => void;
  onClipSttProcess?: (counselingId: string, clipId: string) => void;
  onClipSummaryRegenerate?: (counselingId: string, clipId: string) => void;
  isProcessing: boolean;
  hasError: boolean;
  errorMessage?: string;
}) {
  // 클립 STT 상태 조회
  const { clipsSttStatus } = useCounselingClipsSttStatus(studentId, counseling.id);
  
  const generateCounselingName = (counseling: AudioCounseling) => {
    const date = new Date(counseling.createdAt).toLocaleDateString('ko-KR');
    return `${date} 상담`;
  };

  return (
    <TreeItem
      counselingId={counseling.id}
      name={generateCounselingName(counseling)}
      title={counseling.title}
      url={counseling.audioUrl}
      duration={counseling.originalDuration}
      createdAt={counseling.createdAt}
      clips={counseling.clips || []}
      selectedItem={selectedItem}
      onSelect={onSelect}
      onEdit={() => onEdit(counseling)}
      onDelete={() => {
        // 가짜 이벤트 객체 생성
        const fakeEvent = {
          stopPropagation: () => {},
          preventDefault: () => {}
        } as React.MouseEvent;
        onDelete(counseling, fakeEvent);
      }}
      onClipEdit={onClipEdit ? (clipId) => onClipEdit(counseling.id, clipId) : undefined}
      onClipDelete={onClipDelete ? (clipId) => onClipDelete(counseling.id, clipId) : undefined}
      onClipSttProcess={onClipSttProcess ? (clipId) => onClipSttProcess(counseling.id, clipId) : undefined}
      onClipSummaryRegenerate={onClipSummaryRegenerate ? (clipId) => onClipSummaryRegenerate(counseling.id, clipId) : undefined}
      isProcessing={isProcessing}
      hasError={hasError}
      errorMessage={errorMessage}
      clipsSttStatus={clipsSttStatus?.clips || []}
    />
  );
}