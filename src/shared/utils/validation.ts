import { z } from 'zod';

/**
 * A date string validator that accommodates real-world Postgres/Supabase timestamp formats.
 * 
 * **Why this exists:**
 * Zod's built-in `z.string().datetime()` uses a strict RFC-3339 regex that REJECTS the 
 * `+00` timezone suffix (without `:00`) that Postgres/Supabase commonly emits.
 * 
 * **Examples of formats this accepts:**
 * - `2025-06-06T12:38:07.387093+00` ✅ (Postgres default)
 * - `2025-06-06T12:38:07.387Z` ✅ (ISO standard)
 * - `2025-06-06T12:38:07+00:00` ✅ (RFC-3339 compliant)
 * - `2025-06-06T12:38:07` ✅ (no timezone)
 * - `not-a-date` ❌ (invalid)
 * 
 * **Usage in module schemas:**
 * ```ts
 * import { ISODateString } from '../../../shared/utils/validation';
 * 
 * export const MyEntity = z.object({
 *   id: z.string().uuid(),
 *   created_at: ISODateString,
 *   updated_at: ISODateString.optional()
 * });
 * ```
 * 
 * This keeps type safety while preventing "Output validation failed" errors when 
 * tRPC procedures return entities with timestamp fields from the database.
 */
export const ISODateString = z.string().refine(
  (val) => !Number.isNaN(Date.parse(val)), 
  { message: 'Invalid ISO date string' }
);

/**
 * UUID string validator with descriptive error message.
 * Prefer this over `z.string().uuid()` for better DX.
 */
export const UUIDString = z.string().uuid('Expected valid UUID format');

/**
 * Non-empty string validator that trims whitespace.
 * Useful for required text fields like names, descriptions, etc.
 */
export const NonEmptyString = z.string().trim().min(1, 'Field cannot be empty');

/**
 * Positive integer validator.
 * Common for indexes, counts, pagination limits, etc.
 */
export const PositiveInt = z.number().int().positive('Must be a positive integer');

/**
 * Optional string that converts empty strings to null.
 * Useful for database fields that should be NULL instead of empty strings.
 */
export const OptionalNullableString = z.string().optional().transform(val => val === '' ? null : val); 