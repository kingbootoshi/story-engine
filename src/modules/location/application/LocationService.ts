import { injectable, inject } from 'tsyringe';
import { eventBus } from '../../../core/infra/eventBus';
import { createLogger } from '../../../core/infra/logger';
import type { DomainEvent } from '../../../core/types';
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
  LocationWorldCompleteEvent 
} from '../domain/events';
import type { WorldCreatedEvent, StoryBeatCreated } from '../../world/domain/events';

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
    eventBus.on('world.created', (event) => this.handleWorldCreated(event));
    eventBus.on('world.beat.created', (event) => this.handleBeatCreated(event));
    logger.info('LocationService subscribed to events');
  }

  /**
   * Handle world creation by generating initial locations
   */
  private async handleWorldCreated(event: DomainEvent<WorldCreatedEvent>) {
    logger.info('Handling world.created event', { 
      worldId: event.payload.worldId,
      correlation: event.payload.worldId 
    });
    
    try {
      await this.seedInitialMap(event);
    } catch (error) {
      logger.error('Failed to handle world.created', error, { 
        worldId: event.payload.worldId,
        correlation: event.payload.worldId 
      });
    }
  }

  /**
   * Handle beat creation by potentially mutating locations
   */
  private async handleBeatCreated(event: DomainEvent<StoryBeatCreated>) {
    logger.info('Handling world.beat.created event', { 
      worldId: event.payload.worldId,
      beatId: event.payload.beatId,
      beatIndex: event.payload.beatIndex,
      correlation: event.payload.worldId 
    });
    
    try {
      await this.reactToBeat(event);
    } catch (error) {
      logger.error('Failed to handle world.beat.created', error, { 
        worldId: event.payload.worldId,
        beatId: event.payload.beatId,
        correlation: event.payload.worldId 
      });
    }
  }

  /**
   * Generate initial world map using individual AI agents
   */
  async seedInitialMap(event: DomainEvent<WorldCreatedEvent>): Promise<void> {
    const startTime = Date.now();
    logger.info('Seeding initial map for world', { 
      worldId: event.payload.worldId,
      correlation: event.payload.worldId 
    });

    try {
      let totalLocationCount = 0;
      
      // Step 1: Generate regions
      logger.info('Generating regions', {
        worldId: event.payload.worldId,
        correlation: event.payload.worldId
      });
      
      // Use user_id from the event
      const userId = event.user_id;
      if (!userId) {
        logger.error('Event missing user_id', { worldId: event.payload.worldId });
        throw new Error('Event missing user_id for world creation');
      }
      
      const regionResult = await this.ai.generateRegions({
        worldName: event.payload.name,
        worldDescription: event.payload.description,
        userId
      });

      logger.debug('AI generated regions', {
        worldId: event.payload.worldId,
        regionCount: regionResult.regions.length,
        correlation: event.payload.worldId
      });

      // Ensure regions is an array
      const regionsArray = Array.isArray(regionResult.regions) 
        ? regionResult.regions 
        : [];
      
      // Save regions to database
      const savedRegions = await this.repo.createBulk(
        regionsArray.map(region => ({
          world_id: event.payload.worldId,
          parent_location_id: null,
          name: region.name,
          type: 'region' as const,
          status: 'stable' as LocationStatus,
          description: region.description,
          tags: region.tags,
          relative_x: region.relative_position?.x ?? null,
          relative_y: region.relative_position?.y ?? null
        }))
      );

      totalLocationCount += savedRegions.length;

      // Emit events for created regions
      for (const region of savedRegions) {
        const locationEvent: LocationCreatedEvent = {
          v: 1,
          worldId: event.payload.worldId,
          locationId: region.id,
          name: region.name,
          type: region.type,
          parentId: undefined
        };
        eventBus.emit('location.created', locationEvent);
      }

      // Step 2: Generate locations for each region
      // Create world context to avoid re-serializing for each region
      const worldCtx = {
        worldName: event.payload.name,
        worldDescription: event.payload.description,
        userId
      };

      // Process all regions in parallel
      const regionTasks = savedRegions.map(async (region) => {
        logger.info('Generating locations for region', {
          worldId: event.payload.worldId,
          regionId: region.id,
          regionName: region.name,
          correlation: event.payload.worldId
        });

        // Track existing locations in this region
        const existingInRegion: Array<{
          name: string;
          type: string;
          relative_position: { x: number; y: number };
        }> = [];

        // Generate cities first (need their coordinates)
        const cityResult = await this.ai.generateCities({
          ...worldCtx,
          regionName: region.name,
          regionDescription: region.description,
          regionTags: region.tags,
          existingLocationsInRegion: existingInRegion
        });

        // Ensure cities is an array
        const citiesArray = Array.isArray(cityResult.cities) 
          ? cityResult.cities 
          : [];

        const savedCities = await this.repo.createBulk(
          citiesArray.map(city => ({
            world_id: event.payload.worldId,
            parent_location_id: region.id,
            name: city.name,
            type: 'city' as const,
            status: 'stable' as LocationStatus,
            description: city.description,
            tags: city.tags,
            relative_x: city.relative_position?.x ?? null,
            relative_y: city.relative_position?.y ?? null
          }))
        );

        // Update existing locations tracking
        savedCities.forEach(city => {
          existingInRegion.push({
            name: city.name,
            type: 'city',
            relative_position: { x: city.relative_x!, y: city.relative_y! }
          });
        });

        // Emit events for cities
        for (const city of savedCities) {
          const locationEvent: LocationCreatedEvent = {
            v: 1,
            worldId: event.payload.worldId,
            locationId: city.id,
            name: city.name,
            type: city.type,
            parentId: region.id
          };
          eventBus.emit('location.created', locationEvent);
        }

        // Generate landmarks
        const landmarkResult = await this.ai.generateLandmarks({
          ...worldCtx,
          regionName: region.name,
          regionDescription: region.description,
          regionTags: region.tags,
          existingLocationsInRegion: existingInRegion
        });

        // Ensure landmarks is an array
        const landmarksArray = Array.isArray(landmarkResult.landmarks) 
          ? landmarkResult.landmarks 
          : [];

        const savedLandmarks = await this.repo.createBulk(
          landmarksArray.map(landmark => ({
            world_id: event.payload.worldId,
            parent_location_id: region.id,
            name: landmark.name,
            type: 'landmark' as const,
            status: 'stable' as LocationStatus,
            description: landmark.description,
            tags: landmark.tags,
            relative_x: landmark.relative_position?.x ?? null,
            relative_y: landmark.relative_position?.y ?? null
          }))
        );

        // Update existing locations tracking
        savedLandmarks.forEach(landmark => {
          existingInRegion.push({
            name: landmark.name,
            type: 'landmark',
            relative_position: { x: landmark.relative_x!, y: landmark.relative_y! }
          });
        });

        // Emit events for landmarks
        for (const landmark of savedLandmarks) {
          const locationEvent: LocationCreatedEvent = {
            v: 1,
            worldId: event.payload.worldId,
            locationId: landmark.id,
            name: landmark.name,
            type: landmark.type,
            parentId: region.id
          };
          eventBus.emit('location.created', locationEvent);
        }

        // Generate wilderness
        const wildernessResult = await this.ai.generateWilderness({
          ...worldCtx,
          regionName: region.name,
          regionDescription: region.description,
          regionTags: region.tags,
          existingLocationsInRegion: existingInRegion
        });

        // Ensure wilderness is an array
        const wildernessArray = Array.isArray(wildernessResult.wilderness) 
          ? wildernessResult.wilderness 
          : [];

        const savedWilderness = await this.repo.createBulk(
          wildernessArray.map(wild => ({
            world_id: event.payload.worldId,
            parent_location_id: region.id,
            name: wild.name,
            type: 'wilderness' as const,
            status: 'stable' as LocationStatus,
            description: wild.description,
            tags: wild.tags,
            relative_x: wild.relative_position?.x ?? null,
            relative_y: wild.relative_position?.y ?? null
          }))
        );

        // Emit events for wilderness
        for (const wild of savedWilderness) {
          const locationEvent: LocationCreatedEvent = {
            v: 1,
            worldId: event.payload.worldId,
            locationId: wild.id,
            name: wild.name,
            type: wild.type,
            parentId: region.id
          };
          eventBus.emit('location.created', locationEvent);
        }

        logger.info('Completed location generation for region', {
          worldId: event.payload.worldId,
          regionName: region.name,
          cityCount: savedCities.length,
          landmarkCount: savedLandmarks.length,
          wildernessCount: savedWilderness.length,
          correlation: event.payload.worldId
        });

        // Return counts for aggregation
        return {
          cityCount: savedCities.length,
          landmarkCount: savedLandmarks.length,
          wildernessCount: savedWilderness.length
        };
      });

      // Wait for all regions to complete and aggregate counts
      const regionResults = await Promise.all(regionTasks);
      totalLocationCount = savedRegions.length + regionResults.reduce((sum, result) => 
        sum + result.cityCount + result.landmarkCount + result.wildernessCount, 0
      );

      // Step 3: Emit location.world.complete event
      const completionEvent: LocationWorldCompleteEvent = {
        v: 1,
        worldId: event.payload.worldId,
        regionCount: savedRegions.length,
        totalLocationCount: totalLocationCount
      };
      
      eventBus.emit('location.world.complete', completionEvent, userId);

      logger.info('Successfully created all locations for world', {
        worldId: event.payload.worldId,
        regionCount: savedRegions.length,
        totalLocationCount: totalLocationCount,
        duration_ms: Date.now() - startTime,
        correlation: event.payload.worldId
      });

    } catch (error) {
      logger.error('Failed to seed initial map', error, {
        worldId: event.payload.worldId,
        correlation: event.payload.worldId
      });
      throw error;
    }
  }

  /**
   * React to story beat by mutating locations
   */
  async reactToBeat(event: DomainEvent<StoryBeatCreated>): Promise<void> {
    const startTime = Date.now();
    logger.info('Processing beat for location reactions', {
      worldId: event.payload.worldId,
      beatId: event.payload.beatId,
      beatIndex: event.payload.beatIndex,
      correlation: event.payload.worldId
    });

    try {
      // Use user_id from the event
      const userId = event.user_id;
      if (!userId) {
        logger.error('Event missing user_id', { worldId: event.payload.worldId });
        throw new Error('Event missing user_id for world creation');
      }
      
      // Step 1: Get all locations for context
      const locations = await this.repo.findByWorldId(event.payload.worldId);
      
      // Step 2: Select which locations should react
      const selectionContext = {
        worldId: event.payload.worldId,
        beatDirectives: event.payload.directives.join('\n'),
        emergentStorylines: event.payload.emergent,
        currentLocations: locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          type: loc.type,
          status: loc.status,
          description: loc.description.substring(0, 200)
        })),
        userId
      };

      logger.info('Selecting locations that should react', {
        worldId: event.payload.worldId,
        beatId: event.payload.beatId,
        locationCount: locations.length,
        correlation: event.payload.worldId
      });

      const selectionResult = await this.ai.selectReactingLocations(selectionContext);

      logger.info('Location selection complete', {
        worldId: event.payload.worldId,
        beatId: event.payload.beatId,
        reactingLocationCount: selectionResult.reactions.length,
        reactingLocationIds: selectionResult.reactions.map(r => r.locationId),
        correlation: event.payload.worldId
      });

      // Step 3: Process each reacting location individually
      if (selectionResult.reactions.length > 0) {
        await this.processIndividualMutations(event, selectionResult.reactions, locations, userId);
      }

      logger.info('Completed beat reaction for locations', {
        worldId: event.payload.worldId,
        beatId: event.payload.beatId,
        reactingLocationCount: selectionResult.reactions.length,
        duration_ms: Date.now() - startTime,
        correlation: event.payload.worldId
      });

    } catch (error) {
      logger.error('Failed to react to beat', error, {
        worldId: event.payload.worldId,
        beatId: event.payload.beatId,
        correlation: event.payload.worldId
      });
    }
  }

  /**
   * Process individual location mutations in parallel
   */
  private async processIndividualMutations(
    event: DomainEvent<StoryBeatCreated>, 
    reactions: Array<{ locationId: string; locationName: string; reason: string }>,
    locations: Location[],
    userId: string
  ): Promise<void> {
    const startTime = Date.now();
    logger.info('Processing individual location mutations', {
      worldId: event.payload.worldId,
      beatId: event.payload.beatId,
      reactionCount: reactions.length,
      correlation: event.payload.worldId
    });

    // Process each location mutation in parallel
    const mutationTasks = reactions.map(async (reaction) => {
      try {
        // Find the full location data
        const location = locations.find(loc => loc.id === reaction.locationId);
        if (!location) {
          logger.warn('Location not found for reaction', {
            locationId: reaction.locationId,
            locationName: reaction.locationName,
            worldId: event.payload.worldId,
            correlation: event.payload.worldId
          });
          return;
        }

        // Create context for individual mutation
        const mutationContext = {
          worldId: event.payload.worldId,
          location: {
            id: location.id,
            name: location.name,
            type: location.type,
            status: location.status,
            description: location.description,
            tags: location.tags,
            historical_events: location.historical_events
          },
          beatDirectives: event.payload.directives.join('\n'),
          emergentStorylines: event.payload.emergent,
          reactionReason: reaction.reason,
          userId
        };

        logger.info('Mutating individual location', {
          worldId: event.payload.worldId,
          locationId: location.id,
          locationName: location.name,
          reactionReason: reaction.reason,
          correlation: event.payload.worldId
        });

        const mutationResult = await this.ai.mutateIndividualLocation(mutationContext);

        // Apply the mutations
        let hasChanges = false;

        if (mutationResult.newStatus && mutationResult.newStatus !== location.status) {
          const historicalEvent: HistoricalEvent = {
            timestamp: new Date().toISOString(),
            event: mutationResult.historicalEvent || reaction.reason,
            previous_status: location.status,
            beat_index: event.payload.beatIndex
          };

          await this.repo.updateStatus(location.id, mutationResult.newStatus, historicalEvent);
          hasChanges = true;

          const statusEvent: LocationStatusChangedEvent = {
            v: 1,
            worldId: event.payload.worldId,
            locationId: location.id,
            locationName: location.name,
            oldStatus: location.status,
            newStatus: mutationResult.newStatus,
            reason: mutationResult.historicalEvent || reaction.reason,
            beatId: event.payload.beatId,
            beatIndex: event.payload.beatIndex
          };
          eventBus.emit('location.status_changed', statusEvent, userId);
        }

        if (mutationResult.descriptionAppend) {
          const newDescription = location.description + '\n\n' + mutationResult.descriptionAppend;
          await this.repo.updateDescription(location.id, newDescription);
          hasChanges = true;
        }

        if (mutationResult.historicalEvent && !mutationResult.newStatus) {
          // Add historical event without status change
          const historicalEvent: HistoricalEvent = {
            timestamp: new Date().toISOString(),
            event: mutationResult.historicalEvent,
            previous_status: location.status,
            beat_index: event.payload.beatIndex
          };
          await this.repo.addHistoricalEvent(location.id, historicalEvent);
          hasChanges = true;
        }

        logger.info('Completed individual location mutation', {
          worldId: event.payload.worldId,
          locationId: location.id,
          locationName: location.name,
          hasChanges,
          hasStatusChange: !!mutationResult.newStatus,
          hasDescriptionAppend: !!mutationResult.descriptionAppend,
          hasHistoricalEvent: !!mutationResult.historicalEvent,
          correlation: event.payload.worldId
        });

      } catch (error) {
        logger.error('Failed to mutate individual location', error, {
          locationId: reaction.locationId,
          locationName: reaction.locationName,
          worldId: event.payload.worldId,
          beatId: event.payload.beatId,
          correlation: event.payload.worldId
        });
      }
    });

    // Wait for all mutations to complete
    await Promise.all(mutationTasks);

    logger.info('Completed all location mutations', {
      worldId: event.payload.worldId,
      beatId: event.payload.beatId,
      reactionCount: reactions.length,
      duration_ms: Date.now() - startTime,
      correlation: event.payload.worldId
    });
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

  async delete(id: string): Promise<void> {
    logger.info('Deleting location', { locationId: id });
    
    const location = await this.repo.findById(id);
    if (!location) {
      throw new Error(`Location ${id} not found`);
    }
    
    await this.repo.delete(id);
    
    logger.info('Location deleted', { 
      locationId: id,
      worldId: location.world_id,
      name: location.name
    });
  }
}