import { z } from 'zod';
import { UUIDString, ISODateString, NonEmptyString } from '../../../shared/utils/validation';

export { UUIDString } from '../../../shared/utils/validation';

export const CharacterType = z.enum(['player', 'npc']);
export type CharacterType = z.infer<typeof CharacterType>;

export const CharacterStatus = z.enum(['alive', 'deceased', 'missing', 'ascended']);
export type CharacterStatus = z.infer<typeof CharacterStatus>;

export const StoryRole = z.enum(['major', 'minor', 'wildcard', 'background']);
export type StoryRole = z.infer<typeof StoryRole>;

export const RelationshipType = z.enum(['family', 'romantic', 'friendship', 'rivalry', 'professional', 'nemesis']);
export type RelationshipType = z.infer<typeof RelationshipType>;

export const ImpactLevel = z.enum(['minor', 'moderate', 'major', 'defining']);
export type ImpactLevel = z.infer<typeof ImpactLevel>;

export const HistoricalEvent = z.object({
  timestamp: ISODateString,
  event: NonEmptyString,
  impact_on_story: ImpactLevel,
  related_characters: z.array(UUIDString),
  beat_index: z.number().int().optional(),
  location_id: UUIDString.optional()
});

export type HistoricalEvent = z.infer<typeof HistoricalEvent>;

export const Character = z.object({
  id: UUIDString,
  world_id: UUIDString,
  user_id: UUIDString.nullable(),
  
  // Core attributes
  name: NonEmptyString.min(2).max(120),
  type: CharacterType,
  status: CharacterStatus,
  story_role: StoryRole,
  
  // Personality & beliefs
  personality_traits: z.array(z.string()),
  core_beliefs: z.array(z.string()),
  goals: z.array(z.string()),
  fears: z.array(z.string()),
  
  // Affiliations
  faction_id: UUIDString.nullable(),
  home_location_id: UUIDString.nullable(),
  current_location_id: UUIDString.nullable(),
  
  // Story tracking
  story_beats_witnessed: z.array(z.number().int()),
  reputation_tags: z.array(z.string()),
  historical_events: z.array(HistoricalEvent),
  
  // Dates
  date_of_birth: ISODateString.nullable(),
  date_of_death: ISODateString.nullable(),
  
  // Metadata
  appearance_description: z.string().nullable(),
  backstory: z.string().nullable(),
  voice_description: z.string().nullable(),
  
  // Timestamps
  created_at: ISODateString,
  updated_at: ISODateString,
  last_active_at: ISODateString
});

export type Character = z.infer<typeof Character>;

export const CreateCharacter = Character.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_active_at: true,
  historical_events: true,
  story_beats_witnessed: true,
  reputation_tags: true
});

export type CreateCharacter = z.infer<typeof CreateCharacter>;

export const UpdateCharacter = Character.partial().omit({
  id: true,
  world_id: true,
  created_at: true
});

export type UpdateCharacter = z.infer<typeof UpdateCharacter>;

export const CharacterRelation = z.object({
  id: UUIDString,
  world_id: UUIDString,
  character_id: UUIDString,
  target_character_id: UUIDString,
  relationship_type: RelationshipType,
  sentiment: z.number().min(-100).max(100),
  description: z.string(),
  established_at: ISODateString,
  last_interaction: ISODateString
});

export type CharacterRelation = z.infer<typeof CharacterRelation>;

export const CreateCharacterRelation = CharacterRelation.omit({
  id: true,
  established_at: true,
  last_interaction: true
});

export type CreateCharacterRelation = z.infer<typeof CreateCharacterRelation>;

export const PersonalityUpdate = z.object({
  personality_traits: z.array(z.string()).optional(),
  core_beliefs: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  fears: z.array(z.string()).optional()
});

export type PersonalityUpdate = z.infer<typeof PersonalityUpdate>;

export const SpawnContext = z.object({
  world_id: UUIDString,
  faction_id: UUIDString.optional(),
  location_id: UUIDString.optional(),
  count: z.number().int().min(1).max(10),
  role_focus: StoryRole.optional(),
  context: z.string()
});

export type SpawnContext = z.infer<typeof SpawnContext>;

export const EnrichmentContext = z.object({
  world_theme: z.string(),
  faction_ideology: z.string().optional(),
  location_description: z.string().optional(),
  recent_events: z.array(z.string())
});

export type EnrichmentContext = z.infer<typeof EnrichmentContext>;