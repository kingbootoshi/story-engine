import { z } from 'zod';

export const UserAIUsage = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  generation_id: z.string().nullable(),
  model: z.string(),
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
  total_cost: z.number(),
  module: z.string(),
  prompt_id: z.string(),
  world_id: z.string().uuid().nullable(),
  metadata: z.record(z.any()),
  created_at: z.string().datetime()
});

export type UserAIUsage = z.infer<typeof UserAIUsage>;

export const UsageSummary = z.object({
  user_id: z.string().uuid(),
  period: z.enum(['day', 'week', 'month', 'all']),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  total_tokens: z.number(),
  total_cost: z.number(),
  usage_by_model: z.record(z.object({
    tokens: z.number(),
    cost: z.number()
  })),
  usage_by_module: z.record(z.object({
    tokens: z.number(),
    cost: z.number()
  }))
});

export type UsageSummary = z.infer<typeof UsageSummary>;