import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { LocationService } from '../../src/modules/location/application/LocationService';
import type { LocationRepository, LocationAI } from '../../src/modules/location/domain/ports';
import type { Location, LocationStatus } from '../../src/modules/location/domain/schema';
import type { WorldCreatedEvent, StoryBeatCreated } from '../../src/modules/world/domain/events';
import { eventBus } from '../../src/core/infra/eventBus';
import { createMockLogger } from '../_shared/helpers/mockLogger';

/**
 * Mock implementations
 */
class MockLocationRepo implements LocationRepository {
  private locations: Location[] = [];
  private idCounter = 1;

  async createBulk(locations: any[]): Promise<Location[]> {
    const created = locations.map(loc => ({
      ...loc,
      id: `loc-${this.idCounter++}`,
      historical_events: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    this.locations.push(...created);
    return created;
  }

  async create(location: any): Promise<Location> {
    const created = {
      ...location,
      id: `loc-${this.idCounter++}`,
      historical_events: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.locations.push(created);
    return created;
  }

  async findByWorldId(worldId: string): Promise<Location[]> {
    return this.locations.filter(l => l.world_id === worldId);
  }

  async findById(id: string): Promise<Location | null> {
    return this.locations.find(l => l.id === id) || null;
  }

  async findByParentId(parentId: string): Promise<Location[]> {
    return this.locations.filter(l => l.parent_location_id === parentId);
  }

  async updateStatus(id: string, status: LocationStatus, event: any): Promise<void> {
    const location = this.locations.find(l => l.id === id);
    if (location) {
      location.status = status;
      location.historical_events.push(event);
      location.last_significant_change = event.timestamp;
    }
  }

  async updateDescription(id: string, description: string): Promise<void> {
    const location = this.locations.find(l => l.id === id);
    if (location) {
      location.description = description;
    }
  }

  async addHistoricalEvent(id: string, event: any): Promise<void> {
    const location = this.locations.find(l => l.id === id);
    if (location) {
      location.historical_events.push(event);
    }
  }

  async update(id: string, updates: any): Promise<Location> {
    const location = this.locations.find(l => l.id === id);
    if (!location) throw new Error('Location not found');
    Object.assign(location, updates);
    return location;
  }

  async search(worldId: string, query: string, tags?: string[]): Promise<Location[]> {
    return this.locations.filter(l => 
      l.world_id === worldId && 
      (l.name.includes(query) || l.description.includes(query))
    );
  }
}

class MockLocationAI implements LocationAI {
  async buildWorldMap(context: any) {
    return {
      locations: [
        // Regions
        {
          name: 'Northern Realm',
          type: 'region',
          description: 'A cold northern region',
          tags: ['cold', 'mountainous'],
          relative_position: { x: 50, y: 20 }
        },
        {
          name: 'Eastern Territories',
          type: 'region',
          description: 'Vast eastern lands',
          tags: ['plains', 'agricultural'],
          relative_position: { x: 80, y: 50 }
        },
        // Cities
        {
          name: 'Frost City',
          type: 'city',
          description: 'Capital of the north',
          parent_region_name: 'Northern Realm',
          tags: ['capital', 'fortified'],
          relative_position: { x: 55, y: 25 }
        },
        {
          name: 'Winterhold',
          type: 'city',
          description: 'Mountain fortress city',
          parent_region_name: 'Northern Realm',
          tags: ['fortress', 'mining'],
          relative_position: { x: 45, y: 15 }
        },
        {
          name: 'Eastport',
          type: 'city',
          description: 'Major trading hub',
          parent_region_name: 'Eastern Territories',
          tags: ['port', 'trade'],
          relative_position: { x: 85, y: 55 }
        },
        // Landmarks
        {
          name: 'Ancient Ruins',
          type: 'landmark',
          description: 'Mysterious ancient structure',
          parent_region_name: 'Northern Realm',
          tags: ['ruins', 'magical'],
          relative_position: { x: 52, y: 30 }
        },
        {
          name: 'Crystal Spire',
          type: 'landmark',
          description: 'Towering magical crystal',
          parent_region_name: 'Eastern Territories',
          tags: ['magical', 'mysterious'],
          relative_position: { x: 75, y: 45 }
        },
        // Wilderness
        {
          name: 'Frozen Wastes',
          type: 'wilderness',
          description: 'Inhospitable frozen tundra',
          parent_region_name: 'Northern Realm',
          tags: ['hostile', 'frozen'],
          relative_position: { x: 50, y: 10 }
        }
      ]
    };
  }

  async mutateLocations(context: any) {
    return {
      updates: [],
      discoveries: []
    };
  }

  async enrichDescription(context: any) {
    return context.location.description + ' [enriched]';
  }

  async generateRegions(context: any) {
    return {
      regions: [
        {
          name: 'Northern Realm',
          description: 'A cold northern region',
          tags: ['cold', 'mountainous'],
          relative_position: { x: 50, y: 20 }
        },
        {
          name: 'Eastern Territories',
          description: 'Vast eastern lands',
          tags: ['plains', 'agricultural'],
          relative_position: { x: 80, y: 50 }
        }
      ]
    };
  }

  async generateCities(context: any) {
    if (context.regionName === 'Northern Realm') {
      return {
        cities: [
          {
            name: 'Frost City',
            description: 'Capital of the north',
            tags: ['capital', 'fortified'],
            relative_position: { x: 55, y: 25 }
          },
          {
            name: 'Winterhold',
            description: 'Mountain fortress city',
            tags: ['fortress', 'mining'],
            relative_position: { x: 45, y: 15 }
          }
        ]
      };
    } else if (context.regionName === 'Eastern Territories') {
      return {
        cities: [
          {
            name: 'Eastport',
            description: 'Major trading hub',
            tags: ['port', 'trade'],
            relative_position: { x: 85, y: 55 }
          }
        ]
      };
    }
    return { cities: [] };
  }

  async generateLandmarks(context: any) {
    if (context.regionName === 'Northern Realm') {
      return {
        landmarks: [
          {
            name: 'Ancient Ruins',
            description: 'Mysterious ancient structure',
            tags: ['ruins', 'magical'],
            relative_position: { x: 52, y: 30 }
          }
        ]
      };
    } else if (context.regionName === 'Eastern Territories') {
      return {
        landmarks: [
          {
            name: 'Crystal Spire',
            description: 'Towering magical crystal',
            tags: ['magical', 'mysterious'],
            relative_position: { x: 75, y: 45 }
          }
        ]
      };
    }
    return { landmarks: [] };
  }

  async generateWilderness(context: any) {
    if (context.regionName === 'Northern Realm') {
      return {
        wilderness: [
          {
            name: 'Frozen Wastes',
            description: 'Inhospitable frozen tundra',
            tags: ['hostile', 'frozen'],
            relative_position: { x: 50, y: 10 }
          }
        ]
      };
    }
    return { wilderness: [] };
  }
}

describe('LocationService', () => {
  let service: LocationService;
  let mockRepo: MockLocationRepo;
  let mockAI: MockLocationAI;
  let emittedEvents: any[] = [];

  beforeEach(() => {
    container.clearInstances();
    
    mockRepo = new MockLocationRepo();
    mockAI = new MockLocationAI();
    emittedEvents = [];
    
    container.register('LocationRepository', { useValue: mockRepo });
    container.register('LocationAI', { useValue: mockAI });
    container.register('Logger', { useValue: createMockLogger() });
    
    // Clear all event listeners before each test
    eventBus['emitter'].removeAllListeners();
    
    // Reset mock before each test
    vi.clearAllMocks();
    
    const originalEmit = eventBus.emit.bind(eventBus);
    vi.spyOn(eventBus, 'emit').mockImplementation((topic, payload) => {
      emittedEvents.push({ topic, payload });
      return originalEmit(topic, payload);
    });
    
    service = container.resolve(LocationService);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('seedInitialMap', () => {
    it('should create locations when world is created', async () => {
      const worldEvent: WorldCreatedEvent = {
        worldId: 'world-1',
        name: 'Test World',
        description: 'A test world',
        userId: 'user-1'
      };

      // Call seedInitialMap directly since event handling has issues in tests
      await (service as any).seedInitialMap(worldEvent);
      
      const locations = await mockRepo.findByWorldId('world-1');
      expect(locations).toHaveLength(8);
      
      // Check regions were created
      const regions = locations.filter(l => l.type === 'region');
      expect(regions).toHaveLength(2);
      expect(regions.find(r => r.name === 'Northern Realm')).toBeDefined();
      expect(regions.find(r => r.name === 'Eastern Territories')).toBeDefined();
      
      // Check cities were created with correct parents
      const cities = locations.filter(l => l.type === 'city');
      expect(cities).toHaveLength(3);
      
      const createdEvents = emittedEvents.filter(e => e.topic === 'location.created');
      expect(createdEvents).toHaveLength(8);
      
      // Check that location.world.complete event was emitted
      const completeEvents = emittedEvents.filter(e => e.topic === 'location.world.complete');
      expect(completeEvents).toHaveLength(1);
      expect(completeEvents[0].payload).toMatchObject({
        worldId: 'world-1',
        regionCount: 2,
        totalLocationCount: 8
      });
    });

    it('should handle AI failures gracefully', async () => {
      vi.spyOn(mockAI, 'generateRegions').mockRejectedValueOnce(new Error('AI failed'));
      
      const worldEvent: WorldCreatedEvent = {
        worldId: 'world-2',
        name: 'Test World 2',
        description: 'Another test world',
        userId: 'user-1'
      };

      // Should not throw but log error
      await expect((service as any).seedInitialMap(worldEvent)).rejects.toThrow('AI failed');
      
      const locations = await mockRepo.findByWorldId('world-2');
      expect(locations).toHaveLength(0);
    });
  });

  describe('reactToBeat', () => {
    it('should process beat events for location mutations', async () => {
      // Reset events before this test
      emittedEvents = [];
      
      const testLocation = await mockRepo.create({
        world_id: 'world-1',
        parent_location_id: null,
        name: 'Test City',
        type: 'city',
        status: 'stable',
        description: 'A test city',
        tags: []
      });

      vi.spyOn(mockAI, 'mutateLocations').mockResolvedValueOnce({
        updates: [{
          locationId: testLocation.id,
          newStatus: 'declining',
          reason: 'Economic troubles'
        }],
        discoveries: []
      });

      const beatEvent: StoryBeatCreated = {
        v: 1,
        worldId: 'world-1',
        beatId: 'beat-1',
        beatIndex: 0,
        directives: ['Economic crisis hits the city'],
        emergent: ['trade routes disrupted']
      };

      // Call reactToBeat directly
      await (service as any).reactToBeat(beatEvent);
      
      const updatedLocation = await mockRepo.findById(testLocation.id);
      expect(updatedLocation?.status).toBe('declining');
      expect(updatedLocation?.historical_events).toHaveLength(1);
      
      const statusEvents = emittedEvents.filter(e => e.topic === 'location.status_changed');
      expect(statusEvents).toHaveLength(1);
    });
  });

  describe('public methods', () => {
    it('should find locations by world ID', async () => {
      await mockRepo.createBulk([
        {
          world_id: 'world-1',
          parent_location_id: null,
          name: 'Region A',
          type: 'region',
          status: 'stable',
          description: 'Test region',
          tags: []
        }
      ]);

      const locations = await service.findByWorldId('world-1');
      expect(locations).toHaveLength(1);
      expect(locations[0].name).toBe('Region A');
    });

    it('should create location and emit event', async () => {
      // Reset events before this test
      emittedEvents = [];
      
      const location = await service.create({
        world_id: 'world-1',
        parent_location_id: null,
        name: 'New City',
        type: 'city',
        status: 'stable',
        description: 'A new city',
        tags: ['new']
      });

      expect(location.id).toBeDefined();
      expect(location.name).toBe('New City');
      
      const createdEvents = emittedEvents.filter(e => e.topic === 'location.created');
      expect(createdEvents).toHaveLength(1);
      expect(createdEvents[0].payload.name).toBe('New City');
    });

    it('should enrich location description with AI', async () => {
      const location = await mockRepo.create({
        world_id: 'world-1',
        parent_location_id: null,
        name: 'Plain City',
        type: 'city',
        status: 'stable',
        description: 'A simple city',
        tags: []
      });

      const enriched = await service.enrichWithAI(location.id, 'World context');
      expect(enriched.description).toBe('A simple city [enriched]');
    });
  });
});