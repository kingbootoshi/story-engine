import { z } from 'zod';

export const WorldArcAnchorsResponseSchema = z.object({
  anchors: z.array(z.object({
    beatIndex: z.number().int().refine(val => [0, 7, 14].includes(val), {
      message: "beatIndex must be 0, 7, or 14"
    }),
    beatName: z.string(),
    description: z.string(),
    worldDirectives: z.array(z.string()),
    majorEvents: z.array(z.string()),
    emergentStorylines: z.array(z.string())
  })).length(3),
  arcDetailedDescription: z.string()
});

export const DynamicWorldBeatResponseSchema = z.object({
  beatName: z.string(),
  description: z.string(),
  worldDirectives: z.array(z.string()),
  emergingConflicts: z.array(z.string()),
  environmentalChanges: z.array(z.string()).nullable()
});

export const ArcSummaryResponseSchema = z.object({
  summary: z.string(),
  majorChanges: z.array(z.string()),
  affectedRegions: z.array(z.string()),
  thematicProgression: z.string(),
  futureImplications: z.array(z.string())
});