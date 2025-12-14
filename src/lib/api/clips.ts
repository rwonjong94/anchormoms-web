// 클립 관련 API 함수들
// Backend의 독립 클립 STT 시스템과 연동

export interface AudioClip {
  id: string;
  counselingId: string;
  clipId: string;
  name?: string;
  startTime: number;
  endTime: number;
  duration: number;
  audioUrl?: string;
  transcriptStatus?: string;
  transcript?: any;
  summaryStatus?: string;
  summary?: string;
  summaryTemplate?: string;
  summaryModel?: string;
  sttStartedAt?: string;
  sttCompletedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClipRequest {
  clipId: string;
  name?: string;
  startTime: number;
  endTime: number;
  duration: number;
  audioUrl?: string;
}

export interface UpdateClipRequest {
  name?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  audioUrl?: string;
}

export interface ClipSttRequest {
  templateName?: string;
  customTemplateContent?: string;
  summaryModel?: string;
  customPrompt?: string;
}

export interface ClipSttStatus {
  clipId: string;
  transcriptStatus: string;
  summaryStatus: string;
  transcript?: any;
  summary?: string;
  summaryModel?: string;
  summaryTemplate?: string;
  errorMessage?: string;
}

export interface CounselingClipsSttStatus {
  counselingId: string;
  totalClips: number;
  transcriptCompleted: number;
  summaryCompleted: number;
  processing: number;
  failed: number;
  clips: Array<{
    clipId: string;
    name?: string;
    transcriptStatus: string;
    summaryStatus: string;
    errorMessage?: string;
  }>;
}

// ============ 클립 CRUD API ============

/**
 * 상담의 모든 클립 목록 조회
 */
export async function getCounselingClips(
  studentId: string,
  counselingId: string
): Promise<AudioClip[]> {
  const response = await fetch(
    `/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`클립 목록 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 특정 클립 상세 조회
 */
export async function getCounselingClip(
  studentId: string,
  counselingId: string,
  clipId: string
): Promise<AudioClip> {
  const response = await fetch(
    `/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`클립 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 새 클립 생성
 */
export async function createCounselingClip(
  studentId: string,
  counselingId: string,
  clipData: CreateClipRequest
): Promise<AudioClip> {
  const response = await fetch(
    `/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clipData),
    }
  );

  if (!response.ok) {
    throw new Error(`클립 생성 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 클립 정보 수정
 */
export async function updateCounselingClip(
  studentId: string,
  counselingId: string,
  clipId: string,
  clipData: UpdateClipRequest
): Promise<AudioClip> {
  const response = await fetch(
    `/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clipData),
    }
  );

  if (!response.ok) {
    throw new Error(`클립 수정 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 클립 삭제
 */
export async function deleteCounselingClip(
  studentId: string,
  counselingId: string,
  clipId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`클립 삭제 실패: ${response.statusText}`);
  }

  return response.json();
}

// ============ 클립 STT API ============

/**
 * 클립 STT 처리 (transcript + summary 생성)
 */
export async function processClipStt(
  studentId: string,
  counselingId: string,
  clipId: string,
  sttRequest?: ClipSttRequest
): Promise<ClipSttStatus> {
  const response = await fetch(
    `/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}/stt/process`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sttRequest || {}),
    }
  );

  if (!response.ok) {
    throw new Error(`클립 STT 처리 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 클립 STT 상태 조회
 */
export async function getClipSttStatus(
  studentId: string,
  counselingId: string,
  clipId: string
): Promise<ClipSttStatus> {
  const response = await fetch(
    `/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}/stt/status`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`클립 STT 상태 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 클립 요약 재생성
 */
export async function regenerateClipSummary(
  studentId: string,
  counselingId: string,
  clipId: string,
  options?: {
    templateName?: string;
    customPrompt?: string;
    summaryModel?: string;
  }
): Promise<{
  clipId: string;
  summary: string;
  summaryTemplate: string;
  summaryModel: string;
}> {
  const response = await fetch(
    `/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/${clipId}/stt/regenerate-summary`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options || {}),
    }
  );

  if (!response.ok) {
    throw new Error(`클립 요약 재생성 실패: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 상담의 모든 클립 STT 상태 조회 (요약 정보)
 */
export async function getCounselingClipsSttStatus(
  studentId: string,
  counselingId: string
): Promise<CounselingClipsSttStatus> {
  const response = await fetch(
    `/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/stt/status`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`상담 클립 STT 상태 조회 실패: ${response.statusText}`);
  }

  return response.json();
}

// ============ 유틸리티 함수 ============

/**
 * STT 상태를 한글로 변환
 */
export function getSttStatusText(status?: string): string {
  switch (status) {
    case 'pending':
      return '대기중';
    case 'processing':
      return '처리중';
    case 'completed':
      return '완료';
    case 'failed':
      return '실패';
    default:
      return '알 수 없음';
  }
}

/**
 * STT 상태에 따른 색상 클래스 반환
 */
export function getSttStatusColor(status?: string): string {
  switch (status) {
    case 'pending':
      return 'text-gray-500';
    case 'processing':
      return 'text-blue-600';
    case 'completed':
      return 'text-green-600';
    case 'failed':
      return 'text-red-600';
    default:
      return 'text-gray-400';
  }
}

/**
 * 클립 이름 생성 (없는 경우 기본값)
 */
export function getClipDisplayName(clip: AudioClip): string {
  if (clip.name) {
    return clip.name;
  }
  
  const startMin = Math.floor(clip.startTime / 60);
  const startSec = Math.floor(clip.startTime % 60);
  const endMin = Math.floor(clip.endTime / 60);
  const endSec = Math.floor(clip.endTime % 60);
  
  return `클립 ${startMin}:${startSec.toString().padStart(2, '0')}-${endMin}:${endSec.toString().padStart(2, '0')}`;
}

// ==================== 클립 마이그레이션 API ====================

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedCount: number;
  errorCount?: number;
  errors?: Array<{
    clip: any;
    error: string;
  }>;
  skipped: boolean;
}

export interface BatchMigrationResult {
  totalCounselings: number;
  processedCount: number;
  skippedCount: number;
  totalMigratedClips: number;
  totalErrors: number;
  results: Array<MigrationResult & {
    counselingId: string;
    studentId: string;
  }>;
}

// ==================== 배치 처리 인터페이스 ====================

export interface BatchProcessingOptions {
  maxConcurrent?: number; // 동시 처리 클립 수
  enableAudioExtraction?: boolean; // 오디오 파일 추출 여부
  enableSttProcessing?: boolean; // STT 처리 여부
  batchSize?: number; // 한 번에 처리할 클립 수
  timeoutPerClip?: number; // 클립당 최대 처리 시간 (ms)
}

export interface BatchProcessingResult {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    clipId: string;
    error: string;
  }>;
  duration: number; // 전체 처리 시간 (ms)
}

export interface AllClipsBatchResult {
  totalCounselings: number;
  results: Array<BatchProcessingResult & { counselingId: string }>;
}

/**
 * 단일 상담의 클립을 마이그레이션
 */
export async function migrateClipsToDatabase(
  studentId: string, 
  counselingId: string, 
  force: boolean = false
): Promise<MigrationResult> {
  const response = await fetch(`/api/nimda/students/${studentId}/audio-counselings/${counselingId}/migrate-clips`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ force }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to migrate clips');
  }

  return response.json();
}

/**
 * 모든 상담의 클립을 일괄 마이그레이션
 */
export async function migrateAllClipsToDatabase(
  force: boolean = false,
  studentId?: string
): Promise<BatchMigrationResult> {
  // studentId가 제공된 경우 해당 학생의 상담만 마이그레이션
  const url = studentId 
    ? `/api/nimda/students/${studentId}/audio-counselings/migrate-all-clips`
    : '/api/nimda/audio-counselings/migrate-all-clips';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      force,
      studentId 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to migrate all clips');
  }

  return response.json();
}

// ==================== 배치 처리 API ====================

/**
 * 단일 상담의 모든 클립 배치 처리 (마이그레이션 + 오디오 추출 + STT)
 */
export async function batchProcessCounselingClips(
  studentId: string,
  counselingId: string,
  options: BatchProcessingOptions = {}
): Promise<BatchProcessingResult> {
  const response = await fetch(`/api/nimda/students/${studentId}/audio-counselings/${counselingId}/clips/batch-process`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to batch process clips');
  }

  return response.json();
}

/**
 * 모든 상담의 클립을 배치 처리
 */
export async function batchProcessAllClips(
  options: BatchProcessingOptions & { studentId?: string } = {}
): Promise<AllClipsBatchResult> {
  const url = options.studentId 
    ? `/api/nimda/students/${options.studentId}/audio-counselings/batch-process-all`
    : '/api/nimda/audio-counselings/batch-process-all';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to batch process all clips');
  }

  return response.json();
}

/**
 * 고아 클립 파일 정리
 */
export async function cleanupOrphanedClipFiles(studentId?: string): Promise<{
  deletedFiles: number;
  errors: string[];
}> {
  const url = studentId 
    ? `/api/nimda/students/${studentId}/audio-counselings/cleanup-orphaned-clips`
    : '/api/nimda/audio-counselings/cleanup-orphaned-clips';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to cleanup orphaned clip files');
  }

  return response.json();
}

// ==================== 배치 처리 헬퍼 함수 ====================

/**
 * 배치 처리 결과를 요약하여 표시할 텍스트 생성
 */
export function getBatchProcessingSummary(result: BatchProcessingResult): string {
  const { total, succeeded, failed, duration } = result;
  const durationSec = Math.round(duration / 1000);
  
  if (failed === 0) {
    return `✅ 성공: ${succeeded}/${total} 클립 처리 완료 (${durationSec}초)`;
  } else {
    return `⚠️ 부분 성공: ${succeeded}/${total} 성공, ${failed}개 실패 (${durationSec}초)`;
  }
}

/**
 * 배치 처리 옵션의 기본값 반환
 */
export function getDefaultBatchOptions(): BatchProcessingOptions {
  return {
    maxConcurrent: 3,
    enableAudioExtraction: true,
    enableSttProcessing: false,
    batchSize: 10,
    timeoutPerClip: 300000, // 5분
  };
}