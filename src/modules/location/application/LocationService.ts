import { injectable, inject } from 'tsyringe';
import { eventBus } from '../../../core/infra/eventBus';
import { createLogger } from '../../../core/infra/logger';
import type { LocationRepository, LocationAI } from '../domain/ports';
import type { 
  Location, 
  CreateLocation, 
  UpdateLocation, 
  LocationStatus, 
  HistoricalEvent 
} from '../domain/schema';
import type { 
  LocationCreatedEvent, 
  LocationStatusChangedEvent, 
  LocationDiscoveredEvent 
} from '../domain/events';
import type { WorldCreatedEvent, StoryBeatCreated } from '../../world/domain/events';
import { allocCoords, allocAround } from '../../../core/infra/coords';

const logger = createLogger('location.service');

/**
 * Service that manages location lifecycle and reactions to world events
 */
@injectable()
export class LocationService {
  constructor(
    @inject('LocationRepository') private repo: LocationRepository,
    @inject('LocationAI') private ai: LocationAI
  ) {
    this.subscribeToEvents();
  }

  /**
   * Subscribe to world events
   */
  private subscribeToEvents() {
    eventBus.on('world.created', (event) => this.handleWorldCreated(event.payload));
    eventBus.on('world.beat.created', (event) => this.handleBeatCreated(event.payload));
    logger.info('LocationService subscribed to events');
  }

  /**
   * Handle world creation by generating initial locations
   */
  private async handleWorldCreated(event: WorldCreatedEvent) {
    logger.info('Handling world.created event', { 
      worldId: event.worldId,
      correlation: event.worldId 
    });
    
    try {
      await this.seedInitialMap(event);
    } catch (error) {
      logger.error('Failed to handle world.created', error, { 
        worldId: event.worldId,
        correlation: event.worldId 
      });
    }
  }

  /**
   * Handle beat creation by potentially mutating locations
   */
  private async handleBeatCreated(event: StoryBeatCreated) {
    logger.info('Handling world.beat.created event', { 
      worldId: event.worldId,
      beatId: event.beatId,
      beatIndex: event.beatIndex,
      correlation: event.worldId 
    });
    
    try {
      await this.reactToBeat(event);
    } catch (error) {
      logger.error('Failed to handle world.beat.created', error, { 
        worldId: event.worldId,
        beatId: event.beatId,
        correlation: event.worldId 
      });
    }
  }

  /**
   * Generate initial world map with 8-15 locations
   */
  async seedInitialMap(event: WorldCreatedEvent): Promise<void> {
    const startTime = Date.now();
    logger.info('Seeding initial map for world', { 
      worldId: event.worldId,
      correlation: event.worldId 
    });

    try {
      const mapResult = await this.ai.buildWorldMap({
        worldName: event.name,
        worldDescription: event.description
      });

      if (mapResult.locations.length < 8 || mapResult.locations.length > 15) {
        throw new Error(`Invalid location count: ${mapResult.locations.length}. Expected 8-15 locations.`);
      }

      logger.debug('AI generated world map', {
        worldId: event.worldId,
        locationCount: mapResult.locations.length,
        hasMapSvg: !!mapResult.mapSvg,
        correlation: event.worldId
      });

      const regions = mapResult.locations.filter(loc => loc.type === 'region');
      const regionMap = new Map<string, string>();

      const savedRegions = await this.repo.createBulk(
        regions.map(region => ({
          world_id: event.worldId,
          parent_location_id: null,
          name: region.name,
          type: region.type,
          status: 'stable' as LocationStatus,
          description: region.description,
          tags: region.tags,
          relative_x: region.relative_position.x,
          relative_y: region.relative_position.y
        }))
      );

      savedRegions.forEach(region => {
        regionMap.set(region.name, region.id);
      });

      const childLocations = mapResult.locations.filter(loc => loc.type !== 'region');
      const childrenToCreate = childLocations.map(child => {
        const parentId = child.parent_region_name 
          ? regionMap.get(child.parent_region_name) || null
          : null;

        return {
          world_id: event.worldId,
          parent_location_id: parentId,
          name: child.name,
          type: child.type,
          status: 'stable' as LocationStatus,
          description: child.description,
          tags: child.tags,
          relative_x: child.relative_position.x,
          relative_y: child.relative_position.y
        } as CreateLocation;
      });

      const savedChildren = await this.repo.createBulk(childrenToCreate);
      const allLocations = [...savedRegions, ...savedChildren];

      for (const location of allLocations) {
        const locationEvent: LocationCreatedEvent = {
          v: 1,
          worldId: event.worldId,
          locationId: location.id,
          name: location.name,
          type: location.type,
          parentId: location.parent_location_id || undefined
        };
        eventBus.emit('location.created', locationEvent);
      }

      logger.info('Successfully created locations for world', {
        worldId: event.worldId,
        locationCount: allLocations.length,
        regionCount: savedRegions.length,
        childCount: savedChildren.length,
        duration_ms: Date.now() - startTime,
        correlation: event.worldId
      });

    } catch (error) {
      logger.error('Failed to seed initial map', error, {
        worldId: event.worldId,
        correlation: event.worldId
      });
      throw error;
    }
  }

  /**
   * React to story beat by mutating locations
   */
  async reactToBeat(event: StoryBeatCreated): Promise<void> {
    const startTime = Date.now();
    logger.info('Processing beat for location mutations', {
      worldId: event.worldId,
      beatId: event.beatId,
      beatIndex: event.beatIndex,
      correlation: event.worldId
    });

    try {
      const locations = await this.repo.findByWorldId(event.worldId);
      
      const context = {
        worldId: event.worldId,
        beatDirectives: event.directives.join('\n'),
        emergentStorylines: event.emergent,
        currentLocations: locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          status: loc.status,
          description: loc.description.substring(0, 200)
        }))
      };

      const mutations = await this.ai.mutateLocations(context);

      logger.info('AI suggested location mutations', {
        worldId: event.worldId,
        beatId: event.beatId,
        updateCount: mutations.updates.length,
        discoveryCount: mutations.discoveries.length,
        correlation: event.worldId
      });

      for (const update of mutations.updates) {
        // Allow AI to reference locations by NAME as a fallback. Detect UUID v4 format.
        let targetId = update.locationId;
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(targetId)) {
          const byName = locations.find(l => l.name.toLowerCase() === update.locationId.toLowerCase());
          if (!byName) {
            logger.warn('Update references unknown location', { provided: update.locationId });
            continue; // skip invalid reference
          }
          targetId = byName.id;
        }

        if (update.newStatus) {
          const historicalEvent: HistoricalEvent = {
            timestamp: new Date().toISOString(),
            event: update.reason,
            previous_status: locations.find(l => l.id === targetId)?.status,
            beat_index: event.beatIndex
          };

          await this.repo.updateStatus(targetId, update.newStatus, historicalEvent);

          const location = locations.find(l => l.id === targetId);
          if (location) {
            const statusEvent: LocationStatusChangedEvent = {
              v: 1,
              worldId: event.worldId,
              locationId: targetId,
              locationName: location.name,
              oldStatus: location.status,
              newStatus: update.newStatus,
              reason: update.reason,
              beatId: event.beatId,
              beatIndex: event.beatIndex
            };
            eventBus.emit('location.status_changed', statusEvent);
          }
        }

        if (update.descriptionAppend) {
          const location = await this.repo.findById(targetId);
          if (location) {
            const newDescription = location.description + '\n\n' + update.descriptionAppend;
            await this.repo.updateDescription(targetId, newDescription);
          }
        }
      }

      for (const discovery of mutations.discoveries) {
        const parentRegion = locations.find(
          loc => loc.type === 'region' && loc.name === discovery.parentRegionName
        );

        const newLocation: CreateLocation = {
          world_id: event.worldId,
          parent_location_id: parentRegion?.id || null,
          name: discovery.name,
          type: discovery.type as any,
          status: 'stable',
          description: discovery.description,
          tags: discovery.tags,
          relative_x: null,
          relative_y: null
        };

        // Allocate coordinates if not provided by AI
        try {
          if (parentRegion && parentRegion.relative_x !== null && parentRegion.relative_y !== null) {
            const coord = allocAround(
              { x: parentRegion.relative_x, y: parentRegion.relative_y },
              locations
                .filter(l => l.relative_x !== null && l.relative_y !== null)
                .map(l => ({ x: l.relative_x as number, y: l.relative_y as number }))
            );
            newLocation.relative_x = coord.x;
            newLocation.relative_y = coord.y;
          } else {
            const coord = allocCoords(
              1,
              locations
                .filter(l => l.relative_x !== null && l.relative_y !== null)
                .map(l => ({ x: l.relative_x as number, y: l.relative_y as number }))
            )[0];
            newLocation.relative_x = coord.x;
            newLocation.relative_y = coord.y;
          }
        } catch (coordErr) {
          logger.warn('Failed to allocate coordinate for discovery', {
            worldId: event.worldId,
            discoveryName: discovery.name,
            error: (coordErr as Error).message
          });
        }

        const saved = await this.repo.create(newLocation);

        const discoveryEvent: LocationDiscoveredEvent = {
          v: 1,
          worldId: event.worldId,
          locationId: saved.id,
          locationName: saved.name,
          type: saved.type,
          beatId: event.beatId,
          beatIndex: event.beatIndex
        };
        eventBus.emit('location.discovered', discoveryEvent);
      }

      logger.info('Completed beat reaction for locations', {
        worldId: event.worldId,
        beatId: event.beatId,
        updatesApplied: mutations.updates.length,
        locationsDiscovered: mutations.discoveries.length,
        duration_ms: Date.now() - startTime,
        correlation: event.worldId
      });

    } catch (error) {
      logger.error('Failed to react to beat', error, {
        worldId: event.worldId,
        beatId: event.beatId,
        correlation: event.worldId
      });
    }
  }

  /**
   * Public methods for direct location management
   */
  
  async findByWorldId(worldId: string): Promise<Location[]> {
    return this.repo.findByWorldId(worldId);
  }

  async findById(id: string): Promise<Location | null> {
    return this.repo.findById(id);
  }

  async findByParentId(parentId: string): Promise<Location[]> {
    return this.repo.findByParentId(parentId);
  }

  async search(worldId: string, query: string, tags?: string[]): Promise<Location[]> {
    return this.repo.search(worldId, query, tags);
  }

  async create(location: CreateLocation): Promise<Location> {
    const saved = await this.repo.create(location);
    
    const event: LocationCreatedEvent = {
      v: 1,
      worldId: saved.world_id,
      locationId: saved.id,
      name: saved.name,
      type: saved.type,
      parentId: saved.parent_location_id || undefined
    };
    eventBus.emit('location.created', event);
    
    return saved;
  }

  async update(id: string, updates: UpdateLocation): Promise<Location> {
    return this.repo.update(id, updates);
  }

  async enrichWithAI(locationId: string, worldContext: string): Promise<Location> {
    const location = await this.repo.findById(locationId);
    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }

    const enrichedDescription = await this.ai.enrichDescription({
      location,
      worldContext,
      recentEvents: location.historical_events.slice(-5).map(e => e.event)
    });

    return this.repo.update(locationId, { description: enrichedDescription });
  }
}