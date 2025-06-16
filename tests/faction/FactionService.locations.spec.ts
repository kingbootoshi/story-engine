import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DI as container } from '../../src/core/infra/container';
import { eventBus } from '../../src/core/infra/eventBus';
import type { IFactionRepository, IFactionAI } from '../../src/modules/faction/domain/ports';
import type { Faction } from '../../src/modules/faction/domain/schema';
import { FactionService } from '../../src/modules/faction/application/FactionService';
import type { WorldRepo } from '../../src/modules/world/domain/ports';
import type { LocationRepository } from '../../src/modules/location/domain/ports';
import type { Location } from '../../src/modules/location/domain/schema';
import type { WorldBeat } from '../../src/modules/world/domain/schema';

describe('FactionService.locations', () => {
  let factionService: FactionService;
  let factionRepo: IFactionRepository;
  let worldRepo: WorldRepo;
  let locationRepo: LocationRepository;
  let emitSpy: ReturnType<typeof vi.spyOn>;

  const mockFaction: Faction = {
    id: 'faction-1',
    world_id: 'world-1',
    name: 'Mountain Kingdom',
    ideology: 'Honor and tradition above all',
    status: 'stable',
    members_estimate: 50000,
    tags: ['traditional', 'defensive'],
    banner_color: '#4B0082',
    emblem_svg: null,
    home_location_id: 'location-1',
    controlled_locations: ['location-1'],
    historical_events: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockLocation: Location = {
    id: 'location-2',
    world_id: 'world-1',
    parent_location_id: null,
    name: 'Crystal Mines',
    type: 'landmark',
    status: 'thriving',
    description: 'Rich mineral deposits',
    tags: ['resource', 'strategic'],
    historical_events: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    relative_x: 50,
    relative_y: 50,
    controlling_faction_id: null
  };

  const mockBeat: WorldBeat = {
    id: 'beat-1',
    arc_id: 'arc-1',
    beat_index: 5,
    beat_type: 'dynamic',
    beat_name: 'Territorial Expansion',
    description: 'Factions vie for control',
    world_directives: [],
    emergent_storylines: [],
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    container.reset();
    vi.clearAllMocks();

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

    const factionAI: IFactionAI = {
      generateFaction: vi.fn(),
      updateDoctrine: vi.fn(),
      evaluateRelations: vi.fn(),
      generatePropaganda: vi.fn(),
    };

    worldRepo = {
      createWorld: vi.fn(),
      getWorld: vi.fn(),
      updateWorld: vi.fn(),
      listWorlds: vi.fn(),
      createArc: vi.fn(),
      getArc: vi.fn(),
      completeArc: vi.fn(),
      createBeat: vi.fn(),
      getBeats: vi.fn(),
      createEvent: vi.fn(),
      getRecentEvents: vi.fn(),
      getCurrentBeat: vi.fn(),
      getWorldArcs: vi.fn(),
      getArcBeats: vi.fn(),
      getBeatEvents: vi.fn(),
    };

    locationRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByWorldId: vi.fn(),
      delete: vi.fn(),
      addHistoricalEvent: vi.fn(),
    };

    container.register('IFactionRepository', { useValue: factionRepo });
    container.register('IFactionAI', { useValue: factionAI });
    container.register('WorldRepo', { useValue: worldRepo });
    container.register('LocationRepository', { useValue: locationRepo });

    emitSpy = vi.spyOn(eventBus, 'emit');
    factionService = container.resolve(FactionService);
  });

  describe('claimLocation', () => {
    it('should allow faction to claim a location through conquest', async () => {
      vi.mocked(factionRepo.findById).mockResolvedValue(mockFaction);
      vi.mocked(locationRepo.findById).mockResolvedValue(mockLocation);
      vi.mocked(worldRepo.getCurrentBeat).mockResolvedValue(mockBeat);

      await factionService.claimLocation('faction-1', 'location-2', 'conquest');

      expect(factionRepo.update).toHaveBeenCalledWith('faction-1', {
        controlled_locations: ['location-1', 'location-2']
      });

      expect(locationRepo.update).toHaveBeenCalledWith('location-2', {
        controlling_faction_id: 'faction-1'
      });

      expect(emitSpy).toHaveBeenCalledWith('faction.took_location', {
        v: 1,
        worldId: 'world-1',
        factionId: 'faction-1',
        locationId: 'location-2',
        method: 'conquest',
        beatId: 'beat-1',
        beatIndex: 5
      });

      expect(factionRepo.addHistoricalEvent).toHaveBeenCalledWith(
        'faction-1',
        expect.objectContaining({
          event: 'Claimed control of Crystal Mines through conquest',
          beat_index: 5
        })
      );
    });

    it('should prevent duplicate location claims', async () => {
      const factionWithLocation = {
        ...mockFaction,
        controlled_locations: ['location-1', 'location-2']
      };

      vi.mocked(factionRepo.findById).mockResolvedValue(factionWithLocation);
      vi.mocked(locationRepo.findById).mockResolvedValue(mockLocation);
      vi.mocked(worldRepo.getCurrentBeat).mockResolvedValue(mockBeat);

      await factionService.claimLocation('faction-1', 'location-2', 'treaty');

      expect(factionRepo.update).toHaveBeenCalledWith('faction-1', {
        controlled_locations: ['location-1', 'location-2']
      });
    });

    it('should throw if faction not found', async () => {
      vi.mocked(factionRepo.findById).mockResolvedValue(null);

      await expect(
        factionService.claimLocation('non-existent', 'location-2', 'conquest')
      ).rejects.toThrow('Faction not found');
    });

    it('should throw if location not found', async () => {
      vi.mocked(factionRepo.findById).mockResolvedValue(mockFaction);
      vi.mocked(locationRepo.findById).mockResolvedValue(null);

      await expect(
        factionService.claimLocation('faction-1', 'non-existent', 'conquest')
      ).rejects.toThrow('Location not found');
    });
  });

  describe('releaseLocation', () => {
    it('should allow faction to release control of a location', async () => {
      const factionWithLocations = {
        ...mockFaction,
        controlled_locations: ['location-1', 'location-2', 'location-3']
      };

      vi.mocked(factionRepo.findById).mockResolvedValue(factionWithLocations);
      vi.mocked(locationRepo.findById).mockResolvedValue({
        ...mockLocation,
        id: 'location-2',
        controlling_faction_id: 'faction-1'
      });
      vi.mocked(worldRepo.getCurrentBeat).mockResolvedValue(mockBeat);

      await factionService.releaseLocation('faction-1', 'location-2', 'Strategic withdrawal');

      expect(factionRepo.update).toHaveBeenCalledWith('faction-1', {
        controlled_locations: ['location-1', 'location-3']
      });

      expect(locationRepo.update).toHaveBeenCalledWith('location-2', {
        controlling_faction_id: null
      });

      expect(emitSpy).toHaveBeenCalledWith('faction.lost_location', {
        v: 1,
        worldId: 'world-1',
        factionId: 'faction-1',
        locationId: 'location-2',
        reason: 'Strategic withdrawal',
        beatId: 'beat-1',
        beatIndex: 5
      });

      expect(factionRepo.addHistoricalEvent).toHaveBeenCalledWith(
        'faction-1',
        expect.objectContaining({
          event: 'Lost control of Crystal Mines: Strategic withdrawal',
          beat_index: 5
        })
      );
    });
  });

  describe('checkTerritory', () => {
    it('should release location when it becomes ruins', async () => {
      const ruinedLocation = {
        ...mockLocation,
        controlling_faction_id: 'faction-1',
        status: 'ruined' as const
      };

      vi.mocked(locationRepo.findById).mockResolvedValue(ruinedLocation);
      vi.mocked(factionRepo.findById).mockResolvedValue(mockFaction);
      vi.mocked(worldRepo.getCurrentBeat).mockResolvedValue(mockBeat);

      await factionService['checkTerritory']({
        locationId: 'location-2',
        newStatus: 'ruins'
      });

      expect(factionRepo.update).toHaveBeenCalledWith('faction-1', {
        controlled_locations: ['location-1']
      });

      expect(locationRepo.update).toHaveBeenCalledWith('location-2', {
        controlling_faction_id: null
      });
    });

    it('should set faction to declining if they lose their last location', async () => {
      const factionWithOneLocation = {
        ...mockFaction,
        controlled_locations: ['location-2']
      };

      const destroyedLocation = {
        ...mockLocation,
        controlling_faction_id: 'faction-1',
        status: 'destroyed' as const
      };

      vi.mocked(locationRepo.findById).mockResolvedValue(destroyedLocation);
      vi.mocked(factionRepo.findById)
        .mockResolvedValueOnce(factionWithOneLocation)
        .mockResolvedValueOnce(factionWithOneLocation);
      vi.mocked(worldRepo.getCurrentBeat).mockResolvedValue(mockBeat);
      vi.mocked(worldRepo.getWorld).mockResolvedValue({
        id: 'world-1',
        user_id: 'user-1',
        name: 'Test World',
        description: 'A test world',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await factionService['checkTerritory']({
        locationId: 'location-2',
        newStatus: 'destroyed'
      });

      expect(factionRepo.update).toHaveBeenCalledWith('faction-1', {
        status: 'declining'
      });
    });
  });
});