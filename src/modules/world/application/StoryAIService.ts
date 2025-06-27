import { injectable, inject } from 'tsyringe';
import { createLogger } from '../../../core/infra/logger';
import type { WorldRepo, WorldAI } from '../domain/ports';
import type { WorldBeat } from '../domain/schema';
import type { WorldEventLogged } from '../domain/events';
import { formatEvent } from '../../../shared/utils/formatEvent';
import { formatLocationsForAI } from '../../../shared/utils/formatLocationContext';
import { formatFactionsForAI } from '../../../shared/utils/formatFactionContext';
import { formatCharactersForAI } from '../../../shared/utils/formatCharacterContext';
import type { LocationRepository } from '../../location/domain/ports';
import { container } from 'tsyringe';
import type { IFactionRepository } from '../../faction/domain/ports';
import type { ICharacterRepository } from '../../character/domain/ports';
import type { Faction } from '../../faction/domain/schema';

const logger = createLogger('story.ai.service');

@injectable()
export class StoryAIService {
  constructor(
    @inject('WorldRepo') private repo: WorldRepo,
    @inject('WorldAI') private ai: WorldAI,
    @inject('LocationRepository') private locationRepo: LocationRepository
  ) {
    logger.info('[story] StoryAIService initialized');
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

    // Gather factions context
    let factionsContext = 'No factions currently exist in this world.';
    let factions: Faction[] = [];
    try {
      const factionRepo = container.resolve<IFactionRepository>('IFactionRepository');
      factions = await factionRepo.findByWorldId(worldId);
      factionsContext = formatFactionsForAI(factions);
    } catch (err) {
      logger.debug('Faction repository unavailable – skipping faction context');
    }

    // Gather characters context
    let charactersContext = 'No characters currently exist in this world.';
    try {
      const charRepo = container.resolve<ICharacterRepository>('ICharacterRepository');
      const chars = await charRepo.findByWorldId(worldId);
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
      recentEvents,
      currentLocations: locationsContext,
      currentFactions: factionsContext,
      currentCharacters: charactersContext,
      userId: world.user_id || 'anonymous'
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
}