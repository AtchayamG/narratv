import { z } from 'zod';

export const SubtitleCueSchema = z.object({
  id: z.union([z.number(), z.string()]),
  tStart: z.number().min(0),
  tEnd: z.number().min(0),
  text: z.string()
}).refine(cue => cue.tEnd >= cue.tStart, {
  message: 'tEnd must be greater than or equal to tStart'
});

export type SubtitleCue = z.infer<typeof SubtitleCueSchema>;
