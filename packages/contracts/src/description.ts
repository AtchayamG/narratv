import { z } from 'zod';

export const DescriptionStatusSchema = z.enum(['ai-draft', 'verified', 'skipped']);
export type DescriptionStatus = z.infer<typeof DescriptionStatusSchema>;

export const SkipReasonSchema = z.enum([
  'no-gap',
  'too-long',
  'low-confidence',
  'model-invalid',
  'human-rejected'
]);
export type SkipReason = z.infer<typeof SkipReasonSchema>;

export const DescriptionSchema = z.object({
  id: z.string().min(1),
  tStart: z.number().min(0),
  tEnd: z.number().min(0),
  text: z.string(),
  confidence: z.number().min(0).max(1),
  frameRef: z.string(),
  model: z.string().min(1),
  status: DescriptionStatusSchema,
  skipReason: z.string().optional(),
  audioUrl: z.string().optional(),
  placementRule: z.string().optional(),
  verifiedAt: z.string().optional(),
  verifiedBy: z.string().optional(),
  durationSec: z.number().nonnegative().optional()
});

export type Description = z.infer<typeof DescriptionSchema>;

export const LiveDescribeRequestSchema = z.object({
  titleId: z.string().min(1),
  timestampSec: z.number().min(0),
  frameBase64: z.string().optional(),
  previousDescription: z.string().optional()
});

export type LiveDescribeRequest = z.infer<typeof LiveDescribeRequestSchema>;
