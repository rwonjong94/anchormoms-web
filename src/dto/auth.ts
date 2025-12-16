import { z } from 'zod';
import { UserSchema } from './user';

// ============================================
// Auth Schemas
// ============================================

// 관리자 로그인 요청 DTO
export const AdminLoginDtoSchema = z.object({
  username: z.string().min(1, '사용자명을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

export type AdminLoginDto = z.infer<typeof AdminLoginDtoSchema>;

// 관리자 로그인 응답
export const AdminLoginResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    role: z.string(),
    isAdmin: z.boolean(),
    name: z.string(),
  }),
});

export type AdminLoginResponse = z.infer<typeof AdminLoginResponseSchema>;

// 관리자 사용자 정보
export const AdminUserSchema = z.object({
  username: z.string(),
  role: z.string(),
  isAdmin: z.boolean().optional(),
});

export type AdminUser = z.infer<typeof AdminUserSchema>;

// 토큰 검증 응답
export const TokenValidationResponseSchema = z.object({
  valid: z.boolean(),
  user: AdminUserSchema.optional(),
});

export type TokenValidationResponse = z.infer<typeof TokenValidationResponseSchema>;

// 일반 사용자 로그인 응답 (OAuth)
export const UserLoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  user: UserSchema,
});

export type UserLoginResponse = z.infer<typeof UserLoginResponseSchema>;

// OAuth 콜백 파라미터
export const OAuthCallbackParamsSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export type OAuthCallbackParams = z.infer<typeof OAuthCallbackParamsSchema>;
