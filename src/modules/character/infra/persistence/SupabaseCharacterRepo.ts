import { injectable } from 'tsyringe';
import type { ICharacterRepository } from '../../domain/ports';
import type { Character, CreateCharacter, UpdateCharacter, CharacterMemory } from '../../domain/schema';
import { supabase } from '../../../../core/infra/supabase';
import { createLogger } from '../../../../core/infra/logger';

const logger = createLogger('character.repo');

@injectable()
export class SupabaseCharacterRepo implements ICharacterRepository {
  constructor() {}

  async create(character: CreateCharacter): Promise<Character> {
    logger.debug('Creating character', { name: character.name, worldId: character.world_id });
    
    const { data, error } = await supabase
      .from('characters')
      .insert({
        ...character,
        memories: character.memories || [],
        story_beats_witnessed: character.story_beats_witnessed || []
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Failed to create character', error, { name: character.name });
      throw new Error(`Failed to create character: ${error.message}`);
    }
    
    return this.toDomain(data);
  }

  async update(id: string, updates: UpdateCharacter): Promise<Character> {
    logger.debug('Updating character', { id, updates });
    
    const { data, error } = await supabase
      .from('characters')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Failed to update character', error, { id });
      throw new Error(`Failed to update character: ${error.message}`);
    }
    
    return this.toDomain(data);
  }

  async findById(id: string): Promise<Character | null> {
    const { data, error } = await supabase
      .from('characters')
      .select()
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Failed to find character by id', error, { id });
      throw new Error(`Failed to find character: ${error.message}`);
    }
    
    return data ? this.toDomain(data) : null;
  }

  async findByWorldId(worldId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select()
      .eq('world_id', worldId)
      .order('created_at', { ascending: true });
    
    if (error) {
      logger.error('Failed to find characters by world', error, { worldId });
      throw new Error(`Failed to find characters: ${error.message}`);
    }
    
    return (data || []).map(row => this.toDomain(row));
  }

  async findByFactionId(factionId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select()
      .eq('faction_id', factionId)
      .order('story_role', { ascending: true });
    
    if (error) {
      logger.error('Failed to find characters by faction', error, { factionId });
      throw new Error(`Failed to find characters: ${error.message}`);
    }
    
    return (data || []).map(row => this.toDomain(row));
  }

  async findByLocationId(locationId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select()
      .eq('location_id', locationId)
      .order('name', { ascending: true });
    
    if (error) {
      logger.error('Failed to find characters by location', error, { locationId });
      throw new Error(`Failed to find characters: ${error.message}`);
    }
    
    return (data || []).map(row => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    logger.debug('Deleting character', { id });
    
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error('Failed to delete character', error, { id });
      throw new Error(`Failed to delete character: ${error.message}`);
    }
  }

  async batchCreate(characters: CreateCharacter[]): Promise<Character[]> {
    logger.debug('Batch creating characters', { count: characters.length });
    
    const { data, error } = await supabase
      .from('characters')
      .insert(characters.map(char => ({
        ...char,
        memories: char.memories || [],
        story_beats_witnessed: char.story_beats_witnessed || []
      })))
      .select()
      .onConflict('world_id,name');
    
    if (error) {
      logger.error('Failed to batch create characters', error, { count: characters.length });
      throw new Error(`Failed to create characters: ${error.message}`);
    }
    
    const insertedCount = data?.length || 0;
    const skippedCount = characters.length - insertedCount;
    
    if (skippedCount > 0) {
      logger.warn(`Skipped ${skippedCount} characters due to duplicate names`, { 
        totalAttempted: characters.length,
        inserted: insertedCount,
        worldId: characters[0]?.world_id 
      });
    } else {
      logger.info('All characters created successfully', { count: insertedCount });
    }
    
    return (data || []).map(row => this.toDomain(row));
  }

  async addMemory(characterId: string, memory: CharacterMemory): Promise<void> {
    logger.debug('Adding memory to character', { characterId, memory });
    
    const character = await this.findById(characterId);
    if (!character) {
      throw new Error('Character not found');
    }
    
    const updatedMemories = [...character.memories, memory]
      .sort((a, b) => b.importance - a.importance || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);
    
    await this.update(characterId, { memories: updatedMemories });
  }

  async addWitnessedBeat(characterId: string, beatIndex: number): Promise<void> {
    logger.debug('Adding witnessed beat to character', { characterId, beatIndex });
    
    const character = await this.findById(characterId);
    if (!character) {
      throw new Error('Character not found');
    }
    
    if (!character.story_beats_witnessed.includes(beatIndex)) {
      const updatedBeats = [...character.story_beats_witnessed, beatIndex].sort((a, b) => a - b);
      await this.update(characterId, { story_beats_witnessed: updatedBeats });
    }
  }

  private toDomain(row: any): Character {
    return {
      id: row.id,
      world_id: row.world_id,
      name: row.name,
      type: row.type,
      status: row.status,
      story_role: row.story_role,
      location_id: row.location_id,
      faction_id: row.faction_id,
      description: row.description,
      background: row.background,
      personality_traits: row.personality_traits || [],
      motivations: row.motivations || [],
      memories: row.memories || [],
      story_beats_witnessed: row.story_beats_witnessed || [],
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}