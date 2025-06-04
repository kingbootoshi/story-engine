import { injectable } from 'tsyringe';
import { createLogger } from '../../../core/infra/logger';
import { eventBus } from '../../../core/infra/eventBus';
import * as worldRepo from './world.repo';
import type { World, WorldArc, WorldBeat, WorldEvent } from './schema';
import AIService from '../../../core/ai/ai.service';

const logger = createLogger('world.service');

export interface WorldArcCreationParams {
  worldId: string;
  worldName: string;
  worldDescription: string;
  storyIdea?: string;
}

export interface BeatProgressionParams {
  worldId: string;
  arcId: string;
  recentEvents?: string;
}

@injectable()
export default class WorldService {
  async createWorld(name: string, description: string): Promise<World> {
    logger.info('Creating world', { name });
    const world = await worldRepo.createWorld({ name, description });
    
    eventBus.emit('world.created', { worldId: world.id, name, description });
    
    return world;
  }

  async getWorld(id: string): Promise<World | null> {
    return await worldRepo.getWorld(id);
  }

  async listWorlds(): Promise<World[]> {
    return await worldRepo.listWorlds();
  }

  async createNewArc(params: WorldArcCreationParams): Promise<{ arc: WorldArc; anchors: WorldBeat[] }> {
    logger.info('Creating new arc', {
      worldId: params.worldId,
      worldName: params.worldName,
      hasStoryIdea: !!params.storyIdea
    });
    
    try {
      const previousArcs = await this.getPreviousArcSummaries(params.worldId);
      logger.debug('Retrieved previous arc summaries', { 
        worldId: params.worldId, 
        arcCount: previousArcs.length 
      });
      
      const anchors = await AIService.generateWorldArcAnchors(
        params.worldName,
        params.worldDescription,
        params.storyIdea,
        previousArcs
      );

      if (!anchors || anchors.length !== 3) {
        logger.error('Invalid anchor points generated', null, { anchors });
        throw new Error('Failed to generate valid anchor points');
      }
      
      logger.info('Successfully generated anchor points', {
        anchorNames: anchors.map((a: any) => a.beatName)
      });

      const arc = await worldRepo.createArc(
        params.worldId,
        anchors[0].beatName || 'Untitled World Arc',
        params.storyIdea || 'Auto-generated world story arc'
      );

      const anchorIndices = [0, 7, 14];
      const savedAnchors: WorldBeat[] = [];

      for (let i = 0; i < anchors.length; i++) {
        const beat = await worldRepo.createBeat(
          arc.id,
          anchorIndices[i],
          'anchor',
          {
            beat_name: anchors[i].beatName,
            description: anchors[i].description,
            world_directives: anchors[i].worldDirectives || [],
            emergent_storylines: anchors[i].emergentStorylines || []
          }
        );
        savedAnchors.push(beat);
      }

      await worldRepo.updateWorld(params.worldId, {
        current_arc_id: arc.id
      });

      eventBus.emit('world.arcCreated', {
        worldId: params.worldId,
        arcId: arc.id,
        arcName: arc.story_name
      });

      logger.success('Arc created successfully', {
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
      const beats = await worldRepo.getArcBeats(params.arcId);
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
        const events = await worldRepo.getRecentEvents(params.worldId, 5);
        recentEventsContext = events
          .map(e => `[${e.impact_level}] ${e.description}`)
          .join('\n');
      }

      const world = await worldRepo.getWorld(params.worldId);
      if (!world) throw new Error('World not found');

      logger.debug('Passing world desc to AI', {
        worldId: params.worldId,
        descLen: world.description.length
      });

      const dynamicBeat = await AIService.generateDynamicWorldBeat(
        world.name,
        world.description,
        nextBeatIndex,
        previousBeats,
        nextAnchor,
        recentEventsContext
      );

      const savedBeat = await worldRepo.createBeat(
        params.arcId,
        nextBeatIndex,
        'dynamic',
        dynamicBeat
      );

      await worldRepo.createEvent({
        world_id: params.worldId,
        arc_id: params.arcId,
        beat_id: savedBeat.id,
        event_type: 'system_event',
        description: `New world beat generated: ${dynamicBeat.beatName}`,
        impact_level: 'moderate'
      });

      eventBus.emit('world.beatCreated', {
        worldId: params.worldId,
        arcId: params.arcId,
        beatId: savedBeat.id,
        beatIndex: nextBeatIndex,
        beatName: savedBeat.beat_name
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
      const beats = await worldRepo.getArcBeats(arcId);
      const arc = await worldRepo.getArc(arcId);
      
      if (!arc) throw new Error('Arc not found');

      const summary = await this.generateArcSummary(arc, beats);
      
      await worldRepo.completeArc(arcId, summary);

      await worldRepo.updateWorld(worldId, {
        current_arc_id: undefined
      });

      await worldRepo.createEvent({
        world_id: worldId,
        arc_id: arcId,
        event_type: 'system_event',
        description: `World arc completed: ${arc.story_name}. ${summary}`,
        impact_level: 'major'
      });

      eventBus.emit('world.arcCompleted', {
        worldId,
        arcId,
        arcName: arc.story_name,
        summary
      });

      logger.success('Arc completed successfully', { worldId, arcId });
    } catch (error) {
      logger.error('Failed to complete arc', error, { worldId, arcId });
      throw error;
    }
  }

  async recordWorldEvent(event: Omit<WorldEvent, 'id' | 'created_at'>): Promise<WorldEvent> {
    const savedEvent = await worldRepo.createEvent(event);
    
    eventBus.emit('world.eventLogged', {
      worldId: event.world_id,
      eventId: savedEvent.id,
      eventType: event.event_type,
      impactLevel: event.impact_level
    });
    
    return savedEvent;
  }

  async getWorldState(worldId: string): Promise<{
    world: World;
    currentArc: WorldArc | null;
    currentBeats: WorldBeat[];
    recentEvents: WorldEvent[];
  }> {
    const world = await worldRepo.getWorld(worldId);
    if (!world) throw new Error('World not found');

    let currentArc = null;
    let currentBeats: WorldBeat[] = [];

    if (world.current_arc_id) {
      currentArc = await worldRepo.getArc(world.current_arc_id);
      if (currentArc) {
        currentBeats = await worldRepo.getArcBeats(currentArc.id);
      }
    }

    const recentEvents = await worldRepo.getRecentEvents(worldId, 20);

    return {
      world,
      currentArc,
      currentBeats,
      recentEvents
    };
  }

  async handleCharacterDeath(characterId: string, worldId: string): Promise<void> {
    logger.info('Handling character death in world', { characterId, worldId });
    
    await this.recordWorldEvent({
      world_id: worldId,
      event_type: 'world_event',
      description: `A significant character has died`,
      impact_level: 'major'
    });
  }

  private async getPreviousArcSummaries(worldId: string): Promise<string[]> {
    const arcs = await worldRepo.getWorldArcs(worldId);
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

    const summary = await AIService.generateArcSummary(
      arc.story_name,
      arc.story_idea,
      beatDescriptions,
    );

    return summary || 'Arc completed without significant world changes.';
  }
}