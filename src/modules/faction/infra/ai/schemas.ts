import { z } from 'zod';

export const GenerateFactionResponseSchema = z.object({
  name: z.string(),
  ideology: z.string(),
  status: z.enum(['rising', 'stable', 'declining']),
  members_estimate: z.number(),
  tags: z.array(z.string()),
  banner_color: z.string().nullable()
});

export const UpdateDoctrineResponseSchema = z.object({
  ideology: z.string(),
  tags: z.array(z.string())
});

export const EvaluateRelationsResponseSchema = z.object({
  suggestions: z.array(z.object({
    sourceId: z.string(),
    targetId: z.string(),
    suggestedStance: z.enum(['ally', 'neutral', 'hostile']),
    reason: z.string()
  }))
});