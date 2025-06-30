import type { z } from 'zod';
import type { WorldArcAnchorsResponseSchema, DynamicWorldBeatResponseSchema, ArcSummaryResponseSchema } from './schemas';

export type WorldArcAnchorsResponseData = z.infer<typeof WorldArcAnchorsResponseSchema>;
export type DynamicWorldBeatResponseData = z.infer<typeof DynamicWorldBeatResponseSchema>;
export type ArcSummaryResponseData = z.infer<typeof ArcSummaryResponseSchema>;