import { z } from 'zod';
import { router, publicProcedure } from '../../../../core/trpc/init';
import { container } from 'tsyringe';
import { LocationService } from '../../application/LocationService';
import { CreateLocation, UpdateLocation, UUIDString } from '../../domain/schema';
import { createLogger } from '../../../../core/infra/logger';

const logger = createLogger('location.router');

/**
 * Location module tRPC router
 */
export const locationRouter = router({
  /**
   * List all locations for a world
   */
  list: publicProcedure
    .input(z.object({
      worldId: UUIDString
    }))
    .query(async ({ input }) => {
      logger.debug('Listing locations', { worldId: input.worldId });
      const service = container.resolve(LocationService);
      return service.findByWorldId(input.worldId);
    }),

  /**
   * Get a single location by ID
   */
  get: publicProcedure
    .input(UUIDString)
    .query(async ({ input }) => {
      logger.debug('Getting location', { locationId: input });
      const service = container.resolve(LocationService);
      const location = await service.findById(input);
      
      if (!location) {
        throw new Error(`Location ${input} not found`);
      }
      
      return location;
    }),

  /**
   * Get locations by parent region
   * INTERNAL: Use list with filtering instead
   */
  getByRegion: publicProcedure
    .input(z.object({
      regionId: UUIDString
    }))
    .query(async ({ input }) => {
      logger.debug('Getting locations by region', { regionId: input.regionId });
      const service = container.resolve(LocationService);
      return service.findByParentId(input.regionId);
    }),

  /**
   * Get location history
   * INTERNAL: History is included in get endpoint
   */
  getHistory: publicProcedure
    .input(z.object({
      locationId: UUIDString,
      limit: z.number().int().positive().max(100).optional().default(10)
    }))
    .query(async ({ input }) => {
      logger.debug('Getting location history', { 
        locationId: input.locationId,
        limit: input.limit 
      });
      
      const service = container.resolve(LocationService);
      const location = await service.findById(input.locationId);
      
      if (!location) {
        throw new Error(`Location ${input.locationId} not found`);
      }
      
      return location.historical_events
        .slice(-input.limit)
        .reverse();
    }),

  /**
   * Search locations by name or tags
   */
  search: publicProcedure
    .input(z.object({
      worldId: UUIDString,
      query: z.string().min(1),
      tags: z.array(z.string()).optional()
    }))
    .query(async ({ input }) => {
      logger.debug('Searching locations', { 
        worldId: input.worldId,
        query: input.query,
        tags: input.tags 
      });
      
      const service = container.resolve(LocationService);
      return service.search(input.worldId, input.query, input.tags);
    }),

  /**
   * Create a new location manually
   */
  create: publicProcedure
    .input(CreateLocation)
    .mutation(async ({ input }) => {
      logger.info('Creating location', { 
        worldId: input.world_id,
        name: input.name,
        type: input.type 
      });
      
      const service = container.resolve(LocationService);
      return service.create(input);
    }),

  /**
   * Update a location
   */
  update: publicProcedure
    .input(z.object({
      id: UUIDString,
      updates: UpdateLocation
    }))
    .mutation(async ({ input }) => {
      logger.info('Updating location', { 
        locationId: input.id,
        updates: Object.keys(input.updates)
      });
      
      const service = container.resolve(LocationService);
      return service.update(input.id, input.updates);
    }),

  /**
   * Enrich location description with AI
   * INTERNAL: AI enrichment happens automatically
   */
  enrichWithAI: publicProcedure
    .input(z.object({
      locationId: UUIDString,
      worldContext: z.string()
    }))
    .mutation(async ({ input }) => {
      logger.info('Enriching location with AI', { 
        locationId: input.locationId 
      });
      
      const service = container.resolve(LocationService);
      return service.enrichWithAI(input.locationId, input.worldContext);
    }),

  /**
   * Delete a location
   */
  delete: publicProcedure
    .input(UUIDString)
    .mutation(async ({ input }) => {
      logger.info('Deleting location', { 
        locationId: input 
      });
      
      const service = container.resolve(LocationService);
      await service.delete(input);
      
      return { success: true };
    })
});