import { z } from 'zod';

export const WorldArcAnchorSchema = z.object({
  beatIndex: z.number().int().refine((i: number) => [0, 7, 14].includes(i), {
    message: 'Beat index must be 0, 7, or 14',
  }),
  beatName: z.string(),
  description: z.string(),
  worldDirectives: z.array(z.string()),
  majorEvents: z.array(z.string()),
  emergentStorylines: z.array(z.string()),
});

export const GenerateWorldArcAnchorsSchema = z.object({
  anchors: z.array(WorldArcAnchorSchema).length(3),
});

export type WorldArcAnchorsPayload = z.infer<typeof GenerateWorldArcAnchorsSchema>; 