import { injectable } from 'tsyringe';
import { supabase } from '../../../../core/infra/supabase';
import { createLogger } from '../../../../core/infra/logger';
import type { ICharacterRepository } from '../../domain/ports';
import type { 
  Character, 
  CreateCharacter, 
  UpdateCharacter, 
  CharacterRelation,
  CreateCharacterRelation,
  HistoricalEvent,
  CharacterStatus
} from '../../domain/schema';

const repoLog = createLogger('character.repo');

@injectable()
export class SupabaseCharacterRepo implements ICharacterRepository {
  async create(character: CreateCharacter): Promise<Character> {
    repoLog.info('Creating character', { 
      name: character.name, 
      worldId: character.world_id,
      type: character.type 
    });
    
    const { data: row, error } = await supabase
      .from('characters')
      .insert({
        ...character,
        historical_events: [],
        story_beats_witnessed: [],
        reputation_tags: []
      })
      .select()
      .single();

    if (error) {
      repoLog.error('Failed to create character', error);
      throw error;
    }

    repoLog.success('Character created', { id: row.id, name: row.name });
    return row;
  }

  async update(id: string, updates: UpdateCharacter): Promise<Character> {
    repoLog.info('Updating character', { id, updates });
    
    const { data, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      repoLog.error('Failed to update character', error, { characterId: id });
      throw error;
    }
    
    return data;
  }

  async findById(id: string): Promise<Character | null> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      repoLog.error('Failed to get character', error, { characterId: id });
      throw error;
    }
    
    return data;
  }

  async findByWorldId(worldId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('world_id', worldId)
      .order('created_at', { ascending: false });
      
    if (error) {
      repoLog.error('Failed to list characters', error, { worldId });
      throw error;
    }
    
    return data || [];
  }

  async findByUserId(userId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });
      
    if (error) {
      repoLog.error('Failed to list user characters', error, { userId });
      throw error;
    }
    
    return data || [];
  }

  async findByFactionId(factionId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('faction_id', factionId)
      .order('story_role', { ascending: true });
      
    if (error) {
      repoLog.error('Failed to list faction characters', error, { factionId });
      throw error;
    }
    
    return data || [];
  }

  async findByLocationId(locationId: string, currentOnly: boolean = true): Promise<Character[]> {
    const column = currentOnly ? 'current_location_id' : 'home_location_id';
    
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq(column, locationId)
      .order('story_role', { ascending: true });
      
    if (error) {
      repoLog.error('Failed to list location characters', error, { locationId, currentOnly });
      throw error;
    }
    
    return data || [];
  }

  async findByStatus(worldId: string, status: CharacterStatus): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('world_id', worldId)
      .eq('status', status)
      .order('story_role', { ascending: true });
      
    if (error) {
      repoLog.error('Failed to list characters by status', error, { worldId, status });
      throw error;
    }
    
    return data || [];
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);
      
    if (error) {
      repoLog.error('Failed to delete character', error, { characterId: id });
      throw error;
    }
  }

  // Relationship management
  async createRelation(relation: CreateCharacterRelation): Promise<CharacterRelation> {
    repoLog.info('Creating character relation', { 
      characterId: relation.character_id,
      targetId: relation.target_character_id,
      type: relation.relationship_type 
    });
    
    const { data, error } = await supabase
      .from('character_relations')
      .insert(relation)
      .select()
      .single();
      
    if (error) {
      repoLog.error('Failed to create relation', error);
      throw error;
    }
    
    return data;
  }

  async updateRelation(id: string, sentiment: number, description?: string): Promise<CharacterRelation> {
    const updates: any = { 
      sentiment, 
      last_interaction: new Date().toISOString() 
    };
    
    if (description !== undefined) {
      updates.description = description;
    }
    
    const { data, error } = await supabase
      .from('character_relations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      repoLog.error('Failed to update relation', error, { relationId: id });
      throw error;
    }
    
    return data;
  }

  async deleteRelation(id: string): Promise<void> {
    const { error } = await supabase
      .from('character_relations')
      .delete()
      .eq('id', id);
      
    if (error) {
      repoLog.error('Failed to delete relation', error, { relationId: id });
      throw error;
    }
  }

  async findRelationsForCharacter(characterId: string): Promise<CharacterRelation[]> {
    const { data, error } = await supabase
      .from('character_relations')
      .select('*')
      .or(`character_id.eq.${characterId},target_character_id.eq.${characterId}`)
      .order('sentiment', { ascending: false });
      
    if (error) {
      repoLog.error('Failed to find relations', error, { characterId });
      throw error;
    }
    
    return data || [];
  }

  async findRelationBetween(char1Id: string, char2Id: string): Promise<CharacterRelation | null> {
    const { data, error } = await supabase
      .from('character_relations')
      .select('*')
      .or(
        `and(character_id.eq.${char1Id},target_character_id.eq.${char2Id}),` +
        `and(character_id.eq.${char2Id},target_character_id.eq.${char1Id})`
      )
      .single();
      
    if (error && error.code !== 'PGRST116') {
      repoLog.error('Failed to find relation between characters', error, { char1Id, char2Id });
      throw error;
    }
    
    return data;
  }

  // Special updates
  async addHistoricalEvent(characterId: string, event: HistoricalEvent): Promise<void> {
    const character = await this.findById(characterId);
    if (!character) throw new Error('Character not found');
    
    const updatedEvents = [...character.historical_events, event];
    
    const { error } = await supabase
      .from('characters')
      .update({ historical_events: updatedEvents })
      .eq('id', characterId);
      
    if (error) {
      repoLog.error('Failed to add historical event', error, { characterId });
      throw error;
    }
  }

  async addStoryBeatWitnessed(characterId: string, beatIndex: number): Promise<void> {
    const character = await this.findById(characterId);
    if (!character) throw new Error('Character not found');
    
    if (character.story_beats_witnessed.includes(beatIndex)) return;
    
    const updatedBeats = [...character.story_beats_witnessed, beatIndex].sort((a, b) => a - b);
    
    const { error } = await supabase
      .from('characters')
      .update({ story_beats_witnessed: updatedBeats })
      .eq('id', characterId);
      
    if (error) {
      repoLog.error('Failed to add story beat', error, { characterId, beatIndex });
      throw error;
    }
  }

  async addReputationTag(characterId: string, tag: string): Promise<void> {
    const character = await this.findById(characterId);
    if (!character) throw new Error('Character not found');
    
    if (character.reputation_tags.includes(tag)) return;
    
    const updatedTags = [...character.reputation_tags, tag];
    
    const { error } = await supabase
      .from('characters')
      .update({ reputation_tags: updatedTags })
      .eq('id', characterId);
      
    if (error) {
      repoLog.error('Failed to add reputation tag', error, { characterId, tag });
      throw error;
    }
  }

  async updateLastActive(characterId: string): Promise<void> {
    const { error } = await supabase
      .from('characters')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', characterId);
      
    if (error) {
      repoLog.error('Failed to update last active', error, { characterId });
      throw error;
    }
  }
}