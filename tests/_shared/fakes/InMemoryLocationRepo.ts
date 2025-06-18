import type { 
  Location, 
  CreateLocation, 
  UpdateLocation 
} from '../../../src/modules/location/domain/schema';
import type { LocationRepository } from '../../../src/modules/location/domain/ports';

export class InMemoryLocationRepo implements LocationRepository {
  private locations = new Map<string, Location>();
  private idCounter = 1;

  async create(input: CreateLocation): Promise<Location> {
    const location: Location = {
      id: `location-${this.idCounter++}`,
      ...input,
      tags: input.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.locations.set(location.id, location);
    return { ...location };
  }

  async update(id: string, updates: UpdateLocation): Promise<Location> {
    const existing = this.locations.get(id);
    if (!existing) {
      throw new Error(`Location ${id} not found`);
    }

    const updated: Location = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.locations.set(id, updated);
    return { ...updated };
  }

  async findById(id: string): Promise<Location | null> {
    const location = this.locations.get(id);
    return location ? { ...location } : null;
  }

  async findByWorldId(worldId: string): Promise<Location[]> {
    return Array.from(this.locations.values())
      .filter(loc => loc.world_id === worldId)
      .map(loc => ({ ...loc }));
  }

  async findByControllingFaction(factionId: string): Promise<Location[]> {
    return Array.from(this.locations.values())
      .filter(loc => loc.controlling_faction_id === factionId)
      .map(loc => ({ ...loc }));
  }

  async delete(id: string): Promise<void> {
    this.locations.delete(id);
  }

  clear(): void {
    this.locations.clear();
    this.idCounter = 1;
  }

  seed(location: Location): void {
    this.locations.set(location.id, { ...location });
  }
}