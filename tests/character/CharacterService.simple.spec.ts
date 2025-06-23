import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DI as container } from '../../src/core/infra/container';
import { createLogger } from '../../src/core/infra/logger';
import type { ICharacterRepository, ICharacterAI } from '../../src/modules/character/domain/ports';
import type { Character, CreateCharacter } from '../../src/modules/character/domain/schema';
import { CharacterService } from '../../src/modules/character/application/CharacterService';
import type { TrpcCtx } from '../../src/core/trpc/context';

describe('CharacterService - Simple Tests', () => {
  let characterService: CharacterService;
  let characterRepo: ICharacterRepository;
  let mockCtx: TrpcCtx;

  beforeEach(() => {
    container.reset();
    vi.clearAllMocks();

    characterRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByWorldId: vi.fn(),
      findByFactionId: vi.fn(),
      findByLocationId: vi.fn(),
      delete: vi.fn(),
      batchCreate: vi.fn(),
      addMemory: vi.fn(),
      addWitnessedBeat: vi.fn(),
    };

    // Mock all other dependencies as empty implementations
    const mockAI = {
      generateCharacterBatch: vi.fn(),
      evaluateCharacterReaction: vi.fn(),
      analyzeSpawnNeed: vi.fn(),
    };

    const mockWorldRepo = {
      getWorld: vi.fn(),
      getCurrentBeat: vi.fn(),
      getBeat: vi.fn(),
    };

    const mockFactionRepo = {
      findByWorldId: vi.fn().mockResolvedValue([]),
      getRelations: vi.fn().mockResolvedValue([]),
    };

    const mockLocationRepo = {
      findByWorldId: vi.fn().mockResolvedValue([]),
    };

    container.register('ICharacterRepository', { useValue: characterRepo });
    container.register('ICharacterAI', { useValue: mockAI });
    container.register('WorldRepo', { useValue: mockWorldRepo });
    container.register('IFactionRepository', { useValue: mockFactionRepo });
    container.register('LocationRepository', { useValue: mockLocationRepo });

    characterService = container.resolve(CharacterService);

    mockCtx = {
      reqId: 'test-req-123',
      logger: createLogger('test'),
      user: { id: 'user-123' }
    };
  });

  describe('CRUD operations', () => {
    it('should create a character', async () => {
      const input: CreateCharacter = {
        world_id: 'world-123',
        name: 'Test Character',
        type: 'npc',
        story_role: 'minor',
        location_id: null,
        faction_id: null,
        description: 'A test character',
        background: 'Test background',
        personality_traits: ['brave'],
        motivations: ['survive']
      };

      const created: Character = {
        id: 'char-123',
        ...input,
        status: 'alive',
        memories: [],
        story_beats_witnessed: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(characterRepo.create).mockResolvedValue(created);

      const result = await characterService.create(input, mockCtx);

      expect(result).toEqual(created);
      expect(characterRepo.create).toHaveBeenCalledWith(input);
    });

    it('should update a character', async () => {
      const character: Character = {
        id: 'char-123',
        world_id: 'world-123',
        name: 'Test Character',
        type: 'npc',
        status: 'alive',
        story_role: 'minor',
        location_id: null,
        faction_id: null,
        description: 'Original description',
        background: 'Test background',
        personality_traits: ['brave'],
        motivations: ['survive'],
        memories: [],
        story_beats_witnessed: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updated = { ...character, description: 'Updated description' };

      vi.mocked(characterRepo.findById).mockResolvedValue(character);
      vi.mocked(characterRepo.update).mockResolvedValue(updated);

      const result = await characterService.update('char-123', { description: 'Updated description' }, mockCtx);

      expect(result.description).toBe('Updated description');
      expect(characterRepo.update).toHaveBeenCalledWith('char-123', { description: 'Updated description' });
    });

    it('should list characters by world', async () => {
      const characters: Character[] = [
        {
          id: 'char-1',
          world_id: 'world-123',
          name: 'Character 1',
          type: 'npc',
          status: 'alive',
          story_role: 'minor',
          location_id: null,
          faction_id: null,
          description: 'First character',
          background: 'Background 1',
          personality_traits: [],
          motivations: [],
          memories: [],
          story_beats_witnessed: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      vi.mocked(characterRepo.findByWorldId).mockResolvedValue(characters);

      const result = await characterService.list('world-123');

      expect(result).toEqual(characters);
      expect(characterRepo.findByWorldId).toHaveBeenCalledWith('world-123');
    });

    it('should delete a character', async () => {
      const character: Character = {
        id: 'char-123',
        world_id: 'world-123',
        name: 'Test Character',
        type: 'npc',
        status: 'alive',
        story_role: 'minor',
        location_id: null,
        faction_id: null,
        description: 'Test',
        background: 'Test',
        personality_traits: [],
        motivations: [],
        memories: [],
        story_beats_witnessed: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(characterRepo.findById).mockResolvedValue(character);
      vi.mocked(characterRepo.delete).mockResolvedValue(undefined);

      await characterService.delete('char-123', mockCtx);

      expect(characterRepo.delete).toHaveBeenCalledWith('char-123');
    });
  });
});