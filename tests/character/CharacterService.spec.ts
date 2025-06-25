import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DI as container } from '../../src/core/infra/container';
import { createLogger } from '../../src/core/infra/logger';
import { eventBus } from '../../src/core/infra/eventBus';
import type { ICharacterRepository, ICharacterAI } from '../../src/modules/character/domain/ports';
import type { Character, CreateCharacter, CharacterReaction, CharacterBatch, SpawnDecision } from '../../src/modules/character/domain/schema';
import { CharacterService } from '../../src/modules/character/application/CharacterService';
import type { IFactionRepository } from '../../src/modules/faction/domain/ports';
import type { WorldRepo } from '../../src/modules/world/domain/ports';
import type { LocationRepository } from '../../src/modules/location/domain/ports';
import type { TrpcCtx } from '../../src/core/trpc/context';
import { InMemoryWorldRepo } from '../_shared/fakes/InMemoryWorldRepo';

describe('CharacterService', () => {
  let characterService: CharacterService;
  let characterRepo: ICharacterRepository;
  let characterAI: ICharacterAI;
  let factionRepo: IFactionRepository;
  let worldRepo: WorldRepo;
  let locationRepo: LocationRepository;
  let emitSpy: ReturnType<typeof vi.spyOn>;
  let mockCtx: TrpcCtx;

  beforeEach(() => {
    container.reset();
    container.clearInstances();
    vi.clearAllMocks();
    
    // Clear all event listeners before each test
    eventBus['emitter'].removeAllListeners();

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

    characterAI = {
      generateCharacterBatch: vi.fn(),
      evaluateCharacterReaction: vi.fn(),
      analyzeSpawnNeed: vi.fn(),
    };

    factionRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByWorldId: vi.fn(),
      delete: vi.fn(),
      addHistoricalEvent: vi.fn(),
      setRelation: vi.fn(),
      getRelations: vi.fn(),
      getRelation: vi.fn(),
    };

    worldRepo = new InMemoryWorldRepo();

    locationRepo = {
      createBulk: vi.fn(),
      create: vi.fn(),
      findByWorldId: vi.fn(),
      findById: vi.fn(),
      findByParentId: vi.fn(),
      updateStatus: vi.fn(),
      updateDescription: vi.fn(),
      addHistoricalEvent: vi.fn(),
      update: vi.fn(),
      search: vi.fn()
    } as unknown as LocationRepository;

    container.register('ICharacterRepository', { useValue: characterRepo });
    container.register('ICharacterAI', { useValue: characterAI });
    container.register('IFactionRepository', { useValue: factionRepo });
    container.register('WorldRepo', { useValue: worldRepo });
    container.register('LocationRepository', { useValue: locationRepo });

    // Instantiate the service which will set up event handlers
    characterService = new CharacterService(
      characterRepo,
      characterAI,
      worldRepo,
      factionRepo,
      locationRepo
    );
    
    emitSpy = vi.spyOn(eventBus as any, 'emit');

    mockCtx = {
      reqId: 'test-req-123',
      logger: createLogger('test'),
      user: { id: 'user-123' }
    };
  });

  afterEach(() => {
    emitSpy.mockRestore();
  });

  describe('create', () => {
    it('should create a character and emit event', async () => {
      const input: CreateCharacter = {
        world_id: 'world-123',
        name: 'Elena the Healer',
        type: 'npc',
        story_role: 'minor',
        location_id: 'loc-123',
        faction_id: 'faction-123',
        description: 'A kind healer',
        background: 'Trained at the temple',
        personality_traits: ['compassionate', 'brave'],
        motivations: ['heal the sick', 'protect innocents'],
        status: 'alive',
        memories: [],
        story_beats_witnessed: []
      } as any;

      const created: Character = {
        id: 'char-123',
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(characterRepo.create).mockResolvedValue(created);

      const result = await characterService.create(input, mockCtx);

      expect(result).toEqual(created);
      expect(characterRepo.create).toHaveBeenCalledWith(input);
      expect(emitSpy).toHaveBeenCalledWith('character.created', {
        v: 1,
        worldId: 'world-123',
        characterId: 'char-123',
        name: 'Elena the Healer',
        factionId: 'faction-123',
        locationId: 'loc-123',
        storyRole: 'minor'
      });
    });
  });

  describe('faction seeding', () => {
    it('should generate characters for each faction on seeding complete', async () => {
      const world = await worldRepo.createWorld({ name: 'Test World', description: 'A test world' });
      const worldId = world.id;

      vi.mocked(factionRepo.findByWorldId).mockResolvedValue([
        {
          id: 'faction-1',
          world_id: worldId,
          name: 'Healers Guild',
          ideology: 'Help all in need',
          member_count: 100,
          members_estimate: 100,
          tags: ['peaceful'],
          status: 'stable',
          controlled_locations: [],
          historical_events: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          banner_color: '#00FF00'
        }
      ]);

      vi.mocked(locationRepo.findByWorldId).mockResolvedValue([
        {
          id: 'loc-1',
          world_id: worldId,
          name: 'Temple District',
          type: 'landmark',
          description: 'Sacred grounds',
          status: 'stable',
          tags: ['religious'],
          coordinates: { x: 0, y: 0 },
          created_at: new Date().toISOString(),
          controlling_faction_id: null
        }
      ]);

      const characterBatch: CharacterBatch[] = [{
        name: 'Brother Marcus',
        story_role: 'minor',
        faction_id: 'faction-1',
        personality_traits: ['devout', 'kind'],
        motivations: ['serve the temple'],
        description: 'A devoted monk',
        background: 'Raised in the temple',
        spawn_location: 'Temple District'
      }];

      vi.mocked(characterAI.generateCharacterBatch).mockResolvedValue(characterBatch);
      vi.mocked(characterRepo.batchCreate).mockResolvedValue([]);

      const event = {
        v: 1,
        worldId,
        factionCount: 1
      };

      eventBus.emit('faction.seeding.complete', event);
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(characterAI.generateCharacterBatch).toHaveBeenCalledTimes(2);
      expect(characterRepo.batchCreate).toHaveBeenCalledTimes(2);
      expect(emitSpy).toHaveBeenCalledWith('character.batch_generated', expect.any(Object));
    });
  });

  describe('beat reactions', () => {
    it('should process character reactions to beats', async () => {
      const worldId = 'world-123';
      // beatId will be set after creating the beat to ensure it matches the repo-generated ID
      let beatId: string;
      const beatIndex = 5;

      const character: Character = {
        id: 'char-123',
        world_id: worldId,
        name: 'Elena',
        type: 'npc',
        status: 'alive',
        story_role: 'minor',
        location_id: 'loc-123',
        faction_id: 'faction-123',
        description: 'A healer',
        background: 'Temple trained',
        personality_traits: ['kind'],
        motivations: ['heal others'],
        memories: [],
        story_beats_witnessed: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(characterRepo.findByWorldId).mockResolvedValue([character]);
      vi.mocked(factionRepo.findByWorldId).mockResolvedValue([]);
      vi.mocked(locationRepo.findByWorldId).mockResolvedValue([]);
      vi.mocked(factionRepo.getRelations).mockResolvedValue([]);

      await worldRepo.createWorld({ name: 'Test', description: 'Test world' });
      
      const arc = await worldRepo.createArc(worldId, 'Test Arc', 'Test idea');
      const beat = await worldRepo.createBeat(
        arc.id,
        beatIndex,
        'dynamic',
        {
          beat_name: 'Fire in the market',
          description: 'The market burns',
          world_directives: ['Market destroyed'],
          emergent_storylines: ['Refugees flee']
        }
      );

      // Capture the actual beat id returned by the repo
      beatId = beat.id;

      const reaction: CharacterReaction = {
        affected: true,
        changes: {
          dies: false,
          new_memories: [{
            event_description: 'Saw the market burn',
            timestamp: new Date().toISOString(),
            emotional_impact: 'negative',
            importance: 0.8,
            beat_index: beatIndex
          }],
          motivation_changes: {
            add: ['find those responsible'],
            remove: []
          },
          location_id: null,
          faction_id: null,
          new_description: undefined,
          background_addition: null
        },
        world_event: null
      };

      vi.mocked(characterAI.evaluateCharacterReaction).mockResolvedValue(reaction);
      vi.mocked(characterAI.analyzeSpawnNeed).mockResolvedValue({
        spawn_characters: false,
        new_characters: []
      });
      
      vi.mocked(characterRepo.addMemory).mockResolvedValue(undefined);
      vi.mocked(characterRepo.addWitnessedBeat).mockResolvedValue(undefined);
      vi.mocked(characterRepo.update).mockResolvedValue(character);

      const event = {
        v: 1,
        worldId,
        arcId: arc.id,
        beatId,
        beatIndex,
        beatName: 'Fire in the market',
        directives: ['Market destroyed'],
        emergent: ['Refugees flee']
      };

      eventBus.emit('world.beat.created', event);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(characterAI.evaluateCharacterReaction).toHaveBeenCalled();
      expect(characterRepo.addMemory).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('character.memory_added', expect.any(Object));
    });
  });
});