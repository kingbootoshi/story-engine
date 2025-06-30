import type { Character, CreateCharacter, UpdateCharacter, CharacterReaction, CharacterBatch, SpawnDecision } from './schema';
import type { TrpcCtx } from '../../../core/trpc/context';

export interface ICharacterRepository {
  create(character: CreateCharacter): Promise<Character>;
  update(id: string, updates: UpdateCharacter): Promise<Character>;
  findById(id: string): Promise<Character | null>;
  findByWorldId(worldId: string): Promise<Character[]>;
  findByFactionId(factionId: string): Promise<Character[]>;
  findByLocationId(locationId: string): Promise<Character[]>;
  delete(id: string): Promise<void>;
  batchCreate(characters: CreateCharacter[]): Promise<Character[]>;
  addMemory(characterId: string, memory: Character['memories'][0]): Promise<void>;
  addWitnessedBeat(characterId: string, beatIndex: number): Promise<void>;
}

export interface CharacterGenerationContext {
  worldId: string;
  worldTheme: string;
  factionId: string | null;
  factionName?: string;
  factionIdeology?: string;
  existingCharacterCount: number;
  targetCount: number;
  availableLocations: Array<{ id: string; name: string }>;
}

export interface CharacterSelectionContext {
  beat: {
    description: string;
    directives: string[];
    emergent: string[];
    beatIndex: number;
    beatId: string;
  };
  worldTheme: string;
  characters: Array<{
    id: string;
    name: string;
    story_role: string;
    location: string | null;
    faction: string | null;
    personality_traits: string[];
    motivations: string[];
  }>;
  factions: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
}

export interface CharacterReactionContext {
  beat: {
    description: string;
    directives: string[];
    emergent: string[];
    beatIndex: number;
    beatId: string;
  };
  character: {
    id: string;
    name: string;
    story_role: string;
    personality_traits: string[];
    motivations: string[];
    current_location: string | null;
    current_faction: string | null;
    recent_memories: Array<{
      event_description: string;
      emotional_impact: string;
      importance: number;
    }>;
    background: string;
  };
  world_context: {
    faction_relations?: Record<string, Record<string, string>>;
    available_locations: Array<{ id: string; name: string }>;
    available_factions: Array<{ id: string; name: string }>;
  };
  selectionReason?: string;
}

export interface SpawnAnalysisContext {
  beat: {
    description: string;
    directives: string[];
    emergent: string[];
  };
  existing_factions: string[];
  existing_locations: Array<{ id: string; name: string }>;
  current_character_count: number;
  world_theme: string;
}

export interface ICharacterAI {
  generateCharacterBatch(
    context: CharacterGenerationContext,
    trace: TrpcCtx
  ): Promise<CharacterBatch[]>;
  
  selectAffectedCharacters(
    context: CharacterSelectionContext,
    trace: TrpcCtx
  ): Promise<Array<{ characterId: string; reason: string }>>;
  
  evaluateCharacterReaction(
    context: CharacterReactionContext,
    trace: TrpcCtx
  ): Promise<CharacterReaction>;
  
  analyzeSpawnNeed(
    context: SpawnAnalysisContext,
    trace: TrpcCtx
  ): Promise<SpawnDecision>;
}