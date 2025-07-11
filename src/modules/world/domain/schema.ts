import { z } from 'zod';
import { ISODateString } from '../../../shared/utils/validation';

// World entity
export const World = z.object({
  id: z.string().uuid(),
  /** Owner of this world – Supabase auth user id */
  user_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  current_arc_id: z.string().uuid().nullable().optional(),
  created_at: ISODateString,
  updated_at: ISODateString.nullable().optional()
});
export type World = z.infer<typeof World>;

// Arc entity
export const WorldArc = z.object({
  id: z.string().uuid(),
  world_id: z.string().uuid(),
  arc_number: z.number().int().positive(),
  story_name: z.string(),
  story_idea: z.string(),
  status: z.enum(['active', 'completed']),
  summary: z.string().nullable().optional(),
  detailed_description: z.string().default('').optional(),
  current_beat_id: z.string().uuid().nullable().optional(),
  created_at: ISODateString,
  completed_at: ISODateString.nullable().optional()
});
export type WorldArc = z.infer<typeof WorldArc>;

// Beat entity
export const WorldBeat = z.object({
  id: z.string().uuid(),
  arc_id: z.string().uuid(),
  beat_index: z.number().int().min(0).max(14),
  beat_type: z.enum(['anchor', 'dynamic']),
  beat_name: z.string(),
  description: z.string(),
  world_directives: z.array(z.string()),
  emergent_storylines: z.array(z.string()),
  created_at: ISODateString
});
export type WorldBeat = z.infer<typeof WorldBeat>;

// Event entity
export const WorldEvent = z.object({
  id: z.string().uuid(),
  world_id: z.string().uuid(),
  /** Arc and beat will be auto-resolved by the backend to the *current* beat */
  arc_id: z.string().uuid(),
  beat_id: z.string().uuid(),
  event_type: z.enum(['player_action', 'system_event', 'world_event']),
  description: z.string(),
  impact_level: z.enum(['minor', 'moderate', 'major']),
  created_at: ISODateString
});
export type WorldEvent = z.infer<typeof WorldEvent>;

// Input DTOs
export const CreateWorld = World.pick({
  name: true,
  description: true
});
export type CreateWorld = z.infer<typeof CreateWorld>;

export const CreateArc = WorldArc.pick({
  world_id: true,
  story_name: true,
  story_idea: true
});
export type CreateArc = z.infer<typeof CreateArc>;

export const CreateBeat = WorldBeat.omit({
  id: true,
  created_at: true
});
export type CreateBeat = z.infer<typeof CreateBeat>;

export const CreateEvent = WorldEvent.omit({
  id: true,
  created_at: true
});
export type CreateEvent = z.infer<typeof CreateEvent>;