import { z } from 'zod';

export const WorldSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  current_arc_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});

export const WorldArcSchema = z.object({
  id: z.string().uuid(),
  world_id: z.string().uuid(),
  arc_number: z.number().int().positive(),
  story_name: z.string(),
  story_idea: z.string(),
  status: z.enum(['active', 'completed']),
  summary: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable().optional()
});

export const WorldBeatSchema = z.object({
  id: z.string().uuid(),
  arc_id: z.string().uuid(),
  beat_index: z.number().int().min(0).max(14),
  beat_type: z.enum(['anchor', 'dynamic']),
  beat_name: z.string(),
  description: z.string(),
  world_directives: z.array(z.string()),
  emergent_storylines: z.array(z.string()),
  created_at: z.string().datetime()
});

export const WorldEventSchema = z.object({
  id: z.string().uuid(),
  world_id: z.string().uuid(),
  arc_id: z.string().uuid().nullable().optional(),
  beat_id: z.string().uuid().nullable().optional(),
  event_type: z.enum(['player_action', 'system_event', 'world_event']),
  description: z.string(),
  impact_level: z.enum(['minor', 'moderate', 'major']),
  created_at: z.string().datetime()
});

export type World = z.infer<typeof WorldSchema>;
export type WorldArc = z.infer<typeof WorldArcSchema>;
export type WorldBeat = z.infer<typeof WorldBeatSchema>;
export type WorldEvent = z.infer<typeof WorldEventSchema>;

export const CreateWorldSchema = WorldSchema.pick({
  name: true,
  description: true
});

export const CreateArcSchema = WorldArcSchema.pick({
  world_id: true,
  story_name: true,
  story_idea: true
});

export const CreateBeatSchema = WorldBeatSchema.omit({
  id: true,
  created_at: true
});

export const CreateEventSchema = WorldEventSchema.omit({
  id: true,
  created_at: true
});