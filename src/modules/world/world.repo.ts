import { supabase } from '../../shared/utils/supabase';
import type { World } from '../../shared/types/world.types';
import { log } from '../../shared/utils/logger';

export async function create(data: Pick<World, 'name' | 'description'>): Promise<World> {
  const { data: rows, error } = await supabase
    .from('worlds')
    .insert(data)
    .select()
    .single();

  if (error) {
    log.error('DB insert failed', error);
    throw error;
  }

  const world: World = {
    id: rows.id,
    name: rows.name,
    description: rows.description,
    createdAt: rows.created_at,
    updatedAt: rows.updated_at,
    currentArcId: rows.current_arc_id ?? undefined,
  };

  return world;
} 