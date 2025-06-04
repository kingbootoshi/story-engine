import { supabase } from '../../../core/infra/supabase';
import { createLogger } from '../../../core/infra/logger';
import type { World, WorldArc, WorldBeat, WorldEvent, CreateWorldSchema, CreateBeatSchema, CreateEventSchema } from './schema';
import { z } from 'zod';

const logger = createLogger('world.repo');

export async function createWorld(data: z.infer<typeof CreateWorldSchema>): Promise<World> {
  logger.info('Creating world', { name: data.name });
  const { data: row, error } = await supabase
    .from('worlds')
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create world', error);
    throw error;
  }

  logger.success('World created', { id: row.id });
  return row;
}

export async function getWorld(id: string): Promise<World | null> {
  const { data, error } = await supabase
    .from('worlds')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to get world', error, { worldId: id });
    throw error;
  }
  
  return data;
}

export async function updateWorld(id: string, updates: Partial<World>): Promise<World> {
  const { data, error } = await supabase
    .from('worlds')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    logger.error('Failed to update world', error, { worldId: id });
    throw error;
  }
  
  return data;
}

export async function listWorlds(): Promise<World[]> {
  const { data, error } = await supabase
    .from('worlds')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    logger.error('Failed to list worlds', error);
    throw error;
  }
  
  return data || [];
}

export async function createArc(worldId: string, storyName: string, storyIdea: string): Promise<WorldArc> {
  logger.info('Creating arc', { worldId, storyName });
  
  const { data: maxArc } = await supabase
    .from('world_arcs')
    .select('arc_number')
    .eq('world_id', worldId)
    .order('arc_number', { ascending: false })
    .limit(1)
    .single();
    
  const arcNumber = maxArc ? maxArc.arc_number + 1 : 1;
  
  const { data, error } = await supabase
    .from('world_arcs')
    .insert({
      world_id: worldId,
      arc_number: arcNumber,
      story_name: storyName,
      story_idea: storyIdea,
      status: 'active'
    })
    .select()
    .single();
    
  if (error) {
    logger.error('Failed to create arc', error, { worldId });
    throw error;
  }
  
  logger.success('Arc created', { arcId: data.id, arcNumber });
  return data;
}

export async function getArc(arcId: string): Promise<WorldArc | null> {
  const { data, error } = await supabase
    .from('world_arcs')
    .select('*')
    .eq('id', arcId)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to get arc', error, { arcId });
    throw error;
  }
  
  return data;
}

export async function getWorldArcs(worldId: string): Promise<WorldArc[]> {
  const { data, error } = await supabase
    .from('world_arcs')
    .select('*')
    .eq('world_id', worldId)
    .order('arc_number', { ascending: true });
    
  if (error) {
    logger.error('Failed to get world arcs', error, { worldId });
    throw error;
  }
  
  return data || [];
}

export async function completeArc(arcId: string, summary: string): Promise<void> {
  const { error } = await supabase
    .from('world_arcs')
    .update({
      status: 'completed',
      summary,
      completed_at: new Date().toISOString()
    })
    .eq('id', arcId);
    
  if (error) {
    logger.error('Failed to complete arc', error, { arcId });
    throw error;
  }
}

export async function createBeat(arcId: string, beatIndex: number, beatType: 'anchor' | 'dynamic', data: Omit<z.infer<typeof CreateBeatSchema>, 'arc_id' | 'beat_index' | 'beat_type'>): Promise<WorldBeat> {
  logger.info('Creating beat', { arcId, beatIndex, beatType });
  
  const beatData = {
    arc_id: arcId,
    beat_index: beatIndex,
    beat_type: beatType,
    beat_name: data.beat_name,
    description: data.description,
    world_directives: data.world_directives,
    emergent_storylines: data.emergent_storylines
  };
  
  const { data: beat, error } = await supabase
    .from('world_beats')
    .insert(beatData)
    .select()
    .single();
    
  if (error) {
    logger.error('Failed to create beat', error, { arcId, beatIndex });
    throw error;
  }
  
  logger.success('Beat created', { beatId: beat.id, beatIndex });
  return beat;
}

export async function getArcBeats(arcId: string): Promise<WorldBeat[]> {
  const { data, error } = await supabase
    .from('world_beats')
    .select('*')
    .eq('arc_id', arcId)
    .order('beat_index', { ascending: true });
    
  if (error) {
    logger.error('Failed to get arc beats', error, { arcId });
    throw error;
  }
  
  return data || [];
}

export async function createEvent(event: z.infer<typeof CreateEventSchema>): Promise<WorldEvent> {
  logger.info('Creating event', { worldId: event.world_id, type: event.event_type });
  
  const { data, error } = await supabase
    .from('world_events')
    .insert(event)
    .select()
    .single();
    
  if (error) {
    logger.error('Failed to create event', error, { worldId: event.world_id });
    throw error;
  }
  
  return data;
}

export async function getRecentEvents(worldId: string, limit: number = 20): Promise<WorldEvent[]> {
  const { data, error } = await supabase
    .from('world_events')
    .select('*')
    .eq('world_id', worldId)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    logger.error('Failed to get recent events', error, { worldId });
    throw error;
  }
  
  return data || [];
} 