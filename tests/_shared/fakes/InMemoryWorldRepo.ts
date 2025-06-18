import { randomUUID } from 'crypto';
import type { World, WorldArc, WorldBeat, WorldEvent, CreateEvent } from '../../../src/modules/world/domain/schema';
import type { WorldRepo } from '../../../src/modules/world/domain/ports';

export class InMemoryWorldRepo implements WorldRepo {
  private worlds = new Map<string, World>();
  private arcs = new Map<string, WorldArc>();
  private beats = new Map<string, WorldBeat>();
  private events = new Map<string, WorldEvent>();

  /**
   * In-memory implementation of `WorldRepo#createWorld` used in unit tests.
   *
   * The real repository layer (Supabase) generates the primary key server-side.
   * For tests, however, we often need deterministic IDs so we can reference
   * the newly created world in subsequent service calls. Therefore this fake
   * repo honours an optional `id` field on the input object – falling back to
   * a fresh `uuid` when none is provided.
   */
  async createWorld(
    data: { id?: string; name: string; description: string; user_id?: string }
  ): Promise<World> {
    const id = data.id ?? randomUUID();
    const world: World = {
      id,
      user_id: data.user_id ?? randomUUID(),
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

  async listWorlds(userId?: string): Promise<World[]> {
    const allWorlds = Array.from(this.worlds.values());
    return userId ? allWorlds.filter(w => w.user_id === userId) : allWorlds;
  }

  async updateWorld(id: string, data: Partial<World>): Promise<void> {
    const world = this.worlds.get(id);
    if (!world) throw new Error(`World ${id} not found`);
    Object.assign(world, data);
  }

  async createArc(worldId: string, storyName: string, storyIdea: string, detailedDescription?: string): Promise<WorldArc> {
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
      detailed_description: detailedDescription || '',
      current_beat_id: null,
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
  ): Promise<WorldBeat & { world_id: string }> {
    const id = randomUUID();
    const arc = this.arcs.get(arcId);
    if (!arc) throw new Error(`Arc ${arcId} not found`);
    
    const beat: WorldBeat & { world_id: string } = {
      id,
      arc_id: arcId,
      world_id: arc.world_id,
      beat_index: beatIndex,
      beat_type: beatType,
      beat_name: data.beat_name,
      description: data.description,
      world_directives: data.world_directives,
      emergent_storylines: data.emergent_storylines,
      created_at: new Date().toISOString(),
    };
    this.beats.set(id, beat);

    // -------------------------------------------------------------------
    // Pointer update follows the same business rule as the Supabase repo:
    //   • first anchor (index 0) → set pointer
    //   • subsequent anchors      → leave pointer untouched
    //   • dynamic beats           → always advance pointer
    // -------------------------------------------------------------------

    const shouldSetCurrent =
      beatType === 'dynamic' || (beatType === 'anchor' && beatIndex === 0);

    if (shouldSetCurrent) {
      arc.current_beat_id = id;
    }

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

  async getBeatEvents(beatId: string): Promise<WorldEvent[]> {
    return Array.from(this.events.values())
      .filter(event => event.beat_id === beatId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getCurrentBeat(arcId: string): Promise<WorldBeat | null> {
    const arc = this.arcs.get(arcId);
    if (!arc?.current_beat_id) return null;
    return this.beats.get(arc.current_beat_id) || null;
  }

  async getBeat(beatId: string): Promise<WorldBeat | null> {
    return this.beats.get(beatId) || null;
  }

  async getArcByWorld(worldId: string): Promise<WorldArc | null> {
    const arcs = Array.from(this.arcs.values())
      .filter(arc => arc.world_id === worldId && arc.status === 'active')
      .sort((a, b) => b.arc_number - a.arc_number);
    return arcs[0] || null;
  }

  async logWorldEvent(event: CreateEvent): Promise<void> {
    await this.createEvent(event);
  }


  // Test helper methods
  clear(): void {
    this.worlds.clear();
    this.arcs.clear();
    this.beats.clear();
    this.events.clear();
  }

  seed(world: World): void {
    this.worlds.set(world.id, world);
  }

  seedArc(arc: WorldArc): void {
    this.arcs.set(arc.id, arc);
  }

  seedBeat(beat: WorldBeat): void {
    this.beats.set(beat.id, beat);
  }

  seedEvent(event: WorldEvent): void {
    this.events.set(event.id, event);
  }
}