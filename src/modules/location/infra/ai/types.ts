import type { z } from 'zod';
import type { 
  MapGenerationResultSchema, 
  LocationMutationsSchema, 
  RegionGenerationResultSchema,
  CityGenerationResultSchema,
  LandmarkGenerationResultSchema,
  WildernessGenerationResultSchema,
  MutationDecisionResultSchema
} from './schemas';

export type MapGenerationResultData = z.infer<typeof MapGenerationResultSchema>;
export type LocationMutationsData = z.infer<typeof LocationMutationsSchema>;
export type RegionGenerationResultData = z.infer<typeof RegionGenerationResultSchema>;
export type CityGenerationResultData = z.infer<typeof CityGenerationResultSchema>;
export type LandmarkGenerationResultData = z.infer<typeof LandmarkGenerationResultSchema>;
export type WildernessGenerationResultData = z.infer<typeof WildernessGenerationResultSchema>;
export type MutationDecisionResultData = z.infer<typeof MutationDecisionResultSchema>;