import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import type { World } from '../types/world.types';
import type { WorldBeat } from '../types/beat.types';
import { createLogger } from './logger';

// Supabase client is a singleton across the app.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

const log = createLogger(__filename);

// Typed table shortcuts (helps with intellisense) -----------------------------
export const db = {
  // Use non-generic `from` calls to avoid mismatched type arguments while
  // keeping the API surface small and readable. We still get typed responses
  // from the subsequent `select().single()` calls because we cast later.
  worlds: () => supabase.from('worlds'),
  arcs: () => supabase.from('world_arcs'),
  beats: () => supabase.from('world_beats'),
  // Future-proofing: add additional tables below as needed
};

// Thin repository-style helpers ----------------------------------------------
export async function createWorld(name: string, description: string): Promise<World> {
  log.info('DB create world', { name });
  const { data, error } = await db.worlds()
    // Supabase type generator isn't available here, so we cast to `any` to bypass
    // the strict `Insert<T>` requirement.  This keeps compile-time friction low
    // until we adopt a full Database schema type.
    .insert({ name, description } as any)
    .select()
    .single();
  if (error) throw error;
  log.success('World created', { id: data.id });
  return data;
}

export async function getWorld(id: string): Promise<World | null> {
  const { data, error } = await db.worlds().select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function getArcBeats(arcId: string): Promise<WorldBeat[]> {
  const { data, error } = await db.beats()
    .select('*')
    .eq('arc_id', arcId)
    .order('beat_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ... (other helpers can be progressively migrated) 