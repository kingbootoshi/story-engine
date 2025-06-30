import { MapGenerationResultSchema, LocationMutationsSchema } from './schemas';

export function validateMapGenerationResult(result: any) {
  return MapGenerationResultSchema.safeParse(result);
}

export function validateLocationMutations(result: any) {
  return LocationMutationsSchema.safeParse(result);
}