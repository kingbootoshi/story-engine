import type { 
  Character, 
  CreateCharacter, 
  UpdateCharacter, 
  CharacterRelation,
  CreateCharacterRelation,
  HistoricalEvent,
  CharacterStatus,
  PersonalityUpdate,
  RelationshipType
} from './schema';

export interface ICharacterRepository {
  // Character CRUD
  create(character: CreateCharacter): Promise<Character>;
  update(id: string, updates: UpdateCharacter): Promise<Character>;
  findById(id: string): Promise<Character | null>;
  findByWorldId(worldId: string): Promise<Character[]>;
  findByUserId(userId: string): Promise<Character[]>;
  findByFactionId(factionId: string): Promise<Character[]>;
  findByLocationId(locationId: string, currentOnly?: boolean): Promise<Character[]>;
  findByStatus(worldId: string, status: CharacterStatus): Promise<Character[]>;
  delete(id: string): Promise<void>;
  
  // Relationship management
  createRelation(relation: CreateCharacterRelation): Promise<CharacterRelation>;
  updateRelation(id: string, sentiment: number, description?: string): Promise<CharacterRelation>;
  deleteRelation(id: string): Promise<void>;
  findRelationsForCharacter(characterId: string): Promise<CharacterRelation[]>;
  findRelationBetween(char1Id: string, char2Id: string): Promise<CharacterRelation | null>;
  
  // Special updates
  addHistoricalEvent(characterId: string, event: HistoricalEvent): Promise<void>;
  addStoryBeatWitnessed(characterId: string, beatIndex: number): Promise<void>;
  addReputationTag(characterId: string, tag: string): Promise<void>;
  updateLastActive(characterId: string): Promise<void>;
}

export interface ICharacterAI {
  // Character generation
  generateFactionCharacters(context: {
    worldId: string;
    worldTheme: string;
    factionId: string;
    factionName: string;
    factionIdeology: string;
    existingCharacters: string[];
  }): Promise<{
    characters: Array<{
      name: string;
      role: string;
      personality_traits: string[];
      core_beliefs: string[];
      initial_goals: string[];
      backstory: string;
      relationships: Array<{
        target_role: string;
        type: RelationshipType;
        description: string;
      }>;
    }>;
  }>;
  
  generateBeatCharacters(context: {
    worldId: string;
    worldTheme: string;
    beatDirective: string;
    beatContext: string;
    existingCharacters: Array<{ name: string; role: string }>;
    factionContext?: Array<{ id: string; name: string; ideology: string }>;
  }): Promise<{
    characters: Array<{
      name: string;
      type: 'npc';
      story_role: string;
      faction_id?: string;
      personality_traits: string[];
      core_beliefs: string[];
      initial_goals: string[];
      backstory: string;
    }>;
  }>;
  
  // Character evolution
  updateCharacterGoals(context: {
    characterId: string;
    characterName: string;
    currentGoals: string[];
    personality: string[];
    beliefs: string[];
    recentEvents: string[];
    worldContext: string;
  }): Promise<{
    new_goals: string[];
    abandoned_goals: string[];
    reason: string;
  }>;
  
  evaluateRelationships(context: {
    worldId: string;
    characters: Array<{
      id: string;
      name: string;
      faction_id?: string;
      personality: string[];
    }>;
    recentEvents: string[];
    existingRelations: Array<{
      char1: string;
      char2: string;
      type: string;
      sentiment: number;
    }>;
  }): Promise<{
    new_relationships: Array<{
      character_id: string;
      target_id: string;
      type: RelationshipType;
      sentiment: number;
      reason: string;
    }>;
    changed_relationships: Array<{
      relation_id: string;
      sentiment_change: number;
      reason: string;
    }>;
  }>;
  
  // Character enrichment
  enrichCharacterHistory(context: {
    characterId: string;
    name: string;
    role: string;
    faction?: string;
    worldTheme: string;
    worldHistory: string[];
  }): Promise<{
    backstory: string;
    appearance_description: string;
    voice_description: string;
    additional_traits?: string[];
  }>;
}