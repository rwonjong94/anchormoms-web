import { z } from 'zod';
import { UUIDSchema, EmailSchema, PhoneSchema, TimestampSchema } from './common';

// ============================================
// User Schemas
// ============================================

// 기본 사용자 스키마
export const UserBaseSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1, '이름을 입력해주세요'),
  email: EmailSchema,
  phone: PhoneSchema,
  profileImage: z.string().url().nullable().optional(),
});

// 사용자 전체 스키마 (OAuth 정보 포함)
export const UserSchema = UserBaseSchema.extend({
  googleId: z.string().nullable().optional(),
  kakaoId: z.string().nullable().optional(),
  subscription: z.string().nullable().optional(),
}).merge(TimestampSchema);

export type User = z.infer<typeof UserSchema>;

// 사용자 요약 스키마 (관계에서 사용)
export const UserSummarySchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  email: z.string(),
  googleId: z.string().nullable().optional(),
  kakaoId: z.string().nullable().optional(),
});

export type UserSummary = z.infer<typeof UserSummarySchema>;

// 사용자 생성 DTO
export const CreateUserDtoSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: EmailSchema,
  phone: PhoneSchema,
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;

// 사용자 수정 DTO
export const UpdateUserDtoSchema = CreateUserDtoSchema.partial();

export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;

// 사용자 검색 결과 스키마
export const UserSearchResultSchema = UserBaseSchema.extend({
  students: z.array(z.object({
    id: UUIDSchema,
    name: z.string(),
    grade: z.number(),
  })).optional(),
});

export type UserSearchResult = z.infer<typeof UserSearchResultSchema>;

// 사용자 목록 응답
export const UsersListResponseSchema = z.object({
  users: z.array(UserSchema),
  total: z.number().optional(),
});

export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
