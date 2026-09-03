import { z } from 'zod';
import { DescriptionSchema } from './description';

export const TrackMetadataSchema = z.object({
  totalGaps: z.number().int().nonnegative(),
  describedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  overlapCount: z.number().int().nonnegative(),
  generatedAt: z.string(),
  model: z.string(),
  sourceSrt: z.string().optional()
});

export type TrackMetadata = z.infer<typeof TrackMetadataSchema>;

export const DescriptionTrackSchema = z.object({
  titleId: z.string().min(1),
  revision: z.string().min(1),
  status: z.enum(['ai-draft', 'verified', 'mixed']),
  descriptions: z.array(DescriptionSchema),
  metadata: TrackMetadataSchema
});

export type DescriptionTrack = z.infer<typeof DescriptionTrackSchema>;
