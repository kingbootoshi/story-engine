import { injectable } from 'tsyringe';
import { supabase } from '../../../../core/infra/supabase';
import { createLogger } from '../../../../core/infra/logger';
import type { IFactionRepository } from '../../domain/ports';
import type { 
  Faction, 
  CreateFaction, 
  UpdateFaction, 
  FactionRelation,
  DiplomaticStance,
  HistoricalEvent
} from '../../domain/schema';

const repoLog = createLogger('faction.repo');

@injectable()
export class SupabaseFactionRepo implements IFactionRepository {
  async create(faction: CreateFaction): Promise<Faction> {
    repoLog.info('Creating faction', { 
      name: faction.name, 
      worldId: faction.world_id,
      status: faction.status 
    });
    
    const { data: row, error } = await supabase
      .from('factions')
      .insert({
        ...faction,
        historical_events: []
      })
      .select()
      .single();

    if (error) {
      repoLog.error('Failed to create faction', error);
      throw error;
    }

    repoLog.success('Faction created', { id: row.id, name: row.name });
    return row;
  }

  async update(id: string, updates: UpdateFaction): Promise<Faction> {
    repoLog.info('Updating faction', { id, updates });
    
    const { data, error } = await supabase
      .from('factions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      repoLog.error('Failed to update faction', error, { factionId: id });
      throw error;
    }
    
    return data;
  }

  async findById(id: string): Promise<Faction | null> {
    const { data, error } = await supabase
      .from('factions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      repoLog.error('Failed to get faction', error, { factionId: id });
      throw error;
    }
    
    return data;
  }

  async findByWorldId(worldId: string): Promise<Faction[]> {
    const { data, error } = await supabase
      .from('factions')
      .select('*')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false });
      
    if (error) {
      repoLog.error('Failed to list factions', error, { worldId });
      throw error;
    }
    
    return data || [];
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('factions')
      .delete()
      .eq('id', id);
      
    if (error) {
      repoLog.error('Failed to delete faction', error, { factionId: id });
      throw error;
    }
  }

  async addHistoricalEvent(id: string, event: HistoricalEvent): Promise<void> {
    const faction = await this.findById(id);
    if (!faction) {
      throw new Error(`Faction ${id} not found`);
    }

    const updatedEvents = [...faction.historical_events, event];
    
    const { error } = await supabase
      .from('factions')
      .update({ historical_events: updatedEvents })
      .eq('id', id);
      
    if (error) {
      repoLog.error('Failed to add historical event', error, { factionId: id });
      throw error;
    }
  }

  async setRelation(
    sourceId: string, 
    targetId: string, 
    stance: DiplomaticStance, 
    worldId: string
  ): Promise<void> {
    repoLog.info('Setting faction relation', { sourceId, targetId, stance });
    
    const { error } = await supabase
      .from('faction_relations')
      .upsert({
        world_id: worldId,
        source_id: sourceId,
        target_id: targetId,
        stance: stance,
        last_changed: new Date().toISOString()
      }, {
        onConflict: 'source_id,target_id'
      });
      
    if (error) {
      repoLog.error('Failed to set faction relation', error);
      throw error;
    }
  }

  async getRelations(factionId: string): Promise<FactionRelation[]> {
    const { data, error } = await supabase
      .from('faction_relations')
      .select('*')
      .or(`source_id.eq.${factionId},target_id.eq.${factionId}`);
      
    if (error) {
      repoLog.error('Failed to get faction relations', error, { factionId });
      throw error;
    }
    
    return data || [];
  }

  async getRelation(sourceId: string, targetId: string): Promise<FactionRelation | null> {
    const { data, error } = await supabase
      .from('faction_relations')
      .select('*')
      .eq('source_id', sourceId)
      .eq('target_id', targetId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      repoLog.error('Failed to get faction relation', error, { sourceId, targetId });
      throw error;
    }
    
    return data;
  }
}