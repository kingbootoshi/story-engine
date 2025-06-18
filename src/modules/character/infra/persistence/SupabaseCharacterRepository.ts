import { injectable } from 'tsyringe';
import { supabase } from '../../../../core/infra/supabase';
import { createLogger } from '../../../../core/infra/logger';
import type { 
  ICharacterRepository 
} from '../../domain/ports';
import type { 
  Character, 
  CreateCharacter, 
  UpdateCharacter,
  CharacterMemory,
  Relationship
} from '../../domain/schema';
import { Character as CharacterSchema } from '../../domain/schema';

const logger = createLogger('character.repository');

@injectable()
export class SupabaseCharacterRepository implements ICharacterRepository {
  async create(input: CreateCharacter): Promise<Character> {
    logger.debug('Creating character', { name: input.name, world_id: input.world_id });

    const { data, error } = await supabase
      .from('characters')
      .insert({
        ...input,
        personality_traits: input.personality_traits || [],
        motivations: input.motivations || [],
        relationships: [],
        memories: [],
        tags: input.tags || []
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create character', error);
      throw new Error(`Failed to create character: ${error.message}`);
    }

    return this.validateCharacter(data);
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
      logger.error('Failed to update character', error);
      throw new Error(`Failed to update character: ${error.message}`);
    }

    return this.validateCharacter(data);
  }

  async findById(id: string): Promise<Character | null> {
    const { data, error } = await supabase
      .from('characters')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      logger.error('Failed to find character', error);
      throw new Error(`Failed to find character: ${error.message}`);
    }

    return data ? this.validateCharacter(data) : null;
  }

  async findByWorldId(worldId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select()
      .eq('world_id', worldId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to find characters by world', error);
      throw new Error(`Failed to find characters: ${error.message}`);
    }

    return data.map(c => this.validateCharacter(c));
  }

  async findByLocationId(locationId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select()
      .eq('location_id', locationId)
      .order('name');

    if (error) {
      logger.error('Failed to find characters by location', error);
      throw new Error(`Failed to find characters: ${error.message}`);
    }

    return data.map(c => this.validateCharacter(c));
  }

  async findByFactionId(factionId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select()
      .eq('faction_id', factionId)
      .order('name');

    if (error) {
      logger.error('Failed to find characters by faction', error);
      throw new Error(`Failed to find characters: ${error.message}`);
    }

    return data.map(c => this.validateCharacter(c));
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Failed to delete character', error);
      throw new Error(`Failed to delete character: ${error.message}`);
    }
  }

  async addMemory(characterId: string, memory: CharacterMemory): Promise<void> {
    logger.debug('Adding character memory', { 
      character_id: characterId, 
      event: memory.event_description 
    });

    // First, get current memories
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('memories')
      .eq('id', characterId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch character for memory update', fetchError);
      throw new Error(`Failed to fetch character: ${fetchError.message}`);
    }

    const currentMemories = character.memories || [];
    const updatedMemories = [...currentMemories, memory];

    // Keep only the most recent 100 memories
    const trimmedMemories = updatedMemories
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);

    const { error: updateError } = await supabase
      .from('characters')
      .update({
        memories: trimmedMemories,
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId);

    if (updateError) {
      logger.error('Failed to add character memory', updateError);
      throw new Error(`Failed to add memory: ${updateError.message}`);
    }
  }

  async getMemories(characterId: string, limit?: number): Promise<CharacterMemory[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('memories')
      .eq('id', characterId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return []; // Not found
      logger.error('Failed to get character memories', error);
      throw new Error(`Failed to get memories: ${error.message}`);
    }

    const memories = data?.memories || [];
    const sorted = memories.sort(
      (a: CharacterMemory, b: CharacterMemory) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return limit ? sorted.slice(0, limit) : sorted;
  }

  async setRelationship(characterId: string, relationship: Relationship): Promise<void> {
    logger.debug('Setting character relationship', {
      character_id: characterId,
      target_id: relationship.character_id,
      type: relationship.type
    });

    // Get current relationships
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('relationships')
      .eq('id', characterId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch character for relationship update', fetchError);
      throw new Error(`Failed to fetch character: ${fetchError.message}`);
    }

    const currentRelationships = character.relationships || [];
    const filtered = currentRelationships.filter(
      (r: Relationship) => r.character_id !== relationship.character_id
    );
    const updatedRelationships = [...filtered, relationship];

    const { error: updateError } = await supabase
      .from('characters')
      .update({
        relationships: updatedRelationships,
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId);

    if (updateError) {
      logger.error('Failed to set character relationship', updateError);
      throw new Error(`Failed to set relationship: ${updateError.message}`);
    }
  }

  async getRelationships(characterId: string): Promise<Relationship[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('relationships')
      .eq('id', characterId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return []; // Not found
      logger.error('Failed to get character relationships', error);
      throw new Error(`Failed to get relationships: ${error.message}`);
    }

    return data?.relationships || [];
  }

  async getRelationship(characterId: string, targetId: string): Promise<Relationship | null> {
    const relationships = await this.getRelationships(characterId);
    return relationships.find(r => r.character_id === targetId) || null;
  }

  private validateCharacter(data: unknown): Character {
    const result = CharacterSchema.safeParse(data);
    if (!result.success) {
      logger.error('Character validation failed', result.error);
      throw new Error(`Invalid character data: ${result.error.message}`);
    }
    return result.data;
  }
}