import { z } from 'zod';
import { UUIDSchema, TimestampSchema } from './common';
import { StudentBaseSchema } from './student';

// ============================================
// Counseling Schemas
// ============================================

// STT 상태 enum
export const SttStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed']);
export type SttStatus = z.infer<typeof SttStatusEnum>;

// 상담 기본 스키마
export const CounselingBaseSchema = z.object({
  id: UUIDSchema,
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  date: z.string(),
  studentId: UUIDSchema.optional(),
});

// 상담 전체 스키마
export const CounselingSchema = CounselingBaseSchema.extend({
  student: StudentBaseSchema.nullable().optional(),
}).merge(TimestampSchema);

export type Counseling = z.infer<typeof CounselingSchema>;

// 음성 상담 클립
export const AudioClipSchema = z.object({
  id: UUIDSchema,
  startTime: z.number(),
  endTime: z.number(),
  audioUrl: z.string().url().nullable().optional(),
  transcript: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  transcriptStatus: SttStatusEnum,
  summaryStatus: SttStatusEnum,
}).merge(TimestampSchema);

export type AudioClip = z.infer<typeof AudioClipSchema>;

// 음성 상담 스키마
export const AudioCounselingSchema = z.object({
  id: UUIDSchema,
  studentId: UUIDSchema,
  title: z.string().nullable().optional(),
  audioUrl: z.string().url().nullable().optional(),
  duration: z.number().nullable().optional(),
  transcript: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  transcriptStatus: SttStatusEnum,
  summaryStatus: SttStatusEnum,
  clips: z.array(AudioClipSchema).optional(),
}).merge(TimestampSchema);

export type AudioCounseling = z.infer<typeof AudioCounselingSchema>;

// 상담 생성 DTO
export const CreateCounselingDtoSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, '내용을 입력해주세요'),
  date: z.string(),
  studentId: UUIDSchema,
});

export type CreateCounselingDto = z.infer<typeof CreateCounselingDtoSchema>;

// 상담 수정 DTO
export const UpdateCounselingDtoSchema = CreateCounselingDtoSchema.partial();

export type UpdateCounselingDto = z.infer<typeof UpdateCounselingDtoSchema>;

// 음성 상담 업로드 응답
export const AudioUploadResponseSchema = z.object({
  id: UUIDSchema,
  audioUrl: z.string().url(),
  duration: z.number().optional(),
});

export type AudioUploadResponse = z.infer<typeof AudioUploadResponseSchema>;

// STT 처리 요청 DTO
export const ProcessSttDtoSchema = z.object({
  counselingId: UUIDSchema,
  useQueue: z.boolean().default(true),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
});

export type ProcessSttDto = z.infer<typeof ProcessSttDtoSchema>;

// STT 상태 응답
export const SttStatusResponseSchema = z.object({
  transcriptStatus: SttStatusEnum,
  summaryStatus: SttStatusEnum,
  transcript: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
});

export type SttStatusResponse = z.infer<typeof SttStatusResponseSchema>;

// 상담 목록 응답
export const CounselingsListResponseSchema = z.array(CounselingSchema);

export type CounselingsListResponse = z.infer<typeof CounselingsListResponseSchema>;

// 음성 상담 목록 응답
export const AudioCounselingsListResponseSchema = z.array(AudioCounselingSchema);

export type AudioCounselingsListResponse = z.infer<typeof AudioCounselingsListResponseSchema>;
