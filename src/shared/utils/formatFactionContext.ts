/**
 * @file formatFactionContext.ts
 * Utility for converting faction entities into a concise markdown description that can be injected
 * into AI prompts. We purposefully keep **all** data points that may influence macro-level world
 * generation – name, ideology, status, member estimate and tags – while avoiding player-specific
 * spoilers or confidential metadata.
 *
 * The formatter produces a bullet list so that prompts can simply embed it under a heading like
 * "CURRENT WORLD FACTIONS:" without additional transformation.
 */
import type { Faction } from '../../modules/faction/domain/schema';

/**
 * Converts an array of factions into a bullet-point markdown list for AI consumption.
 *
 * @param factions – Existing factions within the world
 * @returns Markdown list or fallback string when the world has no factions yet
 */
export function formatFactionsForAI(factions: Faction[]): string {
  if (!factions || factions.length === 0) {
    return 'No factions currently exist in this world.';
  }

  return factions
    .map(f => {
      const tagsSection = f.tags && f.tags.length > 0 ? ` [${f.tags.join(', ')}]` : '';
      return `- **${f.name}** (${f.status}, ≈${f.members_estimate} members): ${f.ideology}${tagsSection}`;
    })
    .join('\n');
} 