import { randomUUID } from 'crypto';
import type { World, WorldArc, WorldBeat, WorldEvent, CreateEvent } from '../../../src/modules/world/domain/schema';
import type { WorldRepo } from '../../../src/modules/world/domain/ports';

export class InMemoryWorldRepo implements WorldRepo {
  private worlds = new Map<string, World>();
  private arcs = new Map<string, WorldArc>();
  private beats = new Map<string, WorldBeat>();
  private events = new Map<string, WorldEvent>();

  async createWorld(data: { name: string; description: string }): Promise<World> {
    const id = randomUUID();
    const world: World = {
      id,
      name: data.name,
      description: data.description,
      created_at: new Date().toISOString(),
      current_arc_id: null,
      updated_at: null,
    };
    this.worlds.set(id, world);
    // Logging is handled by the service layer in tests
    return world;
  }

  async getWorld(id: string): Promise<World | null> {
    return this.worlds.get(id) || null;
  }

  async listWorlds(): Promise<World[]> {
    return Array.from(this.worlds.values());
  }

  async updateWorld(id: string, data: Partial<World>): Promise<void> {
    const world = this.worlds.get(id);
    if (!world) throw new Error(`World ${id} not found`);
    Object.assign(world, data);
  }

  async createArc(worldId: string, storyName: string, storyIdea: string): Promise<WorldArc> {
    const id = randomUUID();
    const arc: WorldArc = {
      id,
      world_id: worldId,
      arc_number: this.getNextArcNumber(worldId),
      story_name: storyName,
      story_idea: storyIdea,
      status: 'active',
      created_at: new Date().toISOString(),
      completed_at: null,
      summary: null,
    };
    this.arcs.set(id, arc);
    return arc;
  }

  async getArc(arcId: string): Promise<WorldArc | null> {
    return this.arcs.get(arcId) || null;
  }

  async getWorldArcs(worldId: string): Promise<WorldArc[]> {
    return Array.from(this.arcs.values()).filter(arc => arc.world_id === worldId);
  }

  async completeArc(arcId: string, summary: string): Promise<void> {
    const arc = this.arcs.get(arcId);
    if (!arc) throw new Error(`Arc ${arcId} not found`);
    arc.completed_at = new Date().toISOString();
    arc.summary = summary;
    arc.status = 'completed';
  }

  private getNextArcNumber(worldId: string): number {
    const arcsForWorld = Array.from(this.arcs.values()).filter(a => a.world_id === worldId);
    return arcsForWorld.length + 1;
  }

  async createBeat(
    arcId: string,
    beatIndex: number,
    beatType: 'anchor' | 'dynamic',
    data: {
      beat_name: string;
      description: string;
      world_directives: string[];
      emergent_storylines: string[];
    }
  ): Promise<WorldBeat> {
    const id = randomUUID();
    const beat: WorldBeat = {
      id,
      arc_id: arcId,
      beat_index: beatIndex,
      beat_type: beatType,
      beat_name: data.beat_name,
      description: data.description,
      world_directives: data.world_directives,
      emergent_storylines: data.emergent_storylines,
      created_at: new Date().toISOString(),
    };
    this.beats.set(id, beat);
    return beat;
  }

  async getArcBeats(arcId: string): Promise<WorldBeat[]> {
    return Array.from(this.beats.values())
      .filter(beat => beat.arc_id === arcId)
      .sort((a, b) => a.beat_index - b.beat_index);
  }

  async createEvent(event: CreateEvent): Promise<WorldEvent> {
    const id = randomUUID();
    const worldEvent: WorldEvent = {
      id,
      ...event,
      created_at: new Date().toISOString(),
    };
    this.events.set(id, worldEvent);
    return worldEvent;
  }

  async getRecentEvents(worldId: string, limit = 10): Promise<WorldEvent[]> {
    return Array.from(this.events.values())
      .filter(event => event.world_id === worldId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // Test helper methods
  clear(): void {
    this.worlds.clear();
    this.arcs.clear();
    this.beats.clear();
    this.events.clear();
  }
}