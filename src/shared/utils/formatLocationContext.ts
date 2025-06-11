import type { Location } from '../../modules/location/domain/schema';

/**
 * Formats an array of locations into a markdown string for AI context.
 * @param locations - The array of locations to format.
 * @returns A formatted markdown string.
 */
export function formatLocationsForAI(locations: Location[]): string {
  if (!locations || locations.length === 0) {
    return 'No locations currently exist in this world.';
  }

  return locations
    .map(loc => {
      // Compose a bullet entry that contains the full description and, when present,
      // an explicit tag list in the format: "TAGS: [tag1, tag2]".  We purposely avoid
      // truncating the description because downstream world-level AI prompts rely on
      // complete semantic context.  Line breaks preserve readability while keeping
      // the entire entry a single markdown list item.

      const tagsSection = loc.tags && loc.tags.length > 0
        ? `\n  TAGS: [${loc.tags.join(', ')}]`
        : '';

      return `- **[${loc.type}] ${loc.name} (${loc.status}):** ${loc.description}${tagsSection}`;
    })
    .join('\n');
}