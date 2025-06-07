import { injectable } from 'tsyringe';
import { supabase } from '../../../../core/infra/supabase';
import { createLogger } from '../../../../core/infra/logger';
import type { WorldRepo } from '../../domain/ports';
import type { World, WorldArc, WorldBeat, WorldEvent, CreateEvent } from '../../domain/schema';

const repoLog = createLogger('world.repo');

@injectable()
export class SupabaseWorldRepo implements WorldRepo {
  async createWorld(data: { name: string; description: string; user_id?: string }): Promise<World> {
    repoLog.info('Creating world', { name: data.name, descLen: data.description.length });
    const { data: row, error } = await supabase
      .from('worlds')
      .insert(data)
      .select()
      .single();

    if (error) {
      repoLog.error('Failed to create world', error);
      throw error;
    }

    repoLog.success('World created', { id: row.id });
    return row;
  }

  async getWorld(id: string): Promise<World | null> {
    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      repoLog.error('Failed to get world', error, { worldId: id });
      throw error;
    }
    
    return data;
  }

  async updateWorld(id: string, updates: Partial<World>): Promise<void> {
    const { error } = await supabase
      .from('worlds')
      .update(updates)
      .eq('id', id);
      
    if (error) {
      repoLog.error('Failed to update world', error, { worldId: id });
      throw error;
    }
  }

  async listWorlds(userId?: string): Promise<World[]> {
    let query = supabase.from('worlds').select('*').order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
      
    if (error) {
      repoLog.error('Failed to list worlds', error);
      throw error;
    }
    
    return data || [];
  }

  async createArc(worldId: string, storyName: string, storyIdea: string, detailedDescription?: string): Promise<WorldArc> {
    repoLog.info('Creating arc', { worldId, storyName });
    
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
        status: 'active',
        detailed_description: detailedDescription || ''
      })
      .select()
      .single();
      
    if (error) {
      repoLog.error('Failed to create arc', error, { worldId });
      throw error;
    }
    
    repoLog.success('Arc created', { arcId: data.id, arcNumber });
    return data;
  }

  async getArc(arcId: string): Promise<WorldArc | null> {
    const { data, error } = await supabase
      .from('world_arcs')
      .select('*')
      .eq('id', arcId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      repoLog.error('Failed to get arc', error, { arcId });
      throw error;
    }
    
    return data;
  }

  async getWorldArcs(worldId: string): Promise<WorldArc[]> {
    const { data, error } = await supabase
      .from('world_arcs')
      .select('*')
      .eq('world_id', worldId)
      .order('arc_number', { ascending: true });
      
    if (error) {
      repoLog.error('Failed to get world arcs', error, { worldId });
      throw error;
    }
    
    return data || [];
  }

  async completeArc(arcId: string, summary: string): Promise<void> {
    const { error } = await supabase
      .from('world_arcs')
      .update({
        status: 'completed',
        summary,
        completed_at: new Date().toISOString()
      })
      .eq('id', arcId);
      
    if (error) {
      repoLog.error('Failed to complete arc', error, { arcId });
      throw error;
    }
  }

  async createBeat(
    arcId: string,
    beatIndex: number,
    beatType: 'anchor' | 'dynamic',
    data: {
      beat_name: string;
      description: string;
      world_directives: string[];
      emergent_storylines: string[];
    }
  ): Promise<WorldBeat> {
    // ---------------------------------------------------------------------
    // Insert a new beat record for the given arc.  By contract we must only
    // update `world_arcs.current_beat_id` when we are (a) inserting the very
    // first *anchor* (index 0) or (b) inserting ANY *dynamic* beat.  All
    // subsequent anchor inserts (index 7, 14, ...) MUST **NOT** overwrite the
    // pointer, otherwise story progression would start from the wrong place.
    // ---------------------------------------------------------------------

    repoLog.info('insert beat', {
      arcId,
      beatIndex,
      beatType,
    });
    
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
      repoLog.error('Failed to create beat', error, { arcId, beatIndex });
      throw error;
    }
    
    // Decide whether we should shift the arc pointer according to the
    // business rule defined in 2025-06-07 contract amendment.
    const shouldSetCurrent =
      beatType === 'dynamic' || (beatType === 'anchor' && beatIndex === 0);

    repoLog.debug('Arc pointer condition', {
      arcId,
      beatIndex,
      beatType,
      shouldSetCurrent,
    });

    if (shouldSetCurrent) {
      const { error: updateError } = await supabase
        .from('world_arcs')
        .update({ current_beat_id: beat.id })
        .eq('id', arcId);

      if (updateError) {
        repoLog.error('Failed to update arc current_beat_id', updateError, {
          arcId,
          beatId: beat.id,
        });
        throw updateError;
      }

      repoLog.debug('Arc pointer updated', { arcId, beatId: beat.id });
    }
    
    repoLog.success('Beat created', { beatId: beat.id, beatIndex });
    return beat;
  }

  async getArcBeats(arcId: string): Promise<WorldBeat[]> {
    const { data, error } = await supabase
      .from('world_beats')
      .select('*')
      .eq('arc_id', arcId)
      .order('beat_index', { ascending: true });
      
    if (error) {
      repoLog.error('Failed to get arc beats', error, { arcId });
      throw error;
    }
    
    return data || [];
  }

  async createEvent(event: CreateEvent): Promise<WorldEvent> {
    repoLog.info('Creating event', { worldId: event.world_id, type: event.event_type });
    
    const { data, error } = await supabase
      .from('world_events')
      .insert(event)
      .select()
      .single();
      
    if (error) {
      repoLog.error('Failed to create event', error, { worldId: event.world_id });
      throw error;
    }
    
    return data;
  }

  async getRecentEvents(worldId: string, limit: number = 20): Promise<WorldEvent[]> {
    const { data, error } = await supabase
      .from('world_events')
      .select('*')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      repoLog.error('Failed to get recent events', error, { worldId });
      throw error;
    }
    
    return data || [];
  }

  /**
   * Returns every event attached to the provided beat.
   */
  async getBeatEvents(beatId: string): Promise<WorldEvent[]> {
    const { data, error } = await supabase
      .from('world_events')
      .select('*')
      .eq('beat_id', beatId)
      .order('created_at', { ascending: false });

    if (error) {
      repoLog.error('Failed to get events for beat', error, { beatId });
      throw error;
    }

    return data || [];
  }

  async getCurrentBeat(arcId: string): Promise<WorldBeat | null> {
    // First get the arc to find current_beat_id
    const { data: arc, error: arcError } = await supabase
      .from('world_arcs')
      .select('current_beat_id')
      .eq('id', arcId)
      .single();
      
    if (arcError) {
      if (arcError.code === 'PGRST116') return null;
      repoLog.error('Failed to get arc for current beat', arcError, { arcId });
      throw arcError;
    }
    
    if (!arc?.current_beat_id) return null;
    
    // Then get the beat
    const { data: beat, error: beatError } = await supabase
      .from('world_beats')
      .select('*')
      .eq('id', arc.current_beat_id)
      .single();
      
    if (beatError) {
      if (beatError.code === 'PGRST116') return null;
      repoLog.error('Failed to get current beat', beatError, { arcId, beatId: arc.current_beat_id });
      throw beatError;
    }
    
    return beat;
  }

  async getBeat(beatId: string): Promise<WorldBeat | null> {
    const { data, error } = await supabase
      .from('world_beats')
      .select('*')
      .eq('id', beatId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      repoLog.error('Failed to get beat', error, { beatId });
      throw error;
    }
    
    return data;
  }

  async getArcByWorld(worldId: string): Promise<WorldArc | null> {
    const { data, error } = await supabase
      .from('world_arcs')
      .select('*')
      .eq('world_id', worldId)
      .eq('status', 'active')
      .order('arc_number', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      repoLog.error('Failed to get active arc for world', error, { worldId });
      throw error;
    }
    
    return data;
  }
}