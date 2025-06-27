import { z } from 'zod';

export interface AIMetadata {
  module: string;        // REQUIRED – e.g. "world"
  prompt_id: string;     // REQUIRED – e.g. "generate_world_arc_anchors"
  user_id: string;       // REQUIRED – authenticated user's Supabase UUID
  [key: string]: any;    // optional correlation keys
}

export function buildMetadata(
  module: string,
  prompt_id: string,
  user_id: string,
  extra: Record<string, any> = {}
): AIMetadata {
  return {
    module,
    prompt_id,
    user_id,
    ...extra
  };
}

/**
 * Runtime validation schema for AI metadata objects.
 *
 * – `module`     Name of the calling module (e.g. "world", "location")
 * – `prompt_id`  Descriptive id of the prompt variant (e.g. "generate_world_arc_anchors")
 * – `user_id`    Authenticated user's Supabase UUID for usage tracking
 *
 * All additional keys are accepted and *must* be JSON-serialisable so they can be
 * forwarded to the logger and external tracing back-ends.
 */
export const AIMetadataSchema = z.object({
  module: z.string().min(1, 'metadata.module is required and must be non-empty'),
  prompt_id: z.string().min(1, 'metadata.prompt_id is required and must be non-empty'),
  user_id: z.string().uuid('metadata.user_id must be a valid UUID'),
}).catchall(z.any());

/**
 * Helper that validates an arbitrary value against {@link AIMetadataSchema} and
 * returns the parsed result so the caller can rely on the required fields being
 * present.
 *
 * @throws ZodError when validation fails.
 */
export function validateMetadata(meta: unknown): AIMetadata {
  return AIMetadataSchema.parse(meta) as AIMetadata;
}