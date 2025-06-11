import { injectable, inject } from 'tsyringe';
import * as cron from 'node-cron';
import { createLogger } from '../../../core/infra/logger';
import { eventBus } from '../../../core/infra/eventBus';
import type { WorldRepo, WorldAI } from '../domain/ports';
import type { WorldBeat } from '../domain/schema';
import type { WorldEventLogged, StoryBeatCreated } from '../domain/events';
import type { DomainEvent, ID } from '../../../core/types';
import { formatEvent } from '../../../shared/utils/formatEvent';
import { formatLocationsForAI } from '../../../shared/utils/formatLocationContext';
import type { LocationRepository } from '../../location/domain/ports';
import type { ScheduledTask } from 'node-cron';

const logger = createLogger('story.ai.service');

@injectable()
export class StoryAIService {
  private buffer: WorldEventLogged[] = [];
  private lastBeatAt: number = Date.now();
  private cronTask: ScheduledTask;

  constructor(
    @inject('WorldRepo') private repo: WorldRepo,
    @inject('WorldAI') private ai: WorldAI,
    @inject('LocationRepository') private locationRepo: LocationRepository
  ) {
    eventBus.on<WorldEventLogged>('world.event.logged', (event: DomainEvent<WorldEventLogged>) => {
      this.handleEvent(event.payload).catch(error => {
        logger.error('[story] Failed to handle event', error, { event });
      });
    });

    this.cronTask = cron.schedule('0 * * * *', () => {
      this.flush('timer').catch(error => {
        logger.error('[story] Failed to flush on timer', error);
      });
    });

    logger.info('[story] StoryAIService initialized');
  }

  async handleEvent(evt: WorldEventLogged): Promise<void> {
    this.buffer.push(evt);
    
    logger.debug('[story] buffer size', { len: this.buffer.length });

    const majorEvents = this.buffer.filter(e => e.impact === 'major' || e.impact === 'catastrophic').length;
    const twentyFourHoursPassed = Date.now() - this.lastBeatAt > 86_400_000;

    if (majorEvents >= 3 || twentyFourHoursPassed) {
      await this.flush('threshold');
    }
  }

  async flush(reason: 'threshold' | 'timer'): Promise<void> {
    if (!this.buffer.length) {
      logger.debug('[story] No events to flush');
      return;
    }

    // For timer-based flushes, only proceed if we have significant events
    if (reason === 'timer') {
      const majorEvents = this.buffer.filter(e => e.impact === 'major' || e.impact === 'catastrophic').length;
      if (majorEvents === 0) {
        logger.debug('[story] Timer flush skipped - no major events in buffer');
        return;
      }
    }

    logger.info('[story] generating beat', { reason, events: this.buffer.length });

    try {
      const worldId = this.buffer[0]?.worldId;
      const beat = await this.generateNextBeat(this.buffer);
      this.buffer = [];
      this.lastBeatAt = Date.now();

      logger.info('[story] beat created', { 
        beatId: beat.id, 
        index: beat.beat_index 
      });

      const beatPayload: StoryBeatCreated = {
        kind: 'world.beat.created',
        v: 1,
        worldId: worldId! as ID,
        arcId: beat.arc_id as ID,
        beatId: beat.id as ID,
        beatIndex: beat.beat_index,
        beatName: beat.beat_name,
        beatType: 'dynamic',
        directives: beat.world_directives || [],
        emergent: beat.emergent_storylines || []
      };
      logger.debug('[emit]', { kind: beatPayload.kind, arcId: beatPayload.arcId, beatId: beatPayload.beatId });
      eventBus.emit<StoryBeatCreated>('world.beat.created', beatPayload);
    } catch (error) {
      logger.error('[story] Failed to generate beat', error, { reason });
      throw error;
    }
  }

  async generateNextBeat(events: WorldEventLogged[]): Promise<WorldBeat> {
    if (!events.length) {
      throw new Error('No events provided for beat generation');
    }

    const worldId = events[0].worldId;
    const arc = await this.repo.getArcByWorld(worldId);
    
    if (!arc) {
      throw new Error(`No active arc found for world ${worldId}`);
    }

    const world = await this.repo.getWorld(worldId);
    if (!world) {
      throw new Error(`World ${worldId} not found`);
    }

    const beats = await this.repo.getArcBeats(arc.id);
    if (beats.length >= 15) {
      throw new Error('Arc is already complete');
    }

    const existingIndices = beats.map(b => b.beat_index);
    let nextBeatIndex = 0;
    for (let i = 0; i < 15; i++) {
      if (!existingIndices.includes(i)) {
        nextBeatIndex = i;
        break;
      }
    }

    const previousBeats = beats
      .filter(b => b.beat_index < nextBeatIndex)
      .sort((a, b) => a.beat_index - b.beat_index);

    const nextAnchor = beats
      .filter(b => b.beat_type === 'anchor' && b.beat_index > nextBeatIndex)
      .sort((a, b) => a.beat_index - b.beat_index)[0];

    if (!nextAnchor) {
      throw new Error('No next anchor point found');
    }

    const recentEvents = events
      .map(e => ({
        id: e.eventId,
        event_type: 'world_event' as const,
        impact_level: e.impact as 'minor' | 'moderate' | 'major',
        description: e.description,
        world_id: e.worldId,
        arc_id: arc.id,
        beat_id: arc.current_beat_id || '',
        created_at: new Date().toISOString()
      }))
      .map(formatEvent)
      .join('\n');

    const locations = await this.locationRepo.findByWorldId(worldId);
    const locationsContext = formatLocationsForAI(locations);

    const dynamicBeat = await this.ai.generateBeat({
      worldName: world.name,
      worldDescription: world.description,
      arcDetailedDescription: arc.detailed_description,
      currentBeatIndex: nextBeatIndex,
      previousBeats,
      nextAnchor,
      recentEvents,
      currentLocations: locationsContext
    });

    const savedBeat = await this.repo.createBeat(
      arc.id,
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
      world_id: worldId,
      arc_id: arc.id,
      beat_id: savedBeat.id,
      event_type: 'system_event',
      description: `New world beat generated: ${dynamicBeat.beatName}`,
      impact_level: 'moderate'
    });

    return savedBeat;
  }

  destroy(): void {
    if (this.cronTask) {
      this.cronTask.stop();
    }
  }
}