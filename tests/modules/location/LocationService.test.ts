import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationService } from '../../../src/modules/location/application/LocationService';
import type { LocationRepository, LocationAI } from '../../../src/modules/location/domain/ports';
import type { StoryBeatCreated } from '../../../src/modules/world/domain/events';
import { eventBus } from '../../../src/core/infra/eventBus';

vi.mock('../../../src/core/infra/eventBus', () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn(),
  }
}));

describe('LocationService', () => {
  let service: LocationService;
  let mockRepo: LocationRepository;
  let mockAI: LocationAI;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRepo = {
      createBulk: vi.fn(),
      create: vi.fn(),
      findByWorldId: vi.fn(),
      findById: vi.fn(),
      findByParentId: vi.fn(),
      updateStatus: vi.fn(),
      updateDescription: vi.fn(),
      addHistoricalEvent: vi.fn(),
      update: vi.fn(),
      search: vi.fn(),
    } as any;

    mockAI = {
      buildWorldMap: vi.fn(),
      generateRegions: vi.fn(),
      generateCities: vi.fn(),
      generateLandmarks: vi.fn(),
      generateWilderness: vi.fn(),
      decideMutation: vi.fn(),
      decideDiscovery: vi.fn(),
      mutateLocations: vi.fn(),
      discoverLocations: vi.fn(),
      enrichDescription: vi.fn(),
    } as any;

    service = new LocationService(mockRepo, mockAI);
  });

  describe('reactToBeat', () => {
    it('should run decision agents and execute mutations when decided', async () => {
      const beatEvent: StoryBeatCreated = {
        v: 1,
        worldId: 'world-123',
        worldName: 'Test World',
        beatId: 'beat-456',
        beatIndex: 1,
        content: 'A massive earthquake shakes the city',
        directives: ['The city is damaged by earthquake'],
        emergent: ['Natural disaster storyline'],
        timestamp: new Date().toISOString()
      };

      // Mock decision results
      vi.mocked(mockAI.decideMutation).mockResolvedValue({
        think: 'The earthquake directly affects city locations',
        shouldMutate: true
      });

      vi.mocked(mockAI.decideDiscovery).mockResolvedValue({
        think: 'No new locations are revealed in this beat',
        shouldDiscover: false
      });

      // Mock locations
      vi.mocked(mockRepo.findByWorldId).mockResolvedValue([
        {
          id: 'loc-1',
          world_id: 'world-123',
          parent_location_id: null,
          name: 'Crystal City',
          type: 'city',
          status: 'thriving',
          description: 'A prosperous city built around crystal mines',
          tags: ['urban', 'mining'],
          relative_x: 0,
          relative_y: 0,
          historical_events: [],
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);

      // Mock mutation results
      vi.mocked(mockAI.mutateLocations).mockResolvedValue({
        updates: [
          {
            locationId: 'loc-1',
            newStatus: 'declining',
            reason: 'Earthquake damage to infrastructure',
            descriptionAppend: 'Cracks now run through the crystal structures.'
          }
        ]
      });

      // Execute the method
      await service['reactToBeat'](beatEvent);

      // Verify decision agents were called
      expect(mockAI.decideMutation).toHaveBeenCalledWith({
        worldId: 'world-123',
        beatDirectives: 'The city is damaged by earthquake',
        emergentStorylines: ['Natural disaster storyline']
      });

      expect(mockAI.decideDiscovery).toHaveBeenCalledWith({
        worldId: 'world-123',
        beatDirectives: 'The city is damaged by earthquake',
        emergentStorylines: ['Natural disaster storyline']
      });

      // Verify mutations were executed
      expect(mockAI.mutateLocations).toHaveBeenCalled();
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'loc-1',
        'declining',
        expect.objectContaining({
          event: 'Earthquake damage to infrastructure',
          previous_status: 'thriving',
          beat_index: 1
        })
      );

      // Verify discoveries were not executed
      expect(mockAI.discoverLocations).not.toHaveBeenCalled();

      // Verify events were emitted
      expect(eventBus.emit).toHaveBeenCalledWith(
        'location.status_changed',
        expect.objectContaining({
          locationId: 'loc-1',
          oldStatus: 'thriving',
          newStatus: 'declining'
        })
      );
    });

    it('should run discovery agent when decided', async () => {
      const beatEvent: StoryBeatCreated = {
        v: 1,
        worldId: 'world-123',
        worldName: 'Test World',
        beatId: 'beat-789',
        beatIndex: 2,
        content: 'Explorers discover a hidden valley',
        directives: ['A new location is discovered'],
        emergent: ['Exploration storyline'],
        timestamp: new Date().toISOString()
      };

      // Mock decision results
      vi.mocked(mockAI.decideMutation).mockResolvedValue({
        think: 'No existing locations are affected',
        shouldMutate: false
      });

      vi.mocked(mockAI.decideDiscovery).mockResolvedValue({
        think: 'A new valley location is explicitly discovered',
        shouldDiscover: true
      });

      // Mock locations with a region
      vi.mocked(mockRepo.findByWorldId).mockResolvedValue([
        {
          id: 'region-1',
          world_id: 'world-123',
          parent_location_id: null,
          name: 'Northern Mountains',
          type: 'region',
          status: 'stable',
          description: 'A mountainous region',
          tags: ['mountains'],
          relative_x: 0,
          relative_y: 100,
          historical_events: [],
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);

      // Mock discovery results
      vi.mocked(mockAI.discoverLocations).mockResolvedValue({
        discoveries: [
          {
            name: 'Hidden Valley',
            type: 'landmark',
            description: 'A lush valley hidden deep in the mountains',
            parentRegionName: 'Northern Mountains',
            tags: ['hidden', 'valley', 'lush']
          }
        ]
      });

      // Mock create to return the new location
      vi.mocked(mockRepo.create).mockResolvedValue({
        id: 'loc-new',
        world_id: 'world-123',
        parent_location_id: 'region-1',
        name: 'Hidden Valley',
        type: 'landmark',
        status: 'stable',
        description: 'A lush valley hidden deep in the mountains',
        tags: ['hidden', 'valley', 'lush'],
        relative_x: null,
        relative_y: null,
        historical_events: [],
        created_at: new Date(),
        updated_at: new Date()
      });

      // Execute the method
      await service['reactToBeat'](beatEvent);

      // Verify mutations were not executed
      expect(mockAI.mutateLocations).not.toHaveBeenCalled();

      // Verify discoveries were executed
      expect(mockAI.discoverLocations).toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Hidden Valley',
          type: 'landmark',
          parent_location_id: 'region-1'
        })
      );

      // Verify discovery event was emitted
      expect(eventBus.emit).toHaveBeenCalledWith(
        'location.discovered',
        expect.objectContaining({
          locationId: 'loc-new',
          locationName: 'Hidden Valley',
          type: 'landmark'
        })
      );
    });

    it('should handle when both decisions are false', async () => {
      const beatEvent: StoryBeatCreated = {
        v: 1,
        worldId: 'world-123',
        worldName: 'Test World',
        beatId: 'beat-000',
        beatIndex: 3,
        content: 'Characters have a conversation',
        directives: ['Focus on character dialogue'],
        emergent: ['Character development'],
        timestamp: new Date().toISOString()
      };

      // Mock both decisions as false
      vi.mocked(mockAI.decideMutation).mockResolvedValue({
        think: 'Pure character interaction with no location impact',
        shouldMutate: false
      });

      vi.mocked(mockAI.decideDiscovery).mockResolvedValue({
        think: 'No new locations mentioned or discovered',
        shouldDiscover: false
      });

      // Execute the method
      await service['reactToBeat'](beatEvent);

      // Verify no further AI calls were made
      expect(mockAI.mutateLocations).not.toHaveBeenCalled();
      expect(mockAI.discoverLocations).not.toHaveBeenCalled();
      expect(mockRepo.findByWorldId).not.toHaveBeenCalled();
    });
  });
});