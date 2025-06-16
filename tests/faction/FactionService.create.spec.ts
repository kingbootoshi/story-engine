import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DI as container } from '../../src/core/infra/container';
import { createLogger } from '../../src/core/infra/logger';
import { eventBus } from '../../src/core/infra/eventBus';
import type { IFactionRepository, IFactionAI } from '../../src/modules/faction/domain/ports';
import type { Faction, CreateFaction } from '../../src/modules/faction/domain/schema';
import { FactionService } from '../../src/modules/faction/application/FactionService';
import { InMemoryWorldRepo } from '../_shared/fakes/InMemoryWorldRepo';
import type { WorldRepo } from '../../src/modules/world/domain/ports';
import type { LocationRepository } from '../../src/modules/location/domain/ports';

describe('FactionService.create', () => {
  let factionService: FactionService;
  let factionRepo: IFactionRepository;
  let factionAI: IFactionAI;
  let worldRepo: WorldRepo;
  let locationRepo: LocationRepository;
  let emitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    container.reset();
    vi.clearAllMocks();

    // Create mocks
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

    factionAI = {
      generateFaction: vi.fn(),
      updateDoctrine: vi.fn(),
      evaluateRelations: vi.fn(),
      generatePropaganda: vi.fn(),
    };

    worldRepo = new InMemoryWorldRepo();
    
    locationRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByWorldId: vi.fn(),
      delete: vi.fn(),
      addHistoricalEvent: vi.fn(),
    };

    // Register dependencies
    container.register('IFactionRepository', { useValue: factionRepo });
    container.register('IFactionAI', { useValue: factionAI });
    container.register('WorldRepo', { useValue: worldRepo });
    container.register('LocationRepository', { useValue: locationRepo });

    // Spy on eventBus
    emitSpy = vi.spyOn(eventBus, 'emit');

    // Get service instance
    factionService = container.resolve(FactionService);
  });

  afterEach(() => {
    emitSpy.mockRestore();
  });

  it('should create a faction without AI enrichment', async () => {
    const input: CreateFaction = {
      world_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Iron Brotherhood',
      ideology: 'Strength through unity, unity through faith',
      status: 'rising',
      members_estimate: 10000,
      tags: ['militaristic', 'religious'],
      banner_color: '#FF0000',
      emblem_svg: null,
      home_location_id: null,
      controlled_locations: []
    };

    const expectedFaction: Faction = {
      ...input,
      id: '456e7890-e89b-12d3-a456-426614174000',
      historical_events: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    vi.mocked(factionRepo.create).mockResolvedValue(expectedFaction);

    const result = await factionService.create(input, false);

    expect(result).toEqual(expectedFaction);
    expect(factionRepo.create).toHaveBeenCalledWith(input);
    expect(factionAI.generateFaction).not.toHaveBeenCalled();
    
    expect(emitSpy).toHaveBeenCalledWith('faction.created', {
      v: 1,
      worldId: input.world_id,
      factionId: expectedFaction.id,
      name: input.name
    });
  });

  it('should create a faction with AI enrichment', async () => {
    const worldId = '123e4567-e89b-12d3-a456-426614174000';
    const world = {
      id: worldId,
      user_id: 'user-123',
      name: 'Test World',
      description: 'A world of magic and technology',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await worldRepo.createWorld(world);

    const input: CreateFaction = {
      world_id: worldId,
      name: 'The Collective',
      ideology: '',
      status: 'stable',
      members_estimate: 0,
      tags: [],
      banner_color: null,
      emblem_svg: null,
      home_location_id: null,
      controlled_locations: []
    };

    const aiGeneratedData: CreateFaction = {
      world_id: worldId,
      name: 'The Collective',
      ideology: 'Technology is the path to transcendence',
      status: 'rising',
      members_estimate: 50000,
      tags: ['technological', 'transhumanist', 'expansionist'],
      banner_color: '#00FF00',
      emblem_svg: null,
      home_location_id: null,
      controlled_locations: []
    };

    vi.mocked(factionAI.generateFaction).mockResolvedValue(aiGeneratedData);
    vi.mocked(factionRepo.findByWorldId).mockResolvedValue([]);

    const expectedFaction: Faction = {
      ...aiGeneratedData,
      id: '456e7890-e89b-12d3-a456-426614174000',
      historical_events: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    vi.mocked(factionRepo.create).mockResolvedValue(expectedFaction);

    const result = await factionService.create(input, true);

    expect(result).toEqual(expectedFaction);
    expect(factionAI.generateFaction).toHaveBeenCalledWith({
      worldId: worldId,
      worldTheme: world.description,
      existingFactions: []
    });
    expect(factionRepo.create).toHaveBeenCalledWith(aiGeneratedData);
  });

  it('should throw error if world not found during AI enrichment', async () => {
    const input: CreateFaction = {
      world_id: 'non-existent-world',
      name: 'Test Faction',
      ideology: '',
      status: 'stable',
      members_estimate: 0,
      tags: [],
      banner_color: null,
      emblem_svg: null,
      home_location_id: null,
      controlled_locations: []
    };

    await expect(factionService.create(input, true)).rejects.toThrow('World not found');
  });
});