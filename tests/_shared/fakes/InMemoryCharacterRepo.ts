import type { 
  ICharacterRepository 
} from '../../../src/modules/character/domain/ports';
import type { 
  Character, 
  CreateCharacter, 
  UpdateCharacter,
  CharacterRelation,
  CreateCharacterRelation,
  HistoricalEvent,
  CharacterStatus
} from '../../../src/modules/character/domain/schema';

/**
 * In-memory implementation of ICharacterRepository for testing.
 * Provides full CRUD operations without database dependencies.
 */
export class InMemoryCharacterRepo implements ICharacterRepository {
  private characters = new Map<string, Character>();
  private relations = new Map<string, CharacterRelation>();
  private characterIdCounter = 1;
  private relationIdCounter = 1;

  async create(input: CreateCharacter): Promise<Character> {
    const character: Character = {
      id: `character-${this.characterIdCounter++}`,
      ...input,
      story_beats_witnessed: [],
      reputation_tags: [],
      historical_events: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString()
    };
    
    this.characters.set(character.id, character);
    return { ...character };
  }

  async update(id: string, updates: UpdateCharacter): Promise<Character> {
    const existing = this.characters.get(id);
    if (!existing) {
      throw new Error(`Character ${id} not found`);
    }

    const updated: Character = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.characters.set(id, updated);
    return { ...updated };
  }

  async findById(id: string): Promise<Character | null> {
    const character = this.characters.get(id);
    return character ? { ...character } : null;
  }

  async findByWorldId(worldId: string): Promise<Character[]> {
    return Array.from(this.characters.values())
      .filter(c => c.world_id === worldId)
      .map(c => ({ ...c }));
  }

  async findByUserId(userId: string): Promise<Character[]> {
    return Array.from(this.characters.values())
      .filter(c => c.user_id === userId)
      .map(c => ({ ...c }));
  }

  async findByFactionId(factionId: string): Promise<Character[]> {
    return Array.from(this.characters.values())
      .filter(c => c.faction_id === factionId)
      .map(c => ({ ...c }));
  }

  async findByLocationId(locationId: string, currentOnly: boolean = true): Promise<Character[]> {
    return Array.from(this.characters.values())
      .filter(c => currentOnly 
        ? c.current_location_id === locationId 
        : (c.current_location_id === locationId || c.home_location_id === locationId))
      .map(c => ({ ...c }));
  }

  async findByStatus(worldId: string, status: CharacterStatus): Promise<Character[]> {
    return Array.from(this.characters.values())
      .filter(c => c.world_id === worldId && c.status === status)
      .map(c => ({ ...c }));
  }

  async delete(id: string): Promise<void> {
    this.characters.delete(id);
  }

  // Relationship management
  async createRelation(relation: CreateCharacterRelation): Promise<CharacterRelation> {
    const newRelation: CharacterRelation = {
      id: `relation-${this.relationIdCounter++}`,
      ...relation,
      established_at: new Date().toISOString(),
      last_interaction: new Date().toISOString()
    };
    
    this.relations.set(newRelation.id, newRelation);
    return { ...newRelation };
  }

  async updateRelation(id: string, sentiment: number, description?: string): Promise<CharacterRelation> {
    const existing = this.relations.get(id);
    if (!existing) {
      throw new Error(`Relation ${id} not found`);
    }

    const updated: CharacterRelation = {
      ...existing,
      sentiment,
      ...(description !== undefined && { description }),
      last_interaction: new Date().toISOString()
    };

    this.relations.set(id, updated);
    return { ...updated };
  }

  async deleteRelation(id: string): Promise<void> {
    this.relations.delete(id);
  }

  async findRelationsForCharacter(characterId: string): Promise<CharacterRelation[]> {
    return Array.from(this.relations.values())
      .filter(r => r.character_id === characterId || r.target_character_id === characterId)
      .map(r => ({ ...r }));
  }

  async findRelationBetween(char1Id: string, char2Id: string): Promise<CharacterRelation | null> {
    const relation = Array.from(this.relations.values()).find(r => 
      r.character_id === char1Id && r.target_character_id === char2Id
    );
    return relation ? { ...relation } : null;
  }

  // Special updates
  async addHistoricalEvent(characterId: string, event: HistoricalEvent): Promise<void> {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    character.historical_events.push(event);
  }

  async addStoryBeatWitnessed(characterId: string, beatIndex: number): Promise<void> {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    if (!character.story_beats_witnessed.includes(beatIndex)) {
      character.story_beats_witnessed.push(beatIndex);
      character.story_beats_witnessed.sort((a, b) => a - b);
    }
  }

  async addReputationTag(characterId: string, tag: string): Promise<void> {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    if (!character.reputation_tags.includes(tag)) {
      character.reputation_tags.push(tag);
    }
  }

  async updateLastActive(characterId: string): Promise<void> {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    character.last_active_at = new Date().toISOString();
  }

  /**
   * Test helper to clear all data
   */
  clear(): void {
    this.characters.clear();
    this.idCounter = 1;
  }

  /**
   * Test helper to get all characters
   */
  getAll(): Character[] {
    return Array.from(this.characters.values()).map(c => ({ ...c }));
  }

  /**
   * Test helper to seed a character directly
   */
  seed(character: Character): void {
    this.characters.set(character.id, { ...character });
  }
}