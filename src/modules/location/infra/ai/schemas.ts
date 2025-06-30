import { z } from 'zod';

export const MapGenerationResultSchema = z.object({
  locations: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    parent_region_name: z.string().optional(),
    tags: z.array(z.string()),
    relative_position: z.object({
      x: z.number(),
      y: z.number()
    })
  })),
  mapSvg: z.string().optional()
});

export const LocationMutationsSchema = z.object({
  updates: z.array(z.object({
    locationId: z.string(),
    newStatus: z.string().optional(),
    descriptionAppend: z.string().optional(),
    reason: z.string()
  }))
});

export const RegionGenerationResultSchema = z.object({
  regions: z.array(z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    relative_position: z.object({
      x: z.number(),
      y: z.number()
    })
  }))
});

export const CityGenerationResultSchema = z.object({
  cities: z.array(z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    relative_position: z.object({
      x: z.number(),
      y: z.number()
    })
  }))
});

export const LandmarkGenerationResultSchema = z.object({
  landmarks: z.array(z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    relative_position: z.object({
      x: z.number(),
      y: z.number()
    })
  }))
});

export const WildernessGenerationResultSchema = z.object({
  wilderness: z.array(z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    relative_position: z.object({
      x: z.number(),
      y: z.number()
    })
  }))
});

export const MutationDecisionResultSchema = z.object({
  think: z.string(),
  shouldMutate: z.boolean()
});

export const LocationSelectionResultSchema = z.object({
  reactions: z.array(z.object({
    locationId: z.string(),
    locationName: z.string(),
    reason: z.string()
  }))
});

export const IndividualLocationMutationResultSchema = z.object({
  newStatus: z.enum(['thriving', 'stable', 'declining', 'ruined', 'abandoned', 'lost']).optional(),
  descriptionAppend: z.string().optional(),
  historicalEvent: z.string().optional()
});