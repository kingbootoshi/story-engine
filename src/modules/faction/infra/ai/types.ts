import type { z } from 'zod';
import type { GenerateFactionResponseSchema, UpdateDoctrineResponseSchema, EvaluateRelationsResponseSchema } from './schemas';

export type GenerateFactionResponseData = z.infer<typeof GenerateFactionResponseSchema>;
export type UpdateDoctrineResponseData = z.infer<typeof UpdateDoctrineResponseSchema>;
export type EvaluateRelationsResponseData = z.infer<typeof EvaluateRelationsResponseSchema>;