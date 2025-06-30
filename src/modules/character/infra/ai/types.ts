import type { z } from 'zod';
import type { CharacterBatchSchema, CharacterReactionSchema, SpawnDecisionSchema } from './schemas';

export type CharacterBatchData = z.infer<typeof CharacterBatchSchema>;
export type CharacterReactionData = z.infer<typeof CharacterReactionSchema>;
export type SpawnDecisionData = z.infer<typeof SpawnDecisionSchema>;