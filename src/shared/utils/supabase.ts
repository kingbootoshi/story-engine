// Re-export from core infrastructure for backward compatibility
export { supabase } from '../../core/infra/supabase';

// Import types from modules where they belong
import type { World } from '../../modules/world/backend/schema';
import type { WorldBeat } from '../../modules/world/backend/schema';

// Re-export types for backward compatibility
export type { World, WorldBeat };

// Legacy helper functions - these should be imported from world module instead
import { createLogger } from '../../core/infra/logger';
import { supabase } from '../../core/infra/supabase';

const log = createLogger('supabase-legacy');

// Typed table shortcuts (helps with intellisense) -----------------------------
export const db = {
  worlds: () => supabase.from('worlds'),
  arcs: () => supabase.from('world_arcs'),
  beats: () => supabase.from('world_beats'),
};

// Deprecated: Use world module repository instead
export async function createWorld(name: string, description: string): Promise<World> {
  log.warn('Using deprecated createWorld from shared/utils. Use world module instead.');
  const { data, error } = await db.worlds()
    .insert({ name, description } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getWorld(id: string): Promise<World | null> {
  log.warn('Using deprecated getWorld from shared/utils. Use world module instead.');
  const { data, error } = await db.worlds().select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function getArcBeats(arcId: string): Promise<WorldBeat[]> {
  log.warn('Using deprecated getArcBeats from shared/utils. Use world module instead.');
  const { data, error } = await db.beats()
    .select('*')
    .eq('arc_id', arcId)
    .order('beat_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
} 