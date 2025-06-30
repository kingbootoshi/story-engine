import { z } from 'zod';

export const CharacterBatchSchema = z.object({
  characters: z.array(z.object({
    name: z.string(),
    story_role: z.enum(['major', 'minor', 'wildcard', 'background']),
    faction_id: z.string().nullable(),
    personality_traits: z.array(z.string()),
    motivations: z.array(z.string()),
    description: z.string(),
    background: z.string(),
    spawn_location: z.string()
  }))
});

export const CharacterReactionSchema = z.object({
  affected: z.boolean(),
  changes: z.object({
    dies: z.boolean(),
    new_memories: z.array(z.object({
      event_description: z.string(),
      emotional_impact: z.enum(['positive', 'negative', 'neutral']),
      importance: z.number().min(0).max(1),
    })),
    motivation_changes: z.object({
      add: z.array(z.string()),
      remove: z.array(z.string())
    }),
    location_name: z.string().nullable().optional(),
    faction_name: z.string().nullable().optional(),
    new_description: z.string().optional(),
    background_addition: z.string().nullable()
  }),
  world_event: z.object({
    emit: z.boolean(),
    description: z.string(),
    impact: z.enum(['minor', 'moderate', 'major'])
  }).nullable()
});

export const SpawnDecisionSchema = z.object({
  spawn_characters: z.boolean(),
  new_characters: z.array(z.object({
    name: z.string(),
    story_role: z.enum(['major', 'minor', 'wildcard', 'background']),
    faction_name: z.string().nullable(),
    personality_traits: z.array(z.string()),
    motivations: z.array(z.string()),
    description: z.string(),
    background: z.string(),
    spawn_location: z.string()
  }))
});

export const CharacterSelectionSchema = z.object({
  affected_characters: z.array(z.object({
    character_name: z.string(),
    reason: z.string()
  }))
});