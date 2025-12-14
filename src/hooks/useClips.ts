// 클립 관련 SWR 커스텀 훅
import useSWR from 'swr';
import { 
  AudioClip, 
  ClipSttStatus, 
  CounselingClipsSttStatus,
  getCounselingClips,
  getCounselingClip,
  getClipSttStatus,
  getCounselingClipsSttStatus,
  processClipStt,
  regenerateClipSummary,
  createCounselingClip,
  updateCounselingClip,
  deleteCounselingClip,
  CreateClipRequest,
  UpdateClipRequest,
  ClipSttRequest
} from '@/lib/api/clips';

// ============ 클립 CRUD 훅 ============

/**
 * 상담의 모든 클립 목록을 가져오는 훅
 */
export function useCounselingClips(studentId: string, counselingId: string) {
  const { data, error, mutate, isLoading } = useSWR(
    studentId && counselingId ? ['clips', studentId, counselingId] : null,
    () => getCounselingClips(studentId, counselingId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // 5초 내 동일 요청 중복 방지
    }
  );

  return {
    clips: data as AudioClip[] | undefined,
    isLoading,
    isError: error,
    mutate,
    refresh: () => mutate(),
  };
}

/**
 * 특정 클립 정보를 가져오는 훅
 */
export function useCounselingClip(studentId: string, counselingId: string, clipId: string) {
  const { data, error, mutate, isLoading } = useSWR(
    studentId && counselingId && clipId ? ['clip', studentId, counselingId, clipId] : null,
    () => getCounselingClip(studentId, counselingId, clipId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    clip: data as AudioClip | undefined,
    isLoading,
    isError: error,
    mutate,
    refresh: () => mutate(),
  };
}

// ============ 클립 STT 상태 훅 ============

/**
 * 클립 STT 상태를 가져오는 훅
 */
export function useClipSttStatus(studentId: string, counselingId: string, clipId: string) {
  const { data, error, mutate, isLoading } = useSWR(
    studentId && counselingId && clipId ? ['clipSttStatus', studentId, counselingId, clipId] : null,
    () => getClipSttStatus(studentId, counselingId, clipId),
    {
      revalidateOnFocus: false,
      refreshInterval: (data) => {
        // processing 상태일 때만 자동 새로고침 (3초 간격)
        if (data?.transcriptStatus === 'processing' || data?.summaryStatus === 'processing') {
          return 3000;
        }
        return 0;
      },
      dedupingInterval: 2000,
    }
  );

  return {
    sttStatus: data as ClipSttStatus | undefined,
    isLoading,
    isError: error,
    mutate,
    refresh: () => mutate(),
  };
}

/**
 * 상담의 모든 클립 STT 상태 요약을 가져오는 훅
 */
export function useCounselingClipsSttStatus(studentId: string, counselingId: string) {
  const { data, error, mutate, isLoading } = useSWR(
    studentId && counselingId ? ['counselingClipsSttStatus', studentId, counselingId] : null,
    () => getCounselingClipsSttStatus(studentId, counselingId),
    {
      revalidateOnFocus: false,
      refreshInterval: (data) => {
        // 처리중인 클립이 있을 때만 자동 새로고침 (5초 간격)
        if (data && data.processing > 0) {
          return 5000;
        }
        return 0;
      },
      dedupingInterval: 3000,
    }
  );

  return {
    clipsSttStatus: data as CounselingClipsSttStatus | undefined,
    isLoading,
    isError: error,
    mutate,
    refresh: () => mutate(),
  };
}

// ============ 클립 CRUD 액션 훅 ============

/**
 * 클립 생성/수정/삭제 액션을 제공하는 훅
 */
export function useClipActions(studentId: string, counselingId: string) {
  const { mutate: mutateClips } = useCounselingClips(studentId, counselingId);
  const { mutate: mutateClipsSttStatus } = useCounselingClipsSttStatus(studentId, counselingId);

  const createClip = async (clipData: CreateClipRequest): Promise<AudioClip> => {
    try {
      const newClip = await createCounselingClip(studentId, counselingId, clipData);
      
      // 로컬 캐시 업데이트 (optimistic update)
      await mutateClips((currentClips) => {
        return currentClips ? [...currentClips, newClip] : [newClip];
      }, false);
      
      // 서버에서 최신 데이터 가져오기
      await mutateClips();
      await mutateClipsSttStatus();
      
      return newClip;
    } catch (error) {
      console.error('클립 생성 실패:', error);
      throw error;
    }
  };

  const updateClip = async (clipId: string, clipData: UpdateClipRequest): Promise<AudioClip> => {
    try {
      const updatedClip = await updateCounselingClip(studentId, counselingId, clipId, clipData);
      
      // 로컬 캐시 업데이트
      await mutateClips((currentClips) => {
        return currentClips?.map(clip => 
          clip.clipId === clipId ? updatedClip : clip
        );
      }, false);
      
      // 서버에서 최신 데이터 가져오기
      await mutateClips();
      
      return updatedClip;
    } catch (error) {
      console.error('클립 수정 실패:', error);
      throw error;
    }
  };

  const deleteClip = async (clipId: string): Promise<void> => {
    try {
      await deleteCounselingClip(studentId, counselingId, clipId);
      
      // 로컬 캐시에서 제거 (optimistic update)
      await mutateClips((currentClips) => {
        return currentClips?.filter(clip => clip.clipId !== clipId);
      }, false);
      
      // 서버에서 최신 데이터 가져오기
      await mutateClips();
      await mutateClipsSttStatus();
      
    } catch (error) {
      console.error('클립 삭제 실패:', error);
      // 실패 시 캐시 복원
      await mutateClips();
      throw error;
    }
  };

  return {
    createClip,
    updateClip,
    deleteClip,
  };
}

// ============ 클립 STT 액션 훅 ============

/**
 * 클립 STT 처리 액션을 제공하는 훅
 */
export function useClipSttActions(studentId: string, counselingId: string, clipId: string) {
  const { mutate: mutateClipSttStatus } = useClipSttStatus(studentId, counselingId, clipId);
  const { mutate: mutateClipsSttStatus } = useCounselingClipsSttStatus(studentId, counselingId);

  const processClipSttAction = async (sttRequest?: ClipSttRequest): Promise<ClipSttStatus> => {
    try {
      const result = await processClipStt(studentId, counselingId, clipId, sttRequest);
      
      // STT 상태 캐시 업데이트
      await mutateClipSttStatus(result, false);
      await mutateClipsSttStatus(); // 전체 상태도 업데이트
      
      return result;
    } catch (error) {
      console.error('클립 STT 처리 실패:', error);
      // 실패 시 서버에서 최신 상태 가져오기
      await mutateClipSttStatus();
      await mutateClipsSttStatus();
      throw error;
    }
  };

  const regenerateClipSummaryAction = async (options?: {
    templateName?: string;
    customPrompt?: string;
    summaryModel?: string;
  }) => {
    try {
      const result = await regenerateClipSummary(studentId, counselingId, clipId, options);
      
      // STT 상태 캐시 업데이트
      await mutateClipSttStatus((current) => {
        return current ? {
          ...current,
          summary: result.summary,
          summaryTemplate: result.summaryTemplate,
          summaryModel: result.summaryModel,
          summaryStatus: 'completed',
        } : undefined;
      }, false);
      
      await mutateClipsSttStatus();
      
      return result;
    } catch (error) {
      console.error('클립 요약 재생성 실패:', error);
      await mutateClipSttStatus();
      await mutateClipsSttStatus();
      throw error;
    }
  };

  return {
    processClipStt: processClipSttAction,
    regenerateClipSummary: regenerateClipSummaryAction,
  };
}

// ============ 통합 클립 관리 훅 ============

/**
 * 클립의 모든 기능을 통합 제공하는 메인 훅
 */
export function useClipManagement(studentId: string, counselingId: string, clipId?: string) {
  const clipsData = useCounselingClips(studentId, counselingId);
  const clipsSttStatus = useCounselingClipsSttStatus(studentId, counselingId);
  const clipActions = useClipActions(studentId, counselingId);
  
  // 특정 클립이 지정된 경우
  const clipData = useCounselingClip(
    studentId, 
    counselingId, 
    clipId || ''
  );
  const clipSttStatus = useClipSttStatus(
    studentId, 
    counselingId, 
    clipId || ''
  );
  const clipSttActions = useClipSttActions(
    studentId, 
    counselingId, 
    clipId || ''
  );

  return {
    // 전체 클립 관련
    clips: clipsData.clips,
    isClipsLoading: clipsData.isLoading,
    clipsError: clipsData.isError,
    refreshClips: clipsData.refresh,
    
    // 전체 클립 STT 상태
    clipsSttStatus: clipsSttStatus.clipsSttStatus,
    isClipsSttStatusLoading: clipsSttStatus.isLoading,
    clipsSttStatusError: clipsSttStatus.isError,
    refreshClipsSttStatus: clipsSttStatus.refresh,
    
    // 클립 CRUD 액션
    createClip: clipActions.createClip,
    updateClip: clipActions.updateClip,
    deleteClip: clipActions.deleteClip,
    
    // 특정 클립 관련 (clipId가 있을 때만)
    clip: clipData.clip,
    isClipLoading: clipData.isLoading,
    clipError: clipData.isError,
    refreshClip: clipData.refresh,
    
    // 특정 클립 STT 상태
    clipSttStatus: clipSttStatus.sttStatus,
    isClipSttStatusLoading: clipSttStatus.isLoading,
    clipSttStatusError: clipSttStatus.isError,
    refreshClipSttStatus: clipSttStatus.refresh,
    
    // 특정 클립 STT 액션
    processClipStt: clipSttActions.processClipStt,
    regenerateClipSummary: clipSttActions.regenerateClipSummary,
  };
}