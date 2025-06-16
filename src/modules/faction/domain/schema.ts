import { z } from 'zod';
import { UUIDString, ISODateString, NonEmptyString } from '../../../shared/utils/validation';

export { UUIDString } from '../../../shared/utils/validation';

export const FactionStatus = z.enum(['rising', 'stable', 'declining', 'collapsed']);
export type FactionStatus = z.infer<typeof FactionStatus>;

export const DiplomaticStance = z.enum(['ally', 'neutral', 'hostile']);
export type DiplomaticStance = z.infer<typeof DiplomaticStance>;

export const HistoricalEvent = z.object({
  timestamp: ISODateString,
  event: NonEmptyString,
  previous_status: FactionStatus.optional(),
  beat_index: z.number().int().optional()
});

export type HistoricalEvent = z.infer<typeof HistoricalEvent>;

export const Faction = z.object({
  id: UUIDString,
  world_id: UUIDString,
  name: NonEmptyString.min(2).max(120),
  banner_color: z.string().regex(/^#?([0-9a-f]{6})$/i).nullable(),
  emblem_svg: z.string().nullable(),
  ideology: z.string(),
  status: FactionStatus,
  members_estimate: z.number().int().nonnegative(),
  home_location_id: UUIDString.nullable(),
  controlled_locations: z.array(UUIDString),
  tags: z.array(z.string()),
  historical_events: z.array(HistoricalEvent),
  created_at: ISODateString,
  updated_at: ISODateString
});

export type Faction = z.infer<typeof Faction>;

export const CreateFaction = Faction.omit({
  id: true,
  created_at: true,
  updated_at: true,
  historical_events: true
});

export type CreateFaction = z.infer<typeof CreateFaction>;

export const UpdateFaction = Faction.partial().omit({
  id: true,
  created_at: true
});

export type UpdateFaction = z.infer<typeof UpdateFaction>;

export const FactionRelation = z.object({
  id: UUIDString,
  world_id: UUIDString,
  source_id: UUIDString,
  target_id: UUIDString,
  stance: DiplomaticStance,
  last_changed: ISODateString
});

export type FactionRelation = z.infer<typeof FactionRelation>;