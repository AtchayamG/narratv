import { z } from 'zod';

export const GapSchema = z.object({
  id: z.string().min(1),
  tStart: z.number().min(0),
  tEnd: z.number().min(0),
  duration: z.number().positive(),
  prevCueId: z.union([z.number(), z.string()]).optional(),
  nextCueId: z.union([z.number(), z.string()]).optional()
}).refine(gap => gap.tEnd >= gap.tStart, {
  message: 'tEnd must be greater than or equal to tStart'
});

export type Gap = z.infer<typeof GapSchema>;
