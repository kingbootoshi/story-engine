import { injectable } from 'tsyringe';
import { supabase } from '../../../../core/infra/supabase';
import { createLogger } from '../../../../core/infra/logger';
import type { LocationRepository } from '../../domain/ports';
import type { 
  Location, 
  CreateLocation, 
  UpdateLocation, 
  LocationStatus, 
  HistoricalEvent 
} from '../../domain/schema';

const logger = createLogger('location.repo');

/**
 * Supabase implementation of LocationRepository.
 * Provides persistence layer for location data using Supabase as the backend.
 * Follows the same pattern as SupabaseWorldRepo by directly importing the supabase singleton.
 */
@injectable()
export class SupabaseLocationRepo implements LocationRepository {
  
  /**
   * Creates multiple locations in a single transaction.
   * 
   * @param locations - Array of location creation data
   * @returns Promise<Location[]> - The created locations
   * @throws {Error} If the bulk creation fails
   */
  async createBulk(locations: CreateLocation[]): Promise<Location[]> {
    const startTime = Date.now();
    const correlation = `bulk-create-${Date.now()}`;
    
    logger.debug('Creating bulk locations', { 
      count: locations.length,
      correlation 
    });

    const { data, error } = await supabase
      .from('locations')
      .insert(locations)
      .select();

    if (error) {
      logger.error('Failed to create bulk locations', error, { 
        count: locations.length,
        correlation,
        duration_ms: Date.now() - startTime
      });
      throw error;
    }

    logger.info('Created bulk locations', { 
      count: data.length,
      duration_ms: Date.now() - startTime,
      correlation,
      success: true
    });
    
    return data;
  }

  /**
   * Creates a single location.
   * 
   * @param location - Location creation data
   * @returns Promise<Location> - The created location
   * @throws {Error} If the creation fails
   */
  async create(location: CreateLocation): Promise<Location> {
    const correlation = `create-location-${Date.now()}`;
    const startTime = Date.now();
    
    logger.debug('Creating location', { 
      name: location.name, 
      worldId: location.world_id,
      correlation 
    });

    const { data, error } = await supabase
      .from('locations')
      .insert(location)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create location', error, { 
        location,
        correlation,
        duration_ms: Date.now() - startTime
      });
      throw error;
    }

    logger.info('Created location', { 
      locationId: data.id,
      name: data.name,
      worldId: data.world_id,
      correlation,
      duration_ms: Date.now() - startTime,
      success: true
    });
    
    return data;
  }

  /**
   * Finds all locations within a specific world.
   * 
   * @param worldId - The world ID to search within
   * @returns Promise<Location[]> - Array of locations in the world
   * @throws {Error} If the query fails
   */
  async findByWorldId(worldId: string): Promise<Location[]> {
    const correlation = `find-by-world-${worldId}-${Date.now()}`;
    
    logger.debug('Finding locations by world', { worldId, correlation });

    const { data, error } = await supabase
      .from('locations')
      .select()
      .eq('world_id', worldId)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to find locations by world', error, { 
        worldId,
        correlation 
      });
      throw error;
    }

    logger.debug('Found locations', { 
      worldId, 
      count: data.length,
      correlation 
    });
    return data || [];
  }

  /**
   * Finds a location by its unique ID.
   * 
   * @param id - The location ID
   * @returns Promise<Location | null> - The location if found, null otherwise
   * @throws {Error} If the query fails (but not if location doesn't exist)
   */
  async findById(id: string): Promise<Location | null> {
    const correlation = `find-by-id-${id}-${Date.now()}`;
    
    logger.debug('Finding location by id', { id, correlation });

    const { data, error } = await supabase
      .from('locations')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 indicates "no rows found" which is expected behavior, not an error
      if (error.code === 'PGRST116') {
        logger.debug('Location not found', { id, correlation });
        return null;
      }
      logger.error('Failed to find location', error, { id, correlation });
      throw error;
    }

    logger.debug('Found location', { id, name: data.name, correlation });
    return data;
  }

  /**
   * Finds all child locations of a parent location.
   * 
   * @param parentId - The parent location ID
   * @returns Promise<Location[]> - Array of child locations
   * @throws {Error} If the query fails
   */
  async findByParentId(parentId: string): Promise<Location[]> {
    const correlation = `find-by-parent-${parentId}-${Date.now()}`;
    
    logger.debug('Finding locations by parent', { parentId, correlation });

    const { data, error } = await supabase
      .from('locations')
      .select()
      .eq('parent_location_id', parentId)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to find locations by parent', error, { 
        parentId,
        correlation 
      });
      throw error;
    }

    logger.debug('Found child locations', { 
      parentId, 
      count: data?.length || 0,
      correlation 
    });
    return data || [];
  }

  /**
   * Updates a location's status and adds a historical event.
   * 
   * @param id - The location ID
   * @param status - The new status
   * @param event - The historical event to record
   * @throws {Error} If the update fails or location doesn't exist
   */
  async updateStatus(id: string, status: LocationStatus, event: HistoricalEvent): Promise<void> {
    const startTime = Date.now();
    const correlation = `update-status-${id}-${Date.now()}`;
    
    logger.debug('Updating location status', { 
      id, 
      newStatus: status,
      correlation 
    });

    // First, fetch the current location to get existing events
    const location = await this.findById(id);
    if (!location) {
      logger.error('Location not found for status update', { id, correlation });
      throw new Error(`Location ${id} not found`);
    }

    const updatedEvents = [...location.historical_events, event];

    const { error } = await supabase
      .from('locations')
      .update({
        status,
        historical_events: updatedEvents,
        last_significant_change: event.timestamp,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      logger.error('Failed to update location status', error, { 
        id, 
        status,
        correlation,
        duration_ms: Date.now() - startTime
      });
      throw error;
    }

    logger.info('Updated location status', { 
      locationId: id,
      oldStatus: location.status,
      newStatus: status,
      duration_ms: Date.now() - startTime,
      correlation,
      success: true
    });
  }

  /**
   * Updates a location's description.
   * 
   * @param id - The location ID
   * @param description - The new description
   * @throws {Error} If the update fails
   */
  async updateDescription(id: string, description: string): Promise<void> {
    const correlation = `update-desc-${id}-${Date.now()}`;
    const startTime = Date.now();
    
    logger.debug('Updating location description', { id, correlation });

    const { error } = await supabase
      .from('locations')
      .update({
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      logger.error('Failed to update location description', error, { 
        id,
        correlation,
        duration_ms: Date.now() - startTime
      });
      throw error;
    }

    logger.info('Updated location description', { 
      locationId: id,
      correlation,
      duration_ms: Date.now() - startTime,
      success: true
    });
  }

  /**
   * Adds a historical event to a location without changing its status.
   * 
   * @param id - The location ID
   * @param event - The historical event to add
   * @throws {Error} If the update fails or location doesn't exist
   */
  async addHistoricalEvent(id: string, event: HistoricalEvent): Promise<void> {
    const correlation = `add-event-${id}-${Date.now()}`;
    const startTime = Date.now();
    
    logger.debug('Adding historical event', { 
      id, 
      event: event.event,
      correlation 
    });

    // Fetch current location to get existing events
    const location = await this.findById(id);
    if (!location) {
      logger.error('Location not found for event addition', { id, correlation });
      throw new Error(`Location ${id} not found`);
    }

    const updatedEvents = [...location.historical_events, event];

    const { error } = await supabase
      .from('locations')
      .update({
        historical_events: updatedEvents,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      logger.error('Failed to add historical event', error, { 
        id,
        correlation,
        duration_ms: Date.now() - startTime
      });
      throw error;
    }

    logger.info('Added historical event', { 
      locationId: id,
      eventType: event.event,
      correlation,
      duration_ms: Date.now() - startTime,
      success: true
    });
  }

  /**
   * Updates a location with partial data.
   * 
   * @param id - The location ID
   * @param updates - Partial location data to update
   * @returns Promise<Location> - The updated location
   * @throws {Error} If the update fails
   */
  async update(id: string, updates: UpdateLocation): Promise<Location> {
    const correlation = `update-${id}-${Date.now()}`;
    const startTime = Date.now();
    
    logger.debug('Updating location', { id, updates, correlation });

    const { data, error } = await supabase
      .from('locations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update location', error, { 
        id, 
        updates,
        correlation,
        duration_ms: Date.now() - startTime
      });
      throw error;
    }

    logger.info('Updated location', { 
      locationId: id,
      correlation,
      duration_ms: Date.now() - startTime,
      success: true
    });
    return data;
  }

  /**
   * Searches for locations within a world using text query and/or tags.
   * 
   * @param worldId - The world ID to search within
   * @param query - Text to search in name and description
   * @param tags - Optional tags to filter by
   * @returns Promise<Location[]> - Array of matching locations
   * @throws {Error} If the search fails
   */
  async search(worldId: string, query: string, tags?: string[]): Promise<Location[]> {
    const correlation = `search-${worldId}-${Date.now()}`;
    const startTime = Date.now();
    
    logger.debug('Searching locations', { 
      worldId, 
      query, 
      tags,
      correlation 
    });

    let queryBuilder = supabase
      .from('locations')
      .select()
      .eq('world_id', worldId);

    // Add text search if query provided
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Add tag filtering if tags provided
    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', tags);
    }

    const { data, error } = await queryBuilder.order('name', { ascending: true });

    if (error) {
      logger.error('Failed to search locations', error, { 
        worldId, 
        query, 
        tags,
        correlation,
        duration_ms: Date.now() - startTime
      });
      throw error;
    }

    logger.debug('Search results', { 
      worldId, 
      query, 
      count: data?.length || 0,
      correlation,
      duration_ms: Date.now() - startTime
    });
    return data || [];
  }
}