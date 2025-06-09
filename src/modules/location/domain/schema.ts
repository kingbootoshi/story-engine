import { z } from 'zod';
import { ISODateString, UUIDString, NonEmptyString } from '../../../shared/utils/validation';

/**
 * Re-export shared validators for convenience
 */
export { UUIDString } from '../../../shared/utils/validation';

/**
 * Enum for location types in the world
 */
export const LocationType = z.enum(['region', 'city', 'landmark', 'wilderness']);
export type LocationType = z.infer<typeof LocationType>;

/**
 * Enum for location status - represents the current state/health of a location
 */
export const LocationStatus = z.enum(['thriving', 'stable', 'declining', 'ruined', 'abandoned', 'lost']);
export type LocationStatus = z.infer<typeof LocationStatus>;

/**
 * Historical event schema - tracks significant changes to a location
 */
export const HistoricalEvent = z.object({
  timestamp: ISODateString,
  event: NonEmptyString,
  previous_status: LocationStatus.optional(),
  arc_id: UUIDString.optional(),
  beat_index: z.number().int().min(0).optional()
});
export type HistoricalEvent = z.infer<typeof HistoricalEvent>;

/**
 * Location entity schema
 */
export const Location = z.object({
  id: UUIDString,
  world_id: UUIDString,
  parent_location_id: UUIDString.nullable(),
  name: NonEmptyString.min(2).max(120),
  type: LocationType,
  status: LocationStatus,
  description: z.string(),
  tags: z.array(z.string()).default([]),
  historical_events: z.array(HistoricalEvent).default([]),
  last_significant_change: ISODateString.optional(),
  created_at: ISODateString,
  updated_at: ISODateString,
  /**
   * Relative X coordinate (0-100) used for map visualisation.
   * Stored as a simple numeric column to keep querying lightweight while
   * remaining easy to reconstruct a `RelativePosition` object on the client.
   */
  relative_x: z.number().min(0).max(100).nullable().optional().default(null),

  /**
   * Relative Y coordinate (0-100) used for map visualisation.
   * See `relative_x` for rationale on storage strategy.
   */
  relative_y: z.number().min(0).max(100).nullable().optional().default(null)
});
export type Location = z.infer<typeof Location>;

/**
 * Input schema for creating a location
 */
export const CreateLocation = Location.omit({
  id: true,
  created_at: true,
  updated_at: true,
  historical_events: true,
  last_significant_change: true
});
export type CreateLocation = z.infer<typeof CreateLocation>;

/**
 * Input schema for updating a location
 */
export const UpdateLocation = Location.omit({
  id: true,
  world_id: true,
  created_at: true
}).partial();
export type UpdateLocation = z.infer<typeof UpdateLocation>;

/**
 * Schema for relative position on a map (0-100 scale)
 */
export const RelativePosition = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100)
});
export type RelativePosition = z.infer<typeof RelativePosition>;

/**
 * Schema for location with map position (used during world generation)
 */
export const LocationWithPosition = CreateLocation.extend({
  parent_region_name: z.string().optional(),
  relative_position: RelativePosition
});
export type LocationWithPosition = z.infer<typeof LocationWithPosition>;