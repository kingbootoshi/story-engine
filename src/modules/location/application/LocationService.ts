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
import { generateCoords } from '../../../core/infra/coords';
import { createTaskQueue } from '../../../core/infra/queue';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('location.service');
const USE_MAP_PLANNER = process.env.USE_MAP_PLANNER === 'true';

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
      if (USE_MAP_PLANNER) {
        // ------------ New staged pipeline -------------
        const desiredCount = Math.floor(Math.random() * 8) + 8; // 8–15 inclusive
        const coords = generateCoords(desiredCount);
        const ids = coords.map(() => uuidv4());

        const { stubs } = await this.ai.planWorldMap({
          worldName: event.name,
          worldDescription: event.description,
          ids,
          coords
        });

        if (stubs.length !== desiredCount) {
          throw new Error(`Planner returned ${stubs.length} stubs; expected ${desiredCount}`);
        }

        // Persist without description/tags
        const createLocations: CreateLocation[] = stubs.map((stub) => ({
          world_id: event.worldId,
          parent_location_id: stub.parent_location_id,
          name: stub.name,
          type: stub.type,
          status: 'stable',
          description: '',
          tags: [],
          relative_x: stub.relative_x,
          relative_y: stub.relative_y
        }));

        const savedStubs = await this.repo.createBulk(createLocations);
        logger.debug('[seed] inserted stubs', {
          worldId: event.worldId,
          regions: savedStubs.filter((l) => l.type === 'region').length,
          childCount: savedStubs.filter((l) => l.type !== 'region').length,
          correlation: event.worldId
        });

        // Map id to saved id for parent mapping though they already align.
        const queue = createTaskQueue(3);
        logger.debug('[seed] queued detail jobs', { worldId: event.worldId, jobCount: stubs.length });

        stubs.forEach((stub) => {
          queue.add(async () => {
            const { description, tags } = await this.ai.detailLocation({
              stub,
              worldName: event.name,
              worldDescription: event.description
            });
            await this.repo.update(stub.id, { description, tags });
            logger.debug('[repo] update desc ok', { locationId: stub.id });
          });
        });

        await queue.onIdle();

        // Fire events similar to legacy path
        for (const loc of savedStubs) {
          const locationEvent: LocationCreatedEvent = {
            v: 1,
            worldId: event.worldId,
            locationId: loc.id,
            name: loc.name,
            type: loc.type,
            parentId: loc.parent_location_id || undefined
          };
          eventBus.emit('location.created', locationEvent);
        }

        logger.info('Successfully created locations for world (planner path)', {
          worldId: event.worldId,
          locationCount: savedStubs.length,
          duration_ms: Date.now() - startTime,
          correlation: event.worldId
        });
        return;
      }

      // ------------ Legacy single-call path -------------
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
      
      // Utility to resolve a possibly-name reference to a proper UUID.
      const resolveLocationId = (idOrName: string): string | null => {
        const byId = locations.find((l) => l.id === idOrName);
        if (byId) return byId.id;
        const byName = locations.find((l) => l.name.toLowerCase() === idOrName.toLowerCase());
        if (byName) {
          logger.warn('Legacy location reference (name instead of UUID) detected', {
            provided: idOrName,
            resolvedId: byName.id,
            correlation: event.worldId
          });
          return byName.id;
        }
        return null;
      };

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
        const targetId = resolveLocationId(update.locationId);
        if (!targetId) {
          logger.warn('Unknown location reference in update', { upd: update, correlation: event.worldId });
          continue;
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