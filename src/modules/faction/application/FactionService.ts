import { injectable, inject } from 'tsyringe';
import { createLogger } from '../../../core/infra/logger';
import { eventBus } from '../../../core/infra/eventBus';
import type { IFactionRepository, IFactionAI } from '../domain/ports';
import type { 
  Faction, 
  CreateFaction, 
  UpdateFaction, 
  DiplomaticStance,
  FactionStatus
} from '../domain/schema';
import { type HistoricalEvent } from '../domain/schema';
import type * as Events from '../domain/events';
import type { WorldRepo } from '../../world/domain/ports';
import type { LocationRepository } from '../../location/domain/ports';
import type { LocationWorldCompleteEvent } from '../../location/domain/events';
import { resolveFactionIdentifier } from '../../../shared/utils/resolveFactionIdentifier';

const logger = createLogger('faction.service');

@injectable()
export class FactionService {
  constructor(
    @inject('IFactionRepository') private repo: IFactionRepository,
    @inject('IFactionAI') private ai: IFactionAI,
    @inject('WorldRepo') private worldRepo: WorldRepo,
    @inject('LocationRepository') private locationRepo: LocationRepository
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    eventBus.on('location.world.complete', async (evt: { payload: LocationWorldCompleteEvent }) => {
      await this.seedFactions(evt.payload);
    });
    
    eventBus.on('world.beat.created', async (evt: any) => {
      await this.reactToBeat(evt.payload);
    });
    
    eventBus.on('location.status_changed', async (evt: any) => {
      await this.checkTerritory(evt.payload);
    });
  }

  async create(input: CreateFaction, enrichAI: boolean = false): Promise<Faction> {
    logger.info('Creating faction', { 
      name: input.name, 
      worldId: input.world_id,
      enrichAI 
    });
    
    let factionData = input;
    
    if (enrichAI) {
      const world = await this.worldRepo.getWorld(input.world_id);
      if (!world) throw new Error('World not found');
      
      const existingFactions = await this.repo.findByWorldId(input.world_id);
      const existingNames = existingFactions.map(f => `${f.name}: ${f.ideology}`);
      
      const generatedData = await this.ai.generateFaction({
        worldId: input.world_id,
        worldTheme: world.description,
        existingFactions: existingNames
      });
      
      factionData = { ...input, ...generatedData };
    }
    
    const faction = await this.repo.create(factionData);
    
    eventBus.emit<Events.FactionCreated>('faction.created', {
      v: 1,
      worldId: faction.world_id,
      factionId: faction.id,
      name: faction.name
    });
    
    return faction;
  }

  async update(id: string, updates: UpdateFaction): Promise<Faction> {
    logger.info('Updating faction', { id, updates });
    return await this.repo.update(id, updates);
  }

  async get(id: string): Promise<Faction | null> {
    return await this.repo.findById(id);
  }

  async list(worldId: string): Promise<Faction[]> {
    return await this.repo.findByWorldId(worldId);
  }

  async claimLocation(
    factionId: string, 
    locationId: string, 
    method: 'conquest' | 'treaty'
  ): Promise<void> {
    logger.info('Faction claiming location', { factionId, locationId, method });
    
    const faction = await this.repo.findById(factionId);
    if (!faction) throw new Error('Faction not found');
    
    const location = await this.locationRepo.findById(locationId);
    if (!location) throw new Error('Location not found');
    
    const currentBeat = await this.worldRepo.getCurrentBeat(faction.world_id);
    
    const updatedLocations = [...new Set([...faction.controlled_locations, locationId])];
    await this.repo.update(factionId, { controlled_locations: updatedLocations });
    
    await this.locationRepo.update(locationId, { 
      controlling_faction_id: factionId 
    });
    
    eventBus.emit<Events.FactionTookLocation>('faction.took_location', {
      v: 1,
      worldId: faction.world_id,
      factionId: factionId,
      locationId: locationId,
      method: method === 'treaty' ? 'diplomacy' : method,
      beatId: currentBeat?.id || '',
      beatIndex: currentBeat?.beat_index || 0
    });
    
    await this.repo.addHistoricalEvent(factionId, {
      timestamp: new Date().toISOString(),
      event: `Claimed control of ${location.name} through ${method}`,
      beat_index: currentBeat?.beat_index
    });
  }

  async releaseLocation(
    factionId: string, 
    locationId: string, 
    reason: string
  ): Promise<void> {
    logger.info('Faction releasing location', { factionId, locationId, reason });
    
    const faction = await this.repo.findById(factionId);
    if (!faction) throw new Error('Faction not found');
    
    const location = await this.locationRepo.findById(locationId);
    if (!location) throw new Error('Location not found');
    
    const currentBeat = await this.worldRepo.getCurrentBeat(faction.world_id);
    
    const updatedLocations = faction.controlled_locations.filter(id => id !== locationId);
    await this.repo.update(factionId, { controlled_locations: updatedLocations });
    
    await this.locationRepo.update(locationId, { 
      controlling_faction_id: null 
    });
    
    eventBus.emit<Events.FactionLostLocation>('faction.lost_location', {
      v: 1,
      worldId: faction.world_id,
      factionId: factionId,
      locationId: locationId,
      reason: reason,
      beatId: currentBeat?.id || '',
      beatIndex: currentBeat?.beat_index || 0
    });
    
    await this.repo.addHistoricalEvent(factionId, {
      timestamp: new Date().toISOString(),
      event: `Lost control of ${location.name}: ${reason}`,
      beat_index: currentBeat?.beat_index
    });
  }

  /**
   * Updates the high-level lifecycle status of a faction (rising → stable → …).
   *
   * In most call-sites we only know the faction ID, so the method will fetch
   * the latest entity from the repository. However, internal helpers like
   * `checkTerritory` may already *have* the entity in scope. Accepting an
   * optional `preloaded` instance avoids a redundant repository fetch – which
   * is especially useful in unit tests where `findById` is heavily stubbed.
   */
  async setStatus(
    id: string,
    next: FactionStatus,
    reason: string,
    preloaded?: Faction
  ): Promise<void> {
    logger.info('Setting faction status', { id, next, reason });
    
    const faction = preloaded ?? await this.repo.findById(id);
    if (!faction) throw new Error('Faction not found');
    
    const prev = faction.status;
    if (prev === next) return;
    
    const currentBeat = await this.worldRepo.getCurrentBeat(faction.world_id);
    
    await this.repo.update(id, { status: next });
    
    await this.repo.addHistoricalEvent(id, {
      timestamp: new Date().toISOString(),
      event: `Status changed from ${prev} to ${next}: ${reason}`,
      previous_status: prev,
      beat_index: currentBeat?.beat_index
    });
    
    const world = await this.worldRepo.getWorld(faction.world_id);
    if (world) {
      let doctrineUpdate: { ideology: string; tags: string[] } | undefined;
      try {
        doctrineUpdate = await this.ai.updateDoctrine({
          faction,
          statusChange: { from: prev, to: next, reason },
          worldContext: world.description
        });
      } catch (err) {
        // If the AI adapter fails (e.g., unavailable during unit tests), continue without doctrine changes.
        logger.warn('Doctrine update failed – skipping ideology/tag refresh', {
          faction_id: id,
          error: (err as Error).message
        });
      }

      if (doctrineUpdate) {
        await this.repo.update(id, {
          ideology: doctrineUpdate.ideology,
          tags: doctrineUpdate.tags
        });
      }
    }
    
    eventBus.emit<Events.FactionStatusChanged>('faction.status_changed', {
      v: 1,
      worldId: faction.world_id,
      factionId: id,
      prev,
      next,
      reason,
      beatId: currentBeat?.id || '',
      beatIndex: currentBeat?.beat_index || 0
    });
  }

  async setStance(
    sourceId: string,
    targetId: string,
    stance: DiplomaticStance,
    reason: string
  ): Promise<void> {
    logger.info('Setting faction stance', { sourceId, targetId, stance, reason });
    
    const source = await this.repo.findById(sourceId);
    if (!source) throw new Error('Source faction not found');
    
    const currentRelation = await this.repo.getRelation(sourceId, targetId);
    const previous = currentRelation?.stance || 'neutral';
    
    await this.repo.setRelation(sourceId, targetId, stance, source.world_id);
    
    eventBus.emit<Events.FactionRelationChanged>('faction.relation_changed', {
      v: 1,
      worldId: source.world_id,
      sourceId,
      targetId,
      previous,
      next: stance,
      reason
    });
  }

  async getStances(factionId: string): Promise<Array<{
    targetId: string;
    stance: DiplomaticStance;
  }>> {
    const relations = await this.repo.getRelations(factionId);
    return relations.map(r => ({
      targetId: r.source_id === factionId ? r.target_id : r.source_id,
      stance: r.stance
    }));
  }

  async getHistory(id: string, limit: number = 10): Promise<Array<HistoricalEvent>> {
    const faction = await this.repo.findById(id);
    if (!faction) throw new Error('Faction not found');
    
    return faction.historical_events
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async generateDoctrine(id: string): Promise<Faction> {
    const faction = await this.repo.findById(id);
    if (!faction) throw new Error('Faction not found');
    
    const world = await this.worldRepo.getWorld(faction.world_id);
    if (!world) throw new Error('World not found');
    
    const existingFactions = await this.repo.findByWorldId(faction.world_id);
    const existingNames = existingFactions
      .filter(f => f.id !== id)
      .map(f => `${f.name}: ${f.ideology}`);
    
    const generatedData = await this.ai.generateFaction({
      worldId: faction.world_id,
      worldTheme: world.description,
      existingFactions: existingNames
    });
    
    return await this.repo.update(id, {
      ideology: generatedData.ideology,
      tags: generatedData.tags
    });
  }

  async evaluateRelations(worldId: string, beatContext: string): Promise<void> {
    logger.info('Evaluating faction relations', { worldId });
    
    const factions = await this.repo.findByWorldId(worldId);
    if (factions.length < 2) return;
    
    const currentRelations = await Promise.all(
      factions.map(f => this.repo.getRelations(f.id))
    );
    const flatRelations = currentRelations.flat();
    
    const suggestions = await this.ai.evaluateRelations({
      worldId,
      factions,
      currentRelations: flatRelations,
      beatContext
    });
    
    // ---------------------------------------------------------------------
    // The AI may return faction *names* instead of UUIDs. Convert them here so
    // that downstream calls operate on canonical identifiers.
    // ---------------------------------------------------------------------
    for (const suggestion of suggestions) {
      const sourceId = resolveFactionIdentifier(suggestion.sourceId, factions);
      const targetId = resolveFactionIdentifier(suggestion.targetId, factions);

      if (!sourceId || !targetId) {
        logger.warn('Unable to resolve faction identifiers from AI suggestion', {
          suggestion,
          unresolved: {
            sourceId,
            targetId
          }
        });
        continue; // Skip invalid suggestions rather than throwing and halting.
      }

      await this.setStance(
        sourceId,
        targetId,
        suggestion.suggestedStance,
        suggestion.reason
      );
    }
  }

  private async seedFactions(payload: LocationWorldCompleteEvent): Promise<void> {
    const { worldId } = payload;
    logger.info('Seeding initial factions for world', { worldId });
    
    const world = await this.worldRepo.getWorld(worldId);
    if (!world) return;
    
    const initialFactionCount = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < initialFactionCount; i++) {
      const existingFactions = await this.repo.findByWorldId(worldId);
      const existingNames = existingFactions.map(f => `${f.name}: ${f.ideology}`);
      
      const factionData = await this.ai.generateFaction({
        worldId,
        worldTheme: world.description,
        existingFactions: existingNames
      });
      
      await this.create(factionData);
    }

    // Emit a single event after all initial factions are seeded so that other
    // modules (e.g. Characters) can safely begin their own seeding logic.
    eventBus.emit<Events.FactionSeedingComplete>('faction.seeding.complete', {
      v: 1,
      worldId,
      factionCount: initialFactionCount
    });
  }

  private async reactToBeat(payload: any): Promise<void> {
    const { worldId, beatId, directives } = payload;
    logger.info('Factions reacting to new beat', { worldId, beatId });
    
    const beatContext = directives.join('\n');
    await this.evaluateRelations(worldId, beatContext);
  }

  private async checkTerritory(payload: any): Promise<void> {
    const { locationId, newStatus } = payload;
    logger.info('Checking territory after location status change', { locationId, newStatus });
    
    const location = await this.locationRepo.findById(locationId);
    if (!location || !location.controlling_faction_id) return;
    
    const faction = await this.repo.findById(location.controlling_faction_id);
    if (!faction) return;
    
    if (newStatus === 'ruins' || newStatus === 'destroyed') {
      await this.releaseLocation(
        faction.id, 
        locationId, 
        `Location became ${newStatus}`
      );
      
      const controlledCount = faction.controlled_locations.length - 1;
      if (controlledCount === 0 && faction.status !== 'collapsed') {
        await this.setStatus(
          faction.id,
          'declining',
          'Lost last controlled location',
          faction
        );
      }
    }
  }
}