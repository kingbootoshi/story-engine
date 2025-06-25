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
      mutateLocations: vi.fn(),
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


    it('should handle when mutation decision is false', async () => {
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


      // Execute the method
      await service['reactToBeat'](beatEvent);

      // Verify no further AI calls were made
      expect(mockAI.mutateLocations).not.toHaveBeenCalled();
      expect(mockRepo.findByWorldId).not.toHaveBeenCalled();
    });
  });
});