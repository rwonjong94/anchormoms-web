import { z } from 'zod';
import { UUIDSchema, TimestampSchema, PaginationResponseSchema } from './common';

// ============================================
// Exam Schemas
// ============================================

// 시험 타입 enum
export const ExamTypeEnum = z.enum(['FULL', 'HALF', 'BEGINNER']);
export type ExamType = z.infer<typeof ExamTypeEnum>;

// 시험 상태 enum
export const ExamStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export type ExamStatus = z.infer<typeof ExamStatusEnum>;

// 문제 스키마
export const QuestionSchema = z.object({
  id: UUIDSchema,
  questionNumber: z.number().int().min(1),
  content: z.string(),
  condition: z.string().nullable().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  explanation: z.string().nullable().optional(),
  previewType: z.enum(['question', 'explanation']).optional(),
  examType: z.string(),
  examNum: z.string(),
  answer: z.string().optional(),
  score: z.number().optional(),
});

export type Question = z.infer<typeof QuestionSchema>;

// 시험 기본 스키마
export const ExamBaseSchema = z.object({
  id: UUIDSchema,
  type: ExamTypeEnum,
  examnum: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  duration: z.number().int().min(1), // 분 단위
  totalQuestions: z.number().int().min(1),
  totalScore: z.number().int().min(0),
  activatedAt: z.string().datetime().nullable().optional(),
  status: ExamStatusEnum.optional(),
});

// 시험 전체 스키마
export const ExamSchema = ExamBaseSchema.extend({
  questions: z.array(QuestionSchema).optional(),
}).merge(TimestampSchema);

export type Exam = z.infer<typeof ExamSchema>;

// 시험 세션 (응시 중)
export const ExamSessionSchema = z.object({
  examType: z.string(),
  examNum: z.string(),
  studentId: UUIDSchema.optional(),
  startTime: z.date().or(z.string()),
  duration: z.number(), // 분
  questions: z.array(QuestionSchema),
  timerEnabled: z.boolean(),
});

export type ExamSession = z.infer<typeof ExamSessionSchema>;

// 학생 답안
export const StudentAnswerSchema = z.object({
  questionId: UUIDSchema,
  questionNumber: z.number().int(),
  answer: z.string(),
  timestamp: z.date().or(z.string()),
});

export type StudentAnswer = z.infer<typeof StudentAnswerSchema>;

// 문제 상태
export const QuestionStatusSchema = z.object({
  questionNumber: z.number().int(),
  completed: z.boolean(),
  marked: z.boolean(),
});

export type QuestionStatus = z.infer<typeof QuestionStatusSchema>;

// 시험 캐시 (로컬 저장용)
export const ExamCacheSchema = z.object({
  examSession: ExamSessionSchema,
  answers: z.record(z.string(), StudentAnswerSchema),
  currentQuestion: z.number().int(),
  lastSaved: z.date().or(z.string()),
});

export type ExamCache = z.infer<typeof ExamCacheSchema>;

// 타이머 상태
export const TimerStateSchema = z.object({
  visible: z.boolean(),
  running: z.boolean(),
  timeRemaining: z.number(), // 초
});

export type TimerState = z.infer<typeof TimerStateSchema>;

// 시험 응시 기록
export const ExamAttemptSchema = z.object({
  id: UUIDSchema,
  examId: UUIDSchema,
  studentId: UUIDSchema,
  startedAt: z.string().datetime(),
  submittedAt: z.string().datetime().nullable().optional(),
  score: z.number().nullable().optional(),
  totalScore: z.number(),
  answers: z.array(StudentAnswerSchema).optional(),
}).merge(TimestampSchema);

export type ExamAttempt = z.infer<typeof ExamAttemptSchema>;

// 시험 목록 응답 (응시 상태 포함)
export const ExamWithStatusSchema = ExamSchema.extend({
  attempt: ExamAttemptSchema.nullable().optional(),
});

export type ExamWithStatus = z.infer<typeof ExamWithStatusSchema>;

// 시험 목록 응답
export const ExamsListResponseSchema = z.object({
  exams: z.array(ExamSchema),
}).merge(PaginationResponseSchema.partial());

export type ExamsListResponse = z.infer<typeof ExamsListResponseSchema>;

// 시험 생성 DTO
export const CreateExamDtoSchema = z.object({
  type: ExamTypeEnum,
  examnum: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().min(1),
  totalQuestions: z.number().int().min(1),
  totalScore: z.number().int().min(0),
  activatedAt: z.string().datetime().optional(),
});

export type CreateExamDto = z.infer<typeof CreateExamDtoSchema>;

// 시험 수정 DTO
export const UpdateExamDtoSchema = CreateExamDtoSchema.partial();

export type UpdateExamDto = z.infer<typeof UpdateExamDtoSchema>;

// 답안 제출 DTO
export const SubmitAnswersDtoSchema = z.object({
  examId: UUIDSchema,
  studentId: UUIDSchema,
  answers: z.array(z.object({
    questionNumber: z.number().int(),
    answer: z.string(),
  })),
});

export type SubmitAnswersDto = z.infer<typeof SubmitAnswersDtoSchema>;
