import type { WorldEvent } from '../../modules/world/domain/schema';

/**
 * Format a world event into a human-readable string.
 * @param event - The world event to format
 * @returns Formatted string like "[MAJOR • 2024-01-01] Event description"
 */
export function formatEvent(event: WorldEvent): string {
  const date = new Date(event.created_at).toISOString().split('T')[0];
  return `[${event.impact_level.toUpperCase()} • ${date}] ${event.description}`;
}