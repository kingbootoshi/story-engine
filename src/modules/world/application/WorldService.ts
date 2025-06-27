import { injectable, inject } from 'tsyringe';
import { createLogger } from '../../../core/infra/logger';
import { eventBus } from '../../../core/infra/eventBus';
import type { WorldRepo, WorldAI } from '../domain/ports';
import type { World, WorldArc, WorldBeat, WorldEvent } from '../domain/schema';
import type * as Events from '../domain/events';
import type { WorldArcCreationParams, BeatProgressionParams } from './types';
import { randomUUID } from 'crypto';
import { formatEvent } from '../../../shared/utils/formatEvent';
import { formatLocationsForAI } from '../../../shared/utils/formatLocationContext';
import { formatFactionsForAI } from '../../../shared/utils/formatFactionContext';
import { formatCharactersForAI } from '../../../shared/utils/formatCharacterContext';
import type { LocationRepository } from '../../location/domain/ports';
import { container } from 'tsyringe';
import type { IFactionRepository } from '../../faction/domain/ports';
import type { ICharacterRepository } from '../../character/domain/ports';
import type { Faction } from '../../faction/domain/schema';

const logger = createLogger('world.service');

@injectable()
export class WorldService {
  constructor(
    @inject('WorldRepo') private repo: WorldRepo,
    @inject('WorldAI') private ai: WorldAI,
    @inject('LocationRepository') private locationRepo: LocationRepository
  ) {}

  async createWorld(name: string, description: string, ownerId?: string): Promise<World> {
    const resolvedOwnerId = ownerId ?? randomUUID();
    logger.info('Creating world', { name, descLen: description.length, ownerId: resolvedOwnerId });
    const world = await this.repo.createWorld({ name, description, user_id: resolvedOwnerId });
    
    eventBus.emit<Events.WorldCreatedEvent>('world.created', { 
      worldId: world.id, 
      name, 
      description 
    });
    
    return world;
  }

  async getWorld(id: string): Promise<World | null> {
    return await this.repo.getWorld(id);
  }

  async listWorlds(ownerId?: string): Promise<World[]> {
    return await this.repo.listWorlds(ownerId);
  }

  async createNewArc(params: WorldArcCreationParams): Promise<{ arc: WorldArc; anchors: WorldBeat[] }> {
    logger.info('Creating new arc', {
      worldId: params.worldId,
      worldName: params.worldName,
      hasStoryIdea: !!params.storyIdea
    });
    
    try {
      // Get the world to fetch the owner's user_id
      const world = await this.repo.getWorld(params.worldId);
      if (!world) {
        throw new Error(`World not found: ${params.worldId}`);
      }
      
      const previousArcs = await this.getPreviousArcSummaries(params.worldId);
      logger.debug('Retrieved previous arc summaries', { 
        worldId: params.worldId, 
        arcCount: previousArcs.length 
      });
      
      const locations = await this.locationRepo.findByWorldId(params.worldId);
      const locationsContext = formatLocationsForAI(locations);
      
      // Gather factions context
      let factionsContext = 'No factions currently exist in this world.';
      let factions: Faction[] = [];
      try {
        const factionRepo = container.resolve<IFactionRepository>('IFactionRepository');
        factions = await factionRepo.findByWorldId(params.worldId);
        factionsContext = formatFactionsForAI(factions);
      } catch (err) {
        logger.debug('Faction repository unavailable – skipping faction context');
      }
      
      // Gather characters context
      let charactersContext = 'No characters currently exist in this world.';
      try {
        const charRepo = container.resolve<ICharacterRepository>('ICharacterRepository');
        const chars = await charRepo.findByWorldId(params.worldId);
        charactersContext = formatCharactersForAI(chars, factions);
      } catch (err) {
        logger.debug('Character repository unavailable – skipping character context');
      }
      
      const result = await this.ai.generateAnchors({
        worldName: params.worldName,
        worldDescription: params.worldDescription,
        storyIdea: params.storyIdea,
        previousArcs,
        currentLocations: locationsContext,
        currentFactions: factionsContext,
        currentCharacters: charactersContext,
        userId: world.user_id || 'anonymous'
      });

      if (!result.anchors || result.anchors.length !== 3) {
        logger.error('Invalid anchor points generated', null, { anchors: result.anchors });
        throw new Error('Failed to generate valid anchor points');
      }
      
      logger.info('Successfully generated anchor points', {
        anchorNames: result.anchors.map(a => a.beatName),
        descriptionLength: result.arcDetailedDescription?.length || 0
      });

      const arc = await this.repo.createArc(
        params.worldId,
        result.anchors[0].beatName || 'Untitled World Arc',
        params.storyIdea || 'Auto-generated world story arc',
        result.arcDetailedDescription
      );

      const anchorIndices = [0, 7, 14];
      const savedAnchors: WorldBeat[] = [];

      for (let i = 0; i < result.anchors.length; i++) {
        const beat = await this.repo.createBeat(
          arc.id,
          anchorIndices[i],
          'anchor',
          {
            beat_name: result.anchors[i].beatName,
            description: result.anchors[i].description,
            world_directives: result.anchors[i].worldDirectives || [],
            emergent_storylines: result.anchors[i].emergentStorylines || []
          }
        );
        savedAnchors.push(beat);
      }

      await this.repo.updateWorld(params.worldId, {
        current_arc_id: arc.id
      });

      eventBus.emit<Events.WorldArcCreatedEvent>('world.arcCreated', {
        worldId: params.worldId,
        arcId: arc.id,
        arcName: arc.story_name
      });

      logger.success('Arc created', {
        arcId: arc.id,
        arcName: arc.story_name,
        anchorCount: savedAnchors.length
      });
      
      return { arc, anchors: savedAnchors };
    } catch (error) {
      logger.error('Failed to create new arc', error, { worldId: params.worldId });
      throw error;
    }
  }

  async progressArc(params: BeatProgressionParams): Promise<WorldBeat | null> {
    logger.info('Progressing arc', {
      worldId: params.worldId,
      arcId: params.arcId,
      hasRecentEvents: !!params.recentEvents
    });
    
    try {
      const beats = await this.repo.getArcBeats(params.arcId);
      if (beats.length >= 15) {
        logger.info('Arc is complete, finishing', { arcId: params.arcId, beatCount: beats.length });
        await this.completeArc(params.worldId, params.arcId);
        return null;
      }

      const existingIndices = beats.map(b => b.beat_index);
      let nextBeatIndex = 0;
      for (let i = 0; i < 15; i++) {
        if (!existingIndices.includes(i)) {
          nextBeatIndex = i;
          break;
        }
      }
      
      logger.debug('Determined next beat index', {
        arcId: params.arcId,
        existingBeats: beats.length,
        nextBeatIndex
      });

      const previousBeats = beats
        .filter(b => b.beat_index < nextBeatIndex)
        .sort((a, b) => a.beat_index - b.beat_index);

      const nextAnchor = beats
        .filter(b => b.beat_type === 'anchor' && b.beat_index > nextBeatIndex)
        .sort((a, b) => a.beat_index - b.beat_index)[0];

      if (!nextAnchor) {
        throw new Error('No next anchor point found');
      }

      let recentEventsContext = params.recentEvents || '';
      if (!recentEventsContext) {
        const events = await this.repo.getRecentEvents(params.worldId, 5);
        recentEventsContext = events.map(formatEvent).join('\n');
      }

      const world = await this.repo.getWorld(params.worldId);
      if (!world) throw new Error('World not found');
      
      const arc = await this.repo.getArc(params.arcId);
      if (!arc) throw new Error('Arc not found');

      logger.debug('Passing world desc to AI', {
        worldId: params.worldId,
        descLen: world.description.length,
        arcDescLen: arc.detailed_description?.length || 0
      });

      const locations = await this.locationRepo.findByWorldId(params.worldId);
      const locationsContext = formatLocationsForAI(locations);

      // Gather factions context
      let factionsContext = 'No factions currently exist in this world.';
      let factions: Faction[] = [];
      try {
        const factionRepo = container.resolve<IFactionRepository>('IFactionRepository');
        factions = await factionRepo.findByWorldId(params.worldId);
        factionsContext = formatFactionsForAI(factions);
      } catch (err) {
        logger.debug('Faction repository unavailable – skipping faction context');
      }

      // Gather characters context
      let charactersContext = 'No characters currently exist in this world.';
      try {
        const charRepo = container.resolve<ICharacterRepository>('ICharacterRepository');
        const chars = await charRepo.findByWorldId(params.worldId);
        charactersContext = formatCharactersForAI(chars, factions);
      } catch (err) {
        logger.debug('Character repository unavailable – skipping character context');
      }

      const dynamicBeat = await this.ai.generateBeat({
        worldName: world.name,
        worldDescription: world.description,
        arcDetailedDescription: arc.detailed_description,
        currentBeatIndex: nextBeatIndex,
        previousBeats,
        nextAnchor,
        recentEvents: recentEventsContext,
        currentLocations: locationsContext,
        currentFactions: factionsContext,
        currentCharacters: charactersContext,
        userId: world.user_id || 'anonymous'
      });

      const savedBeat = await this.repo.createBeat(
        params.arcId,
        nextBeatIndex,
        'dynamic',
        {
          beat_name: dynamicBeat.beatName,
          description: dynamicBeat.description,
          world_directives: dynamicBeat.worldDirectives,
          emergent_storylines: dynamicBeat.emergingConflicts
        }
      );

      await this.repo.createEvent({
        world_id: params.worldId,
        arc_id: params.arcId,
        beat_id: savedBeat.id,
        event_type: 'system_event',
        description: `New world beat generated: ${dynamicBeat.beatName}`,
        impact_level: 'moderate'
      });

      eventBus.emit<Events.StoryBeatCreated>('world.beat.created', {
        v: 1,
        worldId: params.worldId,
        beatId: savedBeat.id,
        beatIndex: nextBeatIndex,
        directives: savedBeat.world_directives ?? [],
        emergent: savedBeat.emergent_storylines ?? [],
        arcId: params.arcId,
        beatName: savedBeat.beat_name,
      });

      logger.logArcProgression(
        params.worldId,
        params.arcId,
        nextBeatIndex,
        'Beat Generated',
        { beatName: savedBeat.beat_name }
      );
      
      return savedBeat;
    } catch (error) {
      logger.error('Failed to progress arc', error, { arcId: params.arcId });
      throw error;
    }
  }

  async completeArc(worldId: string, arcId: string): Promise<void> {
    logger.info('Completing arc', { worldId, arcId });
    
    try {
      const beats = await this.repo.getArcBeats(arcId);
      const arc = await this.repo.getArc(arcId);
      
      if (!arc) throw new Error('Arc not found');

      const summary = await this.generateArcSummary(arc, beats);
      
      await this.repo.completeArc(arcId, summary);

      await this.repo.updateWorld(worldId, {
        current_arc_id: undefined
      });

      const lastBeat = beats.sort((a, b) => b.beat_index - a.beat_index)[0];

      await this.repo.createEvent({
        world_id: worldId,
        arc_id: arcId,
        beat_id: lastBeat?.id ?? beats[0].id,
        event_type: 'system_event',
        description: `World arc completed: ${arc.story_name}. ${summary}`,
        impact_level: 'major'
      });

      eventBus.emit<Events.WorldArcCompletedEvent>('world.arcCompleted', {
        worldId,
        arcId,
        arcName: arc.story_name,
        summary
      });

      logger.success('Arc completed', { worldId, arcId });
    } catch (error) {
      logger.error('Failed to complete arc', error, { worldId, arcId });
      throw error;
    }
  }

  /**
   * Record a world event **always** attached to the current beat of the active arc.
   * The caller only needs to provide `world_id`, `event_type`, `impact_level`, `description`.
   */
  async recordWorldEvent(event: Pick<WorldEvent, 'world_id' | 'event_type' | 'impact_level' | 'description'>): Promise<WorldEvent> {
    const arc = await this.repo.getArcByWorld(event.world_id);
    if (!arc?.current_beat_id) {
      throw new Error('No current beat found – cannot record event');
    }

    const savedEvent = await this.repo.createEvent({
      world_id: event.world_id,
      arc_id: arc.id,
      beat_id: arc.current_beat_id,
      event_type: event.event_type,
      impact_level: event.impact_level,
      description: event.description
    });

    logger.debug('Event attached', { beatId: arc.current_beat_id });

    eventBus.emit<Events.WorldEventLoggedEvent>('world.eventLogged', {
      worldId: event.world_id,
      eventId: savedEvent.id,
      eventType: savedEvent.event_type,
      impactLevel: savedEvent.impact_level
    });

    return savedEvent;
  }

  /**
   * Log a world event and emit to eventBus.
   * Replaces recordWorldEvent with new event-driven approach.
   */
  async logEvent(data: Pick<WorldEvent, 'world_id' | 'event_type' | 'impact_level' | 'description'>): Promise<WorldEvent> {
    const arc = await this.repo.getArcByWorld(data.world_id);
    if (!arc?.current_beat_id) {
      throw new Error('No current beat found – cannot record event');
    }

    const savedEvent = await this.repo.createEvent({
      world_id: data.world_id,
      arc_id: arc.id,
      beat_id: arc.current_beat_id,
      event_type: data.event_type,
      impact_level: data.impact_level,
      description: data.description
    });

    logger.http('[world] event logged', { 
      eventId: savedEvent.id,
      worldId: data.world_id,
      impact: data.impact_level
    });

    logger.debug('📝 world.event.logged', { 
      id: savedEvent.id, 
      impact: data.impact_level 
    });

    eventBus.emit<Events.WorldEventLogged>('world.event.logged', {
      v: 1,
      worldId: data.world_id,
      eventId: savedEvent.id,
      impact: data.impact_level as 'minor' | 'moderate' | 'major' | 'catastrophic',
      description: data.description
    });

    return savedEvent;
  }

  async getBeatEvents(beatId: string): Promise<WorldEvent[]> {
    return this.repo.getBeatEvents(beatId);
  }

  async getWorldState(worldId: string): Promise<{
    world: World;
    currentArc: WorldArc | null;
    currentBeats: WorldBeat[];
    recentEvents: WorldEvent[];
  }> {
    const world = await this.repo.getWorld(worldId);
    if (!world) throw new Error('World not found');

    let currentArc = null;
    let currentBeats: WorldBeat[] = [];

    if (world.current_arc_id) {
      currentArc = await this.repo.getArc(world.current_arc_id);
      if (currentArc) {
        currentBeats = await this.repo.getArcBeats(currentArc.id);
      }
    }

    const recentEvents = await this.repo.getRecentEvents(worldId, 20);

    return {
      world,
      currentArc,
      currentBeats,
      recentEvents
    };
  }


  private async getPreviousArcSummaries(worldId: string): Promise<string[]> {
    const arcs = await this.repo.getWorldArcs(worldId);
    return arcs
      .filter(arc => arc.status === 'completed' && arc.summary)
      .map(arc => `Arc ${arc.arc_number}: ${arc.story_name}\n${arc.summary}`)
      .slice(-3);
  }

  private async generateArcSummary(arc: WorldArc, beats: WorldBeat[]): Promise<string> {
    const beatDescriptions = beats
      .sort((a, b) => a.beat_index - b.beat_index)
      .map(b => `Beat ${b.beat_index} (${b.beat_name}): ${b.description.substring(0, 200)}...`)
      .join('\n\n');

    // Get the world to fetch the owner's user_id
    const world = await this.repo.getWorld(arc.world_id);
    const userId = world?.user_id || 'anonymous';

    const summary = await this.ai.summarizeArc({
      arcName: arc.story_name,
      arcIdea: arc.story_idea,
      beatDescriptions,
      userId
    });

    return summary || 'Arc completed without significant world changes.';
  }

  /**
   * Returns the current beat of the world's active arc or null if none.
   */
  async getCurrentBeat(worldId: string): Promise<WorldBeat | null> {
    const arc = await this.repo.getArcByWorld(worldId);
    return arc?.current_beat_id
      ? await this.repo.getBeat(arc.current_beat_id)
      : null;
  }
}