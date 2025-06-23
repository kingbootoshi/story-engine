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
 * @returns Markdown list or fallback string when the world has no characters yet
 */
export function formatCharactersForAI(characters: Character[]): string {
  if (!characters || characters.length === 0) {
    return 'No characters currently exist in this world.';
  }

  return characters
    .map((c) => {
      const desc = c.description.length > 160
        ? `${c.description.slice(0, 157)}…`
        : c.description;

      const traits = c.personality_traits.length > 0 ? c.personality_traits.join(', ') : 'N/A';
      const motivations = c.motivations.length > 0 ? c.motivations.join(', ') : 'N/A';

      return `- **${c.name}** (${c.story_role}, ${c.status}): ${desc}\n  TRAITS: [${traits}]  │  MOTIVATIONS: [${motivations}]`;
    })
    .join('\n');
} 