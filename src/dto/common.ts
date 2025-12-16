import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

// UUID 스키마
export const UUIDSchema = z.string().uuid();

// 페이지네이션 요청
export const PaginationRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;

// 페이지네이션 응답
export const PaginationResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;

// 타임스탬프 스키마
export const TimestampSchema = z.object({
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export type Timestamp = z.infer<typeof TimestampSchema>;

// API 에러 응답
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// 성공 응답
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

// 한국 전화번호 정규식
export const KoreanPhoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/;

// 전화번호 스키마
export const PhoneSchema = z
  .string()
  .regex(KoreanPhoneRegex, '올바른 휴대폰 번호 형식이 아닙니다')
  .or(z.literal(''))
  .nullable()
  .optional();

// 이메일 스키마
export const EmailSchema = z.string().email('올바른 이메일 형식이 아닙니다');

// 학년 스키마 (초등학교 1-6학년)
export const GradeSchema = z.coerce.number().int().min(1).max(6);
