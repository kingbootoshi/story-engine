import type { Character } from '../../modules/character/domain/schema';

/**
 * @file resolveCharacterIdentifier.ts
 * Utility for resolving character identifiers coming from AI suggestions.
 *
 * The AI may reference characters by their *name* rather than the canonical
 * UUID stored in the database. This helper converts such free-form identifiers
 * into their corresponding UUID so that downstream service calls can operate
 * reliably.
 *
 * Strategy:
 *   1. If the identifier already matches the UUID v4 format, return it as-is.
 *   2. Otherwise perform a **case-insensitive** lookup against the provided
 *      character collection and return the matching `id`.
 *   3. If no match is found, `null` is returned — letting the caller decide how
 *      to handle the unknown reference (e.g. log & skip vs. throw).
 *
 * NOTE: We intentionally avoid fuzzy matching for determinism. Prompts should
 * include exact names when referring to existing characters. If we introduce
 * human input in the future we can revisit this algorithm.
 */

/** Pre-compiled UUID v4 regex (case-insensitive). */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check whether a given string adheres to the UUID v4 format.
 */
function isUuid(candidate: string): boolean {
  return UUID_V4_REGEX.test(candidate);
}

/**
 * Resolve a character identifier (UUID or display name) to its UUID.
 *
 * @param identifier – The character UUID or its display name.
 * @param characters – Collection of characters available for name → id mapping.
 * @returns The resolved UUID string or `null` when no match is found.
 */
export function resolveCharacterIdentifier(
  identifier: string,
  characters: Character[]
): string | null {
  // Fast path: already a UUID → return unchanged.
  if (isUuid(identifier)) return identifier;

  // Otherwise attempt a case-insensitive name lookup.
  const match = characters.find(
    (c) => c.name.toLowerCase() === identifier.trim().toLowerCase()
  );

  return match ? match.id : null;
} 