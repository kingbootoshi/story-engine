import type { 
  Faction, 
  CreateFaction, 
  UpdateFaction,
  FactionRelation,
  HistoricalEvent
} from '../../../src/modules/faction/domain/schema';
import type { IFactionRepository } from '../../../src/modules/faction/domain/ports';

export class InMemoryFactionRepo implements IFactionRepository {
  private factions = new Map<string, Faction>();
  private relations = new Map<string, FactionRelation>();
  private idCounter = 1;

  async create(input: CreateFaction): Promise<Faction> {
    const faction: Faction = {
      id: `faction-${this.idCounter++}`,
      ...input,
      controlled_locations: input.controlled_locations || [],
      tags: input.tags || [],
      historical_events: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.factions.set(faction.id, faction);
    return { ...faction };
  }

  async update(id: string, updates: UpdateFaction): Promise<Faction> {
    const existing = this.factions.get(id);
    if (!existing) {
      throw new Error(`Faction ${id} not found`);
    }

    const updated: Faction = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.factions.set(id, updated);
    return { ...updated };
  }

  async findById(id: string): Promise<Faction | null> {
    const faction = this.factions.get(id);
    return faction ? { ...faction } : null;
  }

  async findByWorldId(worldId: string): Promise<Faction[]> {
    return Array.from(this.factions.values())
      .filter(f => f.world_id === worldId)
      .map(f => ({ ...f }));
  }

  async addHistoricalEvent(factionId: string, event: HistoricalEvent): Promise<void> {
    const faction = this.factions.get(factionId);
    if (!faction) {
      throw new Error(`Faction ${factionId} not found`);
    }

    faction.historical_events.push(event);
  }

  async setRelation(
    sourceId: string, 
    targetId: string, 
    stance: FactionRelation['stance'], 
    worldId: string
  ): Promise<void> {
    const key = `${sourceId}-${targetId}`;
    const relation: FactionRelation = {
      id: `relation-${this.idCounter++}`,
      world_id: worldId,
      source_id: sourceId,
      target_id: targetId,
      stance,
      last_changed: new Date().toISOString()
    };
    
    this.relations.set(key, relation);
  }

  async getRelation(sourceId: string, targetId: string): Promise<FactionRelation | null> {
    const key = `${sourceId}-${targetId}`;
    const relation = this.relations.get(key);
    return relation ? { ...relation } : null;
  }

  async getRelations(factionId: string): Promise<FactionRelation[]> {
    return Array.from(this.relations.values())
      .filter(r => r.source_id === factionId || r.target_id === factionId)
      .map(r => ({ ...r }));
  }

  clear(): void {
    this.factions.clear();
    this.relations.clear();
    this.idCounter = 1;
  }

  seed(faction: Faction): void {
    this.factions.set(faction.id, { ...faction });
  }
}