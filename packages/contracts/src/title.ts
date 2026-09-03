import { z } from 'zod';

export const TitleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  durationSec: z.number().positive(),
  videoUrl: z.string().url(),
  streamUrl: z.string().url().optional(),
  streamUrlHd: z.string().url().optional(),
  subtitleUrl: z.string().url().optional(),
  descriptionTrackUrl: z.string().url().optional(),
  posterUrl: z.string().optional(),
  heroUrl: z.string().optional(),
  synopsis: z.string(),
  genre: z.string(),
  rating: z.string(),
  license: z.string()
});

export type Title = z.infer<typeof TitleSchema>;
