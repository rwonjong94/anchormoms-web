import { z } from 'zod';
import { UUIDSchema, GradeSchema, TimestampSchema } from './common';
import { StudentBaseSchema } from './student';

// ============================================
// Class (반) Schemas
// ============================================

// 반 기본 스키마
export const ClassBaseSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1, '반 이름을 입력해주세요'),
  description: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  grade: GradeSchema.nullable().optional(),
  schedule: z.any().nullable().optional(),
});

// 반 전체 스키마
export const ClassSchema = ClassBaseSchema.extend({
  students: z.array(StudentBaseSchema).default([]),
}).merge(TimestampSchema);

export type Class = z.infer<typeof ClassSchema>;

// 반 생성 DTO
export const CreateClassDtoSchema = z.object({
  name: z.string().min(1, '반 이름을 입력해주세요'),
  description: z.string().optional(),
  subject: z.string().optional(),
  grade: GradeSchema.optional(),
  schedule: z.any().optional(),
  studentIds: z.array(UUIDSchema).optional(),
});

export type CreateClassDto = z.infer<typeof CreateClassDtoSchema>;

// 반 수정 DTO
export const UpdateClassDtoSchema = CreateClassDtoSchema.partial();

export type UpdateClassDto = z.infer<typeof UpdateClassDtoSchema>;

// 반 목록 응답
export const ClassesListResponseSchema = z.array(ClassSchema);

export type ClassesListResponse = z.infer<typeof ClassesListResponseSchema>;

// 반 상세 응답
export const ClassDetailResponseSchema = ClassSchema;

export type ClassDetailResponse = z.infer<typeof ClassDetailResponseSchema>;

// 수업 일지 스키마
export const ClassLogSchema = z.object({
  id: UUIDSchema,
  title: z.string().nullable().optional(),
  content: z.string(),
  homework: z.string().nullable().optional(),
  notice: z.string().nullable().optional(),
  date: z.string(),
  classLecture: ClassSchema.optional(),
}).merge(TimestampSchema);

export type ClassLog = z.infer<typeof ClassLogSchema>;

// 수업 일지 생성 DTO
export const CreateClassLogDtoSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, '내용을 입력해주세요'),
  homework: z.string().optional(),
  notice: z.string().optional(),
  date: z.string(),
  classLectureId: UUIDSchema,
});

export type CreateClassLogDto = z.infer<typeof CreateClassLogDtoSchema>;
