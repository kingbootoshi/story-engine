import aiService from './ai.service';
import supabaseService from './supabase.service';
import type { WorldArc, WorldBeat, WorldEvent } from './supabase.service';
import { createLogger } from '../../shared/utils/logger';

const logger = createLogger('worldArc.service');

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

export class WorldArcService {
  private static instance: WorldArcService;
  
  private constructor() {}
  
  static getInstance(): WorldArcService {
    if (!WorldArcService.instance) {
      WorldArcService.instance = new WorldArcService();
    }
    return WorldArcService.instance;
  }

  async createNewArc(params: WorldArcCreationParams): Promise<{ arc: WorldArc; anchors: WorldBeat[] }> {
    logger.info('Creating new arc', {
      worldId: params.worldId,
      worldName: params.worldName,
      hasStoryIdea: !!params.storyIdea
    });
    
    try {
      // Get previous arc summaries for continuity
      const previousArcs = await this.getPreviousArcSummaries(params.worldId);
      logger.debug('Retrieved previous arc summaries', { 
        worldId: params.worldId, 
        arcCount: previousArcs.length 
      });
      
      // Generate anchor points using AI
      const anchors = await aiService.generateWorldArcAnchors(
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

      // Create the arc in database
      const arc = await supabaseService.createArc(
        params.worldId,
        anchors[0].beatName || 'Untitled World Arc',
        params.storyIdea || 'Auto-generated world story arc'
      );

      // Save anchor beats (0, 7, 14)
      const anchorIndices = [0, 7, 14];
      const savedAnchors: WorldBeat[] = [];

      for (let i = 0; i < anchors.length; i++) {
        const beat = await supabaseService.createBeat(
          arc.id,
          anchorIndices[i],
          'anchor',
          {
            beatName: anchors[i].beatName,
            description: anchors[i].description,
            worldDirectives: anchors[i].worldDirectives || [],
            emergentStorylines: anchors[i].emergentStorylines || []
          }
        );
        savedAnchors.push(beat);
      }

      // Update world to set this arc as current
      await supabaseService.updateWorld(params.worldId, {
        current_arc_id: arc.id
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
      // Get current arc beats
      const beats = await supabaseService.getArcBeats(params.arcId);
      if (beats.length >= 15) {
        // Arc is complete
        logger.info('Arc is complete, finishing', { arcId: params.arcId, beatCount: beats.length });
        await this.completeArc(params.worldId, params.arcId);
        return null;
      }

      // Find next beat index
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

      // Get previous beats for context
      const previousBeats = beats
        .filter(b => b.beat_index < nextBeatIndex)
        .sort((a, b) => a.beat_index - b.beat_index);

      // Find next anchor point
      const nextAnchor = beats
        .filter(b => b.beat_type === 'anchor' && b.beat_index > nextBeatIndex)
        .sort((a, b) => a.beat_index - b.beat_index)[0];

      if (!nextAnchor) {
        throw new Error('No next anchor point found');
      }

      // Get recent events for context
      let recentEventsContext = params.recentEvents || '';
      if (!recentEventsContext) {
        const events = await supabaseService.getRecentEvents(params.worldId, 5);
        recentEventsContext = events
          .map(e => `[${e.impact_level}] ${e.description}`)
          .join('\n');
      }

      // Get world info
      const world = await supabaseService.getWorld(params.worldId);
      if (!world) throw new Error('World not found');

      // Generate dynamic beat
      const dynamicBeat = await aiService.generateDynamicWorldBeat(
        world.name,
        nextBeatIndex,
        previousBeats,
        nextAnchor,
        recentEventsContext
      );

      // Save the beat
      const savedBeat = await supabaseService.createBeat(
        params.arcId,
        nextBeatIndex,
        'dynamic',
        dynamicBeat
      );

      // Record this beat generation as a system event
      await supabaseService.createEvent({
        world_id: params.worldId,
        arc_id: params.arcId,
        beat_id: savedBeat.id,
        event_type: 'system_event',
        description: `New world beat generated: ${dynamicBeat.beatName}`,
        impact_level: 'moderate'
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
      // Get all beats for summary
      const beats = await supabaseService.getArcBeats(arcId);
      const arc = await supabaseService.getArc(arcId);
      
      if (!arc) throw new Error('Arc not found');

      // Generate arc summary
      const summary = await this.generateArcSummary(arc, beats);
      
      // Mark arc as completed
      await supabaseService.completeArc(arcId, summary);

      // Clear the current_arc_id from the world since this arc is now complete
      await supabaseService.updateWorld(worldId, {
        current_arc_id: undefined
      });

      // Create a major world event for arc completion
      await supabaseService.createEvent({
        world_id: worldId,
        arc_id: arcId,
        event_type: 'system_event',
        description: `World arc completed: ${arc.story_name}. ${summary}`,
        impact_level: 'major'
      });
      logger.success('Arc completed successfully', { worldId, arcId });
    } catch (error) {
      logger.error('Failed to complete arc', error, { worldId, arcId });
      throw error;
    }
  }

  async recordWorldEvent(event: Omit<WorldEvent, 'id' | 'created_at'>): Promise<WorldEvent> {
    return await supabaseService.createEvent(event);
  }

  async getWorldState(worldId: string): Promise<{
    world: any;
    currentArc: WorldArc | null;
    currentBeats: WorldBeat[];
    recentEvents: WorldEvent[];
  }> {
    const world = await supabaseService.getWorld(worldId);
    if (!world) throw new Error('World not found');

    let currentArc = null;
    let currentBeats: WorldBeat[] = [];

    if (world.current_arc_id) {
      currentArc = await supabaseService.getArc(world.current_arc_id);
      if (currentArc) {
        currentBeats = await supabaseService.getArcBeats(currentArc.id);
      }
    }

    const recentEvents = await supabaseService.getRecentEvents(worldId, 20);

    return {
      world,
      currentArc,
      currentBeats,
      recentEvents
    };
  }

  private async getPreviousArcSummaries(worldId: string): Promise<string[]> {
    const arcs = await supabaseService.getWorldArcs(worldId);
    return arcs
      .filter(arc => arc.status === 'completed' && arc.summary)
      .map(arc => `Arc ${arc.arc_number}: ${arc.story_name}\n${arc.summary}`)
      .slice(-3); // Only use last 3 arcs for context
  }

  private async generateArcSummary(arc: WorldArc, beats: WorldBeat[]): Promise<string> {
    // Compose a human-readable outline of the beats to provide rich context to the AI summariser.
    const beatDescriptions = beats
      .sort((a, b) => a.beat_index - b.beat_index)
      .map(b => `Beat ${b.beat_index} (${b.beat_name}): ${b.description.substring(0, 200)}...`)
      .join('\n\n');

    // Delegate the heavy-lifting to the dedicated AI service method.  This keeps all
    // OpenAI/OpenPipe interaction logic consolidated in `ai.service.ts`, ensuring a
    // single source-of-truth and cleaner error handling.
    const summary = await aiService.generateArcSummary(
      arc.story_name,
      arc.story_idea,
      beatDescriptions,
    );

    return summary || 'Arc completed without significant world changes.';
  }
}

export default WorldArcService.getInstance();