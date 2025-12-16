// ============================================
// DTO Index - All Zod Schemas & Types Export
// ============================================

// Common schemas
export * from './common';

// Auth schemas
export * from './auth';

// User schemas
export * from './user';

// Student schemas
export * from './student';

// Class schemas
export * from './class';

// Exam schemas
export * from './exam';

// Counseling schemas
export * from './counseling';

// Score schemas
export * from './score';

// ============================================
// Utility Functions
// ============================================

import { z, ZodError } from 'zod';

/**
 * API 응답을 Zod 스키마로 검증
 * @param schema - Zod 스키마
 * @param data - 검증할 데이터
 * @returns 검증된 데이터 또는 null (검증 실패 시)
 */
export function validateResponse<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('[DTO Validation Error]', error.errors);
    }
    return null;
  }
}

/**
 * API 응답을 Zod 스키마로 검증 (에러 throw)
 * @param schema - Zod 스키마
 * @param data - 검증할 데이터
 * @returns 검증된 데이터
 * @throws ZodError - 검증 실패 시
 */
export function parseResponse<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * API 응답을 Zod 스키마로 안전하게 검증
 * @param schema - Zod 스키마
 * @param data - 검증할 데이터
 * @returns { success: true, data } | { success: false, error }
 */
export function safeParseResponse<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.SafeParseReturnType<unknown, z.infer<T>> {
  return schema.safeParse(data);
}

/**
 * Zod 에러를 사용자 친화적 메시지로 변환
 * @param error - ZodError
 * @returns 에러 메시지 문자열
 */
export function formatZodError(error: ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join('.');
      return path ? `${path}: ${err.message}` : err.message;
    })
    .join(', ');
}

/**
 * Zod 에러를 필드별 에러 객체로 변환
 * @param error - ZodError
 * @returns { [field]: errorMessage }
 */
export function getFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const err of error.errors) {
    const path = err.path.join('.');
    if (path && !errors[path]) {
      errors[path] = err.message;
    }
  }

  return errors;
}
