import type { Faction } from '../../modules/faction/domain/schema';

/**
 * @file resolveFactionIdentifier.ts
 * Utility for resolving faction identifiers passed from AI suggestions.
 *
 * The AI may reference factions by their *name* instead of the canonical UUID
 * stored in the database.  This helper converts a free-form identifier into the
 * correct UUID so that downstream service calls can operate reliably.
 *
 * Strategy:
 *   1. If the identifier already matches the UUID v4 format, return it as-is.
 *   2. Otherwise perform a **case-insensitive** lookup against the provided
 *      faction collection and return the matching `id`.
 *   3. If no match is found, `null` is returned so the caller can decide how to
 *      handle the unknown reference (e.g., log & skip vs. throw).
 *
 * Note: We purposefully avoid fuzzy matching to keep the logic deterministic –
 * AI prompts should include exact faction names when referring to them.  If we
 * introduce human input later we can revisit the algorithm.
 */

/** Pre-compiled UUID v4 regex (case-insensitive). */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check whether a string is a valid UUID (v4).
 */
function isUuid(candidate: string): boolean {
  return UUID_V4_REGEX.test(candidate);
}

/**
 * Resolve a faction identifier (UUID or name) to its UUID.
 *
 * @param identifier – Either the faction UUID or its display name.
 * @param factions – Collection of factions used for name → id mapping.
 * @returns UUID string when resolved or `null` when the identifier is unknown.
 */
export function resolveFactionIdentifier(
  identifier: string,
  factions: Faction[]
): string | null {
  // Fast path: already a UUID → return unchanged.
  if (isUuid(identifier)) return identifier;

  // Otherwise attempt a case-insensitive name lookup.
  const match = factions.find(
    (f) => f.name.toLowerCase() === identifier.trim().toLowerCase()
  );

  return match ? match.id : null;
} 