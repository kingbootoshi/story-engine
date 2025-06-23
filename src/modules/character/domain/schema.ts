import { z } from 'zod';
import { ISODateString } from '../../../shared/utils/validation';

export const CharacterType = z.enum(['player', 'npc']);
export type CharacterType = z.infer<typeof CharacterType>;

export const CharacterStatus = z.enum(['alive', 'deceased']);
export type CharacterStatus = z.infer<typeof CharacterStatus>;

export const StoryRole = z.enum(['major', 'minor', 'wildcard', 'background']);
export type StoryRole = z.infer<typeof StoryRole>;

export const CharacterMemory = z.object({
  event_description: z.string(),
  timestamp: ISODateString,
  emotional_impact: z.enum(['positive', 'negative', 'neutral']),
  importance: z.number().min(0).max(1),
  beat_index: z.number().optional()
});
export type CharacterMemory = z.infer<typeof CharacterMemory>;

export const Character = z.object({
  id: z.string().uuid(),
  world_id: z.string().uuid(),
  
  name: z.string().min(1).max(120),
  type: CharacterType,
  status: CharacterStatus,
  story_role: StoryRole,
  
  location_id: z.string().uuid().nullable(),
  faction_id: z.string().uuid().nullable(),
  
  description: z.string(),
  background: z.string(),
  personality_traits: z.array(z.string()),
  motivations: z.array(z.string()),
  
  memories: z.array(CharacterMemory),
  story_beats_witnessed: z.array(z.number().int()),
  
  created_at: ISODateString,
  updated_at: ISODateString
});
export type Character = z.infer<typeof Character>;

export const CreateCharacter = Character.pick({
  world_id: true,
  name: true,
  type: true,
  story_role: true,
  location_id: true,
  faction_id: true,
  description: true,
  background: true,
  personality_traits: true,
  motivations: true
}).extend({
  status: CharacterStatus.optional().default('alive'),
  memories: z.array(CharacterMemory).optional().default([]),
  story_beats_witnessed: z.array(z.number().int()).optional().default([])
});
export type CreateCharacter = z.infer<typeof CreateCharacter>;

export const UpdateCharacter = Character.partial().omit({
  id: true,
  world_id: true,
  created_at: true
});
export type UpdateCharacter = z.infer<typeof UpdateCharacter>;

export const CharacterReaction = z.object({
  affected: z.boolean(),
  changes: z.object({
    dies: z.boolean(),
    new_memories: z.array(CharacterMemory),
    motivation_changes: z.object({
      add: z.array(z.string()),
      remove: z.array(z.string())
    }),
    location_id: z.string().uuid().nullable().optional(),
    faction_id: z.string().uuid().nullable().optional(),
    new_description: z.string().optional(),
    background_addition: z.string().nullable()
  }),
  world_event: z.object({
    emit: z.boolean(),
    description: z.string(),
    impact: z.enum(['minor', 'moderate', 'major'])
  }).nullable()
});
export type CharacterReaction = z.infer<typeof CharacterReaction>;

export const CharacterBatch = z.object({
  name: z.string(),
  story_role: StoryRole,
  faction_id: z.string().uuid().nullable(),
  personality_traits: z.array(z.string()),
  motivations: z.array(z.string()),
  description: z.string(),
  background: z.string(),
  spawn_location: z.string()
});
export type CharacterBatch = z.infer<typeof CharacterBatch>;

export const SpawnDecision = z.object({
  spawn_characters: z.boolean(),
  new_characters: z.array(CharacterBatch)
});
export type SpawnDecision = z.infer<typeof SpawnDecision>;