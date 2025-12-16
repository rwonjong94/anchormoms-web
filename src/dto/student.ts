import { z } from 'zod';
import {
  UUIDSchema,
  GradeSchema,
  PhoneSchema,
  EmailSchema,
  TimestampSchema,
  PaginationResponseSchema
} from './common';
import { UserSummarySchema } from './user';

// ============================================
// Student Schemas
// ============================================

// 주간 스케줄 아이템
export const ScheduleItemSchema = z.object({
  id: z.string(),
  subject: z.string(),
  academyName: z.string().optional(),
  startMin: z.number(),
  endMin: z.number(),
  color: z.string(),
});

export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;

// 주간 스케줄
export const WeeklyScheduleSchema = z.object({
  mon: z.array(ScheduleItemSchema).default([]),
  tue: z.array(ScheduleItemSchema).default([]),
  wed: z.array(ScheduleItemSchema).default([]),
  thu: z.array(ScheduleItemSchema).default([]),
  fri: z.array(ScheduleItemSchema).default([]),
  sat: z.array(ScheduleItemSchema).default([]),
  sun: z.array(ScheduleItemSchema).default([]),
});

export type WeeklySchedule = z.infer<typeof WeeklyScheduleSchema>;

// 로드맵 베이스
export const RoadmapBaseSchema = z.object({
  base: z.object({
    startGrade: z.number(),
    startAcademicYear: z.number(),
    gradePromotionMonth: z.number(),
  }).optional(),
  extras: z.object({
    subjectGroups: z.array(z.string()).default([]),
    thinkingTypes: z.array(z.string()).default([]),
    thinkingLevels: z.array(z.string()).default([]),
  }).optional(),
}).nullable().optional();

export type RoadmapBase = z.infer<typeof RoadmapBaseSchema>;

// 학생 기본 스키마
export const StudentBaseSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1, '학생 이름을 입력해주세요'),
  grade: GradeSchema,
  school: z.string().nullable().optional(),
  phone: PhoneSchema,
  userId: UUIDSchema.nullable().optional(),
});

// 학생 전체 스키마
export const StudentSchema = StudentBaseSchema.extend({
  user: UserSummarySchema.nullable().optional(),
  weeklySchedule: WeeklyScheduleSchema.nullable().optional(),
  roadmapBase: RoadmapBaseSchema,
  studyLogs: z.any().nullable().optional(),
}).merge(TimestampSchema);

export type Student = z.infer<typeof StudentSchema>;

// 학생 생성 DTO
export const CreateStudentDtoSchema = z.object({
  name: z.string().min(1, '학생 이름을 입력해주세요'),
  grade: GradeSchema,
  school: z.string().optional(),
  phone: PhoneSchema,
  // 부모 정보 (새 부모 생성 또는 기존 부모 연결)
  userId: UUIDSchema.optional(),
  userEmail: EmailSchema.optional(),
  userName: z.string().optional(),
  userPhone: PhoneSchema,
});

export type CreateStudentDto = z.infer<typeof CreateStudentDtoSchema>;

// 학생 수정 DTO
export const UpdateStudentDtoSchema = z.object({
  name: z.string().min(1).optional(),
  grade: GradeSchema.optional(),
  school: z.string().nullable().optional(),
  phone: PhoneSchema,
  userId: UUIDSchema.nullable().optional(),
  userEmail: EmailSchema.optional(),
  userName: z.string().optional(),
  userPhone: PhoneSchema,
  unlinkParent: z.boolean().optional(),
  weeklySchedule: WeeklyScheduleSchema.optional(),
  roadmapBase: RoadmapBaseSchema,
});

export type UpdateStudentDto = z.infer<typeof UpdateStudentDtoSchema>;

// 학생 목록 요청 파라미터
export const StudentsListRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  grade: z.coerce.number().int().min(1).max(6).optional(),
  userId: UUIDSchema.optional(),
});

export type StudentsListRequest = z.infer<typeof StudentsListRequestSchema>;

// 학생 목록 응답
export const StudentsListResponseSchema = z.object({
  students: z.array(StudentSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type StudentsListResponse = z.infer<typeof StudentsListResponseSchema>;

// 학생 상세 응답
export const StudentDetailResponseSchema = StudentSchema;

export type StudentDetailResponse = z.infer<typeof StudentDetailResponseSchema>;
