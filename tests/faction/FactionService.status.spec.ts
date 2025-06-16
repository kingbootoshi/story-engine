import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DI as container } from '../../src/core/infra/container';
import { eventBus } from '../../src/core/infra/eventBus';
import type { IFactionRepository, IFactionAI } from '../../src/modules/faction/domain/ports';
import type { Faction, FactionStatus } from '../../src/modules/faction/domain/schema';
import { FactionService } from '../../src/modules/faction/application/FactionService';
import type { WorldRepo } from '../../src/modules/world/domain/ports';
import type { LocationRepository } from '../../src/modules/location/domain/ports';
import type { WorldBeat } from '../../src/modules/world/domain/schema';

describe('FactionService.status', () => {
  let factionService: FactionService;
  let factionRepo: IFactionRepository;
  let factionAI: IFactionAI;
  let worldRepo: WorldRepo;
  let emitSpy: ReturnType<typeof vi.spyOn>;

  const mockFaction: Faction = {
    id: 'faction-1',
    world_id: 'world-1',
    name: 'Merchant Guild',
    ideology: 'Trade is the lifeblood of civilization',
    status: 'stable',
    members_estimate: 75000,
    tags: ['mercantile', 'diplomatic'],
    banner_color: '#FFD700',
    emblem_svg: null,
    home_location_id: 'location-1',
    controlled_locations: ['location-1', 'location-2'],
    historical_events: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockBeat: WorldBeat = {
    id: 'beat-1',
    arc_id: 'arc-1',
    beat_index: 7,
    beat_type: 'dynamic',
    beat_name: 'Economic Upheaval',
    description: 'Markets crash across the realm',
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

    factionAI = {
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

    const locationRepo = {
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

  describe('setStatus', () => {
    it('should change faction status and update doctrine', async () => {
      vi.mocked(factionRepo.findById).mockResolvedValue(mockFaction);
      vi.mocked(worldRepo.getCurrentBeat).mockResolvedValue(mockBeat);
      vi.mocked(worldRepo.getWorld).mockResolvedValue({
        id: 'world-1',
        user_id: 'user-1',
        name: 'Trade World',
        description: 'A world of commerce and intrigue',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const updatedDoctrine = {
        ideology: 'Adapt or perish - new markets must be found',
        tags: ['mercantile', 'aggressive', 'expansionist']
      };

      vi.mocked(factionAI.updateDoctrine).mockResolvedValue(updatedDoctrine);

      await factionService.setStatus('faction-1', 'declining', 'Economic crash devastated trade routes');

      expect(factionRepo.update).toHaveBeenCalledWith('faction-1', {
        status: 'declining'
      });

      expect(factionRepo.addHistoricalEvent).toHaveBeenCalledWith(
        'faction-1',
        expect.objectContaining({
          event: 'Status changed from stable to declining: Economic crash devastated trade routes',
          previous_status: 'stable',
          beat_index: 7
        })
      );

      expect(factionAI.updateDoctrine).toHaveBeenCalledWith({
        faction: mockFaction,
        statusChange: {
          from: 'stable',
          to: 'declining',
          reason: 'Economic crash devastated trade routes'
        },
        worldContext: 'A world of commerce and intrigue'
      });

      expect(factionRepo.update).toHaveBeenCalledWith('faction-1', {
        ideology: updatedDoctrine.ideology,
        tags: updatedDoctrine.tags
      });

      expect(emitSpy).toHaveBeenCalledWith('faction.status_changed', {
        v: 1,
        worldId: 'world-1',
        factionId: 'faction-1',
        prev: 'stable',
        next: 'declining',
        reason: 'Economic crash devastated trade routes',
        beatId: 'beat-1',
        beatIndex: 7
      });
    });

    it('should skip if status is already the same', async () => {
      vi.mocked(factionRepo.findById).mockResolvedValue(mockFaction);

      await factionService.setStatus('faction-1', 'stable', 'No change needed');

      expect(factionRepo.update).not.toHaveBeenCalled();
      expect(factionRepo.addHistoricalEvent).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalledWith('faction.status_changed', expect.anything());
    });

    it('should handle collapsed status', async () => {
      const decliningFaction = {
        ...mockFaction,
        status: 'declining' as FactionStatus
      };

      vi.mocked(factionRepo.findById).mockResolvedValue(decliningFaction);
      vi.mocked(worldRepo.getCurrentBeat).mockResolvedValue(mockBeat);
      vi.mocked(worldRepo.getWorld).mockResolvedValue({
        id: 'world-1',
        user_id: 'user-1',
        name: 'Trade World',
        description: 'A world of commerce and intrigue',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const finalDoctrine = {
        ideology: 'The guild is no more - may future merchants learn from our mistakes',
        tags: ['defunct', 'historical']
      };

      vi.mocked(factionAI.updateDoctrine).mockResolvedValue(finalDoctrine);

      await factionService.setStatus('faction-1', 'collapsed', 'Complete bankruptcy and dissolution');

      expect(factionRepo.update).toHaveBeenCalledWith('faction-1', {
        status: 'collapsed'
      });

      expect(factionRepo.addHistoricalEvent).toHaveBeenCalledWith(
        'faction-1',
        expect.objectContaining({
          event: 'Status changed from declining to collapsed: Complete bankruptcy and dissolution',
          previous_status: 'declining',
          beat_index: 7
        })
      );
    });

    it('should throw if faction not found', async () => {
      vi.mocked(factionRepo.findById).mockResolvedValue(null);

      await expect(
        factionService.setStatus('non-existent', 'rising', 'Test')
      ).rejects.toThrow('Faction not found');
    });
  });

  describe('getHistory', () => {
    it('should return faction historical events in reverse chronological order', async () => {
      const factionWithHistory = {
        ...mockFaction,
        historical_events: [
          {
            timestamp: '2024-01-01T00:00:00Z',
            event: 'Founded the Merchant Guild',
            beat_index: 0
          },
          {
            timestamp: '2024-02-01T00:00:00Z',
            event: 'Established trade route with Eastern Kingdoms',
            beat_index: 3
          },
          {
            timestamp: '2024-03-01T00:00:00Z',
            event: 'Status changed from rising to stable',
            previous_status: 'rising' as FactionStatus,
            beat_index: 5
          }
        ]
      };

      vi.mocked(factionRepo.findById).mockResolvedValue(factionWithHistory);

      const history = await factionService.getHistory('faction-1', 2);

      expect(history).toHaveLength(2);
      expect(history[0].event).toBe('Status changed from rising to stable');
      expect(history[1].event).toBe('Established trade route with Eastern Kingdoms');
    });

    it('should throw if faction not found', async () => {
      vi.mocked(factionRepo.findById).mockResolvedValue(null);

      await expect(
        factionService.getHistory('non-existent')
      ).rejects.toThrow('Faction not found');
    });
  });
});