import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger';

const logger = createLogger('supabase.service');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

logger.info('Initializing Supabase client', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface World {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  current_arc_id?: string;
  metadata?: Record<string, any>;
}

export interface WorldArc {
  id: string;
  world_id: string;
  arc_number: number;
  story_name: string;
  story_idea: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  completed_at?: string;
  summary?: string;
  metadata?: Record<string, any>;
}

export interface WorldBeat {
  id: string;
  arc_id: string;
  beat_index: number;
  beat_type: 'anchor' | 'dynamic';
  beat_name: string;
  description: string;
  world_directives: string[];
  emergent_storylines: string[];
  created_at: string;
  metadata?: Record<string, any>;
}

export interface WorldEvent {
  id: string;
  world_id: string;
  arc_id?: string;
  beat_id?: string;
  event_type: 'player_action' | 'system_event' | 'environmental' | 'social';
  description: string;
  impact_level: 'minor' | 'moderate' | 'major' | 'catastrophic';
  affected_regions?: string[];
  created_at: string;
  metadata?: Record<string, any>;
}

export class SupabaseService {
  // World Management
  async createWorld(name: string, description: string): Promise<World> {
    logger.info('Creating new world', { name });
    
    const { data, error } = await supabase
      .from('worlds')
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      logger.logDBOperation('INSERT', 'worlds', { name, description }, null, error);
      throw error;
    }
    
    logger.logDBOperation('INSERT', 'worlds', { name, description }, data);
    return data;
  }

  async getWorld(id: string): Promise<World | null> {
    logger.debug('Fetching world', { id });
    
    try {
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        logger.logDBOperation('SELECT', 'worlds', { id }, null, error);
        throw error;
      }
      
      if (!data) {
        logger.debug('World not found', { id });
      }
      
      return data;
    } catch (error) {
      logger.logDBOperation('SELECT', 'worlds', { id }, null, error);
      throw error;
    }
  }

  async updateWorld(id: string, updates: Partial<World>): Promise<World> {
    const { data, error } = await supabase
      .from('worlds')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Arc Management
  async createArc(worldId: string, storyName: string, storyIdea: string): Promise<WorldArc> {
    // Get the next arc number
    const { data: existingArcs } = await supabase
      .from('world_arcs')
      .select('arc_number')
      .eq('world_id', worldId)
      .order('arc_number', { ascending: false })
      .limit(1);

    const arcNumber = existingArcs && existingArcs.length > 0 ? existingArcs[0].arc_number + 1 : 1;

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

    if (error) throw error;

    // Update world's current arc
    await this.updateWorld(worldId, { current_arc_id: data.id });

    return data;
  }

  async getArc(id: string): Promise<WorldArc | null> {
    const { data, error } = await supabase
      .from('world_arcs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
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

    if (error) throw error;
    return data || [];
  }

  async completeArc(id: string, summary: string): Promise<WorldArc> {
    const { data, error } = await supabase
      .from('world_arcs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        summary
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Beat Management
  async createBeat(
    arcId: string,
    beatIndex: number,
    beatType: 'anchor' | 'dynamic',
    beatData: {
      beatName: string;
      description: string;
      worldDirectives: string[];
      emergentStorylines: string[];
    }
  ): Promise<WorldBeat> {
    const { data, error } = await supabase
      .from('world_beats')
      .insert({
        arc_id: arcId,
        beat_index: beatIndex,
        beat_type: beatType,
        beat_name: beatData.beatName,
        description: beatData.description,
        world_directives: beatData.worldDirectives,
        emergent_storylines: beatData.emergentStorylines
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getArcBeats(arcId: string): Promise<WorldBeat[]> {
    const { data, error } = await supabase
      .from('world_beats')
      .select('*')
      .eq('arc_id', arcId)
      .order('beat_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getLatestBeat(arcId: string): Promise<WorldBeat | null> {
    const { data, error } = await supabase
      .from('world_beats')
      .select('*')
      .eq('arc_id', arcId)
      .order('beat_index', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Event Management
  async createEvent(event: Omit<WorldEvent, 'id' | 'created_at'>): Promise<WorldEvent> {
    const { data, error } = await supabase
      .from('world_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getRecentEvents(worldId: string, limit: number = 10): Promise<WorldEvent[]> {
    const { data, error } = await supabase
      .from('world_events')
      .select('*')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getEventsSinceDate(worldId: string, since: Date): Promise<WorldEvent[]> {
    const { data, error } = await supabase
      .from('world_events')
      .select('*')
      .eq('world_id', worldId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export default new SupabaseService();