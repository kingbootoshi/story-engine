/**
 * @file formatCharacterContext.ts
 * Utility for converting character entities into a concise markdown description that can be injected
 * into AI prompts. The formatter preserves essential narrative information – name, role, status,
 * key traits and motivations – without leaking spoilers or overwhelming the prompt token budget.
 *
 * The output is a bullet-point list so that prompts can embed it under a heading like
 * "CURRENT WORLD CHARACTERS:" with no further transformation.
 */

import type { Character } from '../../modules/character/domain/schema';
import type { Faction } from '../../modules/faction/domain/schema';

/**
 * Converts an array of characters into a bullet-point markdown list for AI consumption.
 *
 * Each entry follows the pattern:
 *   - **Name** (role, status): Description
 *     TRAITS: [trait1, …]  │  MOTIVATIONS: [motivation1, …]
 *
 * The description is truncated to 160 characters to keep lines short inside prompts. The truncation
 * adds an ellipsis character when necessary.
 *
 * @param characters – Existing characters within the world
 * @param factions – Existing factions within the world
 * @returns Markdown list or fallback string when the world has no characters yet
 */
export function formatCharactersForAI(
  characters: Character[],
  factions: Faction[] = []
): string {
  if (!characters || characters.length === 0) {
    return 'No characters currently exist in this world.';
  }

  // Build quick look-up map once.
  const factionMap = new Map<string, string>();
  factions.forEach((f) => factionMap.set(f.id, f.name));

  return characters
    .map((c) => {
      const factionName = c.faction_id ? factionMap.get(c.faction_id) ?? 'Unknown Faction' : 'Unaffiliated';

      // Keep descriptions concise to avoid token bloat, but include the full background.
      const shortDesc = c.description.length > 160 ? `${c.description.slice(0, 157)}…` : c.description;

      const traits = c.personality_traits.length > 0 ? c.personality_traits.join(', ') : 'N/A';
      const motivations = c.motivations.length > 0 ? c.motivations.join(', ') : 'N/A';

      return [
        `- **${c.name}**`,
        `  Faction: ${factionName}`,
        `  Story Role: ${c.story_role}`,
        `  Status: ${c.status}`,
        `  Description: ${shortDesc}`,
        `  Background: ${c.background}`,
        `  Personality Traits: [${traits}]`,
        `  Motivations: [${motivations}]`,
      ].join('\n');
    })
    .join('\n');
} 