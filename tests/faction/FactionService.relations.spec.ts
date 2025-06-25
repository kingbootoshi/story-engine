import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DI as container } from '../../src/core/infra/container';
import { eventBus } from '../../src/core/infra/eventBus';
import type { IFactionRepository, IFactionAI } from '../../src/modules/faction/domain/ports';
import type { Faction, FactionRelation } from '../../src/modules/faction/domain/schema';
import { FactionService } from '../../src/modules/faction/application/FactionService';
import type { WorldRepo } from '../../src/modules/world/domain/ports';
import type { LocationRepository } from '../../src/modules/location/domain/ports';

describe('FactionService.relations', () => {
  let factionService: FactionService;
  let factionRepo: IFactionRepository;
  let factionAI: IFactionAI;
  let emitSpy: ReturnType<typeof vi.spyOn>;

  const mockFaction: Faction = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    world_id: 'world-1',
    name: 'Trade Federation',
    ideology: 'Profit above all else',
    status: 'stable',
    members_estimate: 100000,
    tags: ['mercantile', 'neutral'],
    banner_color: '#FFD700',
    emblem_svg: null,
    home_location_id: null,
    controlled_locations: [],
    historical_events: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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

    const worldRepo = {
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

  describe('setStance', () => {
    it('should set diplomatic stance between factions', async () => {
      const sourceId = '550e8400-e29b-41d4-a716-446655440001';
      const targetId = '550e8400-e29b-41d4-a716-446655440002';
      const stance = 'ally' as const;
      const reason = 'Mutual defense pact signed';

      vi.mocked(factionRepo.findById).mockResolvedValue(mockFaction);
      vi.mocked(factionRepo.getRelation).mockResolvedValue(null);

      await factionService.setStance(sourceId, targetId, stance, reason);

      expect(factionRepo.setRelation).toHaveBeenCalledWith(
        sourceId,
        targetId,
        stance,
        'world-1'
      );

      expect(emitSpy).toHaveBeenCalledWith('faction.relation_changed', {
        v: 1,
        worldId: 'world-1',
        sourceId,
        targetId,
        previous: 'neutral',
        next: stance,
        reason
      });
    });

    it('should track previous stance when changing relations', async () => {
      const sourceId = '550e8400-e29b-41d4-a716-446655440001';
      const targetId = '550e8400-e29b-41d4-a716-446655440002';
      const existingRelation: FactionRelation = {
        id: 'relation-1',
        world_id: 'world-1',
        source_id: sourceId,
        target_id: targetId,
        stance: 'hostile',
        last_changed: new Date().toISOString()
      };

      vi.mocked(factionRepo.findById).mockResolvedValue(mockFaction);
      vi.mocked(factionRepo.getRelation).mockResolvedValue(existingRelation);

      await factionService.setStance(sourceId, targetId, 'neutral', 'Peace treaty signed');

      expect(emitSpy).toHaveBeenCalledWith('faction.relation_changed', {
        v: 1,
        worldId: 'world-1',
        sourceId,
        targetId,
        previous: 'hostile',
        next: 'neutral',
        reason: 'Peace treaty signed'
      });
    });

    it('should throw if source faction not found', async () => {
      vi.mocked(factionRepo.findById).mockResolvedValue(null);

      await expect(
        factionService.setStance('non-existent', 'faction-2', 'ally', 'Test')
      ).rejects.toThrow('Source faction not found');
    });
  });

  describe('getStances', () => {
    it('should return all diplomatic stances for a faction', async () => {
      const factionId = '550e8400-e29b-41d4-a716-446655440001';
      const relations: FactionRelation[] = [
        {
          id: 'rel-1',
          world_id: 'world-1',
          source_id: factionId,
          target_id: '550e8400-e29b-41d4-a716-446655440002',
          stance: 'ally',
          last_changed: new Date().toISOString()
        },
        {
          id: 'rel-2',
          world_id: 'world-1',
          source_id: '550e8400-e29b-41d4-a716-446655440003',
          target_id: factionId,
          stance: 'hostile',
          last_changed: new Date().toISOString()
        }
      ];

      vi.mocked(factionRepo.getRelations).mockResolvedValue(relations);

      const result = await factionService.getStances(factionId);

      expect(result).toEqual([
        { targetId: '550e8400-e29b-41d4-a716-446655440002', stance: 'ally' },
        { targetId: '550e8400-e29b-41d4-a716-446655440003', stance: 'hostile' }
      ]);
    });
  });

  describe('evaluateRelations', () => {
    it('should evaluate and update faction relations based on AI suggestions', async () => {
      const worldId = 'world-1';
      const factions: Faction[] = [
        mockFaction,
        {
          ...mockFaction,
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'War Clan',
          ideology: 'Might makes right',
          tags: ['militaristic', 'aggressive']
        }
      ];

      const suggestions = [
        {
          sourceId: '550e8400-e29b-41d4-a716-446655440001',
          targetId: '550e8400-e29b-41d4-a716-446655440002',
          suggestedStance: 'hostile' as const,
          reason: 'Trade disputes escalated to embargo'
        }
      ];

      vi.mocked(factionRepo.findByWorldId).mockResolvedValue(factions);
      vi.mocked(factionRepo.getRelations).mockResolvedValue([]);
      vi.mocked(factionAI.evaluateRelations).mockResolvedValue(suggestions);
      vi.mocked(factionRepo.findById).mockResolvedValue(mockFaction);
      vi.mocked(factionRepo.getRelation).mockResolvedValue(null);

      await factionService.evaluateRelations(worldId, 'Recent war broke out');

      expect(factionAI.evaluateRelations).toHaveBeenCalledWith({
        worldId,
        factions,
        currentRelations: [],
        beatContext: 'Recent war broke out'
      });

      expect(factionRepo.setRelation).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        'hostile',
        worldId
      );
    });

    it('should skip evaluation if less than 2 factions exist', async () => {
      vi.mocked(factionRepo.findByWorldId).mockResolvedValue([mockFaction]);

      await factionService.evaluateRelations('world-1', 'Beat context');

      expect(factionAI.evaluateRelations).not.toHaveBeenCalled();
    });
  });
});