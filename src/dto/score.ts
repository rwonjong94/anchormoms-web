import { z } from 'zod';
import { UUIDSchema, GradeSchema, TimestampSchema } from './common';

// ============================================
// Score Schemas
// ============================================

// 성적 유형 enum
export const ScoreTypeEnum = z.enum([
  'EXAM',           // 시험
  'QUIZ',           // 퀴즈
  'HOMEWORK',       // 숙제
  'CONTEST',        // 대회
  'OTHER',          // 기타
]);

export type ScoreType = z.infer<typeof ScoreTypeEnum>;

// 성적 기본 스키마
export const ScoreBaseSchema = z.object({
  id: UUIDSchema,
  studentId: UUIDSchema,
  type: ScoreTypeEnum,
  title: z.string(),
  score: z.number(),
  totalScore: z.number(),
  percentage: z.number().min(0).max(100).optional(),
  rank: z.number().int().min(1).nullable().optional(),
  totalStudents: z.number().int().min(1).nullable().optional(),
  date: z.string(),
  memo: z.string().nullable().optional(),
});

// 성적 전체 스키마
export const ScoreSchema = ScoreBaseSchema.merge(TimestampSchema);

export type Score = z.infer<typeof ScoreSchema>;

// 성적 생성 DTO
export const CreateScoreDtoSchema = z.object({
  studentId: UUIDSchema,
  type: ScoreTypeEnum,
  title: z.string().min(1, '제목을 입력해주세요'),
  score: z.number().min(0),
  totalScore: z.number().min(1),
  rank: z.number().int().min(1).nullable().optional(),
  totalStudents: z.number().int().min(1).nullable().optional(),
  date: z.string(),
  memo: z.string().optional(),
});

export type CreateScoreDto = z.infer<typeof CreateScoreDtoSchema>;

// 성적 수정 DTO
export const UpdateScoreDtoSchema = CreateScoreDtoSchema.partial().omit({ studentId: true });

export type UpdateScoreDto = z.infer<typeof UpdateScoreDtoSchema>;

// 성적 목록 요청 파라미터
export const ScoresListRequestSchema = z.object({
  studentId: UUIDSchema.optional(),
  type: ScoreTypeEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ScoresListRequest = z.infer<typeof ScoresListRequestSchema>;

// 성적 목록 응답
export const ScoresListResponseSchema = z.object({
  scores: z.array(ScoreSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type ScoresListResponse = z.infer<typeof ScoresListResponseSchema>;

// 성적 통계
export const ScoreStatsSchema = z.object({
  averageScore: z.number(),
  averagePercentage: z.number(),
  highestScore: z.number(),
  lowestScore: z.number(),
  totalExams: z.number(),
  trend: z.array(z.object({
    date: z.string(),
    score: z.number(),
    percentage: z.number(),
  })),
});

export type ScoreStats = z.infer<typeof ScoreStatsSchema>;
