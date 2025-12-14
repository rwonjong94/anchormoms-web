import { z } from 'zod';

export const seongdaeSchema = z.object({
  contest: z.literal('seongdae'),
  season: z.enum(['early', 'late']),
  grade: z.number().int().min(1).max(6),
  rounds: z.record(z.string(), z.array(z.union([z.string(), z.number()]))),
  updatedAt: z.string().optional(),
});

export const premiumMexSchema = z.object({
  contest: z.literal('premium-mex'),
  grade: z.number().int().min(1).max(6),
  domain: z.enum(['num', 'geo', 'pat']),
  answers: z.array(z.union([z.string(), z.number()])),
  updatedAt: z.string().optional(),
});

export const coreMoreSchema = z.object({
  contest: z.literal('core-more'),
  grade: z.number().int().min(1).max(6),
  type: z.enum(['BASIC', 'CORE', 'MORE']),
  answers: z.array(z.union([z.string(), z.number()])),
  updatedAt: z.string().optional(),
});

export type SeongdaeSchema = z.infer<typeof seongdaeSchema>;
export type PremiumMexSchema = z.infer<typeof premiumMexSchema>;
export type CoreMoreSchema = z.infer<typeof coreMoreSchema>;


