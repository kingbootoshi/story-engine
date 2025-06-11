import { describe, it, expect, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { LocationService } from '../../src/modules/location/application/LocationService';
import { LocationRepository, LocationAI } from '../../src/modules/location/domain/ports';
import { CreateLocation, Location } from '../../src/modules/location/domain/schema';

class InMemoryLocationRepo implements LocationRepository {
  private data: Location[] = [];
  async createBulk(locations: CreateLocation[]): Promise<Location[]> {
    const created = locations.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      historical_events: [],
      last_significant_change: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Location));
    this.data.push(...created);
    return created;
  }
  async create(location: CreateLocation): Promise<Location> {
    const [saved] = await this.createBulk([location]);
    return saved;
  }
  async findByWorldId(worldId: string): Promise<Location[]> {
    return this.data.filter(l => l.world_id === worldId);
  }
  async findById(id: string): Promise<Location | null> { return this.data.find(l => l.id === id) || null; }
  async findByParentId(parentId: string): Promise<Location[]> { return this.data.filter(l => l.parent_location_id === parentId); }
  async updateStatus(): Promise<void> {}
  async updateDescription(): Promise<void> {}
  async addHistoricalEvent(): Promise<void> {}
  async update(): Promise<Location> { throw new Error('not implemented'); }
  async search(): Promise<Location[]> { return []; }
}

class FakeAI implements LocationAI {
  buildWorldMap = async () => { throw new Error('legacy not used'); };
  mutateLocations = async () => { throw new Error('not used'); };
  enrichDescription = async () => { throw new Error('not used'); };

  async generateRegions() {
    return [{
      name: 'Northreach',
      type: 'region',
      description: 'A cold northern expanse.',
      tags: [],
      relative_position: { x: 10, y: 10 }
    }];
  }
  async generateWilderness() {
    return [{
      name: 'Frost Woods',
      type: 'wilderness',
      description: 'An icy forest.',
      parent_region_name: 'Northreach',
      tags: [],
      relative_position: { x: 12, y: 15 }
    }];
  }
  async generateLandmarks() {
    return [{
      name: 'Shard Peak',
      type: 'landmark',
      description: 'A crystal mountain.',
      parent_region_name: 'Northreach',
      tags: [],
      relative_position: { x: 14, y: 12 }
    }];
  }
  async generateCities() {
    return [{
      name: 'Glacier Hold',
      type: 'city',
      description: 'A fortress city.',
      parent_region_name: 'Northreach',
      tags: [],
      relative_position: { x: 18, y: 16 }
    }];
  }
}

describe('LocationService staged generation', () => {
  beforeEach(() => {
    container.reset();
    container.register('LocationRepository', { useValue: new InMemoryLocationRepo() });
    container.register('LocationAI', { useValue: new FakeAI() });
  });

  it('creates locations in staged order', async () => {
    const svc = container.resolve(LocationService);
    const worldEvent = {
      v: 1,
      worldId: 'world-1',
      name: 'TestWorld',
      description: 'A place of wonder',
      timestamp: new Date().toISOString()
    } as any;

    await svc['seedInitialMap'](worldEvent);

    const repo = container.resolve<LocationRepository>('LocationRepository');
    const locs = await repo.findByWorldId('world-1');
    expect(locs.length).toBe(4);
    const types = locs.map(l => l.type);
    expect(types).toContain('region');
    expect(types).toContain('wilderness');
    expect(types).toContain('landmark');
    expect(types).toContain('city');
  });
});