import { describe, it, expect, vi, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { LocationService } from '../../../src/modules/location/application/LocationService';
import type { LocationRepository, LocationAI } from '../../../src/modules/location/domain/ports';
import type { StoryBeatCreated } from '../../../src/modules/world/domain/events';
import { eventBus } from '../../../src/core/infra/eventBus';
import { createMockLogger } from '../../_shared/helpers/mockLogger';

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
  let mockWorldRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    container.clearInstances();
    
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

    mockWorldRepo = {
      getWorld: vi.fn().mockResolvedValue({
        id: 'world-123',
        user_id: 'user-123',
        name: 'Test World',
        description: 'A test world'
      })
    };

    // Register all dependencies in container
    container.register('LocationRepository', { useValue: mockRepo });
    container.register('LocationAI', { useValue: mockAI });
    container.register('WorldRepo', { useValue: mockWorldRepo });
    container.register('Logger', { useValue: createMockLogger() });
    
    service = container.resolve(LocationService);
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
      const testLocation = {
        id: '00000000-0000-4000-8000-000000000001',
        world_id: 'world-123',
        parent_location_id: null,
        name: 'Crystal City',
        type: 'city' as const,
        status: 'thriving' as const,
        description: 'A prosperous city built around crystal mines',
        tags: ['urban', 'mining'],
        relative_x: 0,
        relative_y: 0,
        historical_events: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_significant_change: null
      };
      
      vi.mocked(mockRepo.findByWorldId).mockResolvedValue([testLocation]);
      vi.mocked(mockRepo.findById).mockResolvedValue(testLocation);

      // Mock mutation results
      vi.mocked(mockAI.mutateLocations).mockResolvedValue({
        updates: [
          {
            locationId: '00000000-0000-4000-8000-000000000001',
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
        emergentStorylines: ['Natural disaster storyline'],
        userId: 'user-123'
      });


      // Verify mutations were executed
      expect(mockAI.mutateLocations).toHaveBeenCalled();
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        '00000000-0000-4000-8000-000000000001',
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
          locationId: '00000000-0000-4000-8000-000000000001',
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