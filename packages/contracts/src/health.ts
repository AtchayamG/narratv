import { z } from 'zod';

export const ProviderStatusSchema = z.enum(['ok', 'error', 'unconfigured']);
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

export const HealthResponseSchema = z.object({
  mode: z.enum(['demo', 'live']),
  providers: z.object({
    bedrock: ProviderStatusSchema,
    polly: ProviderStatusSchema,
    s3: ProviderStatusSchema.optional()
  }),
  revision: z.string().min(1),
  timestamp: z.string()
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
