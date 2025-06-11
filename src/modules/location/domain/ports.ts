import type { 
  Location, 
  CreateLocation, 
  UpdateLocation, 
  LocationStatus, 
  HistoricalEvent,
  LocationWithPosition,
  LocationStub
} from './schema';

/**
 * Repository interface for location persistence
 */
export interface LocationRepository {
  /**
   * Create multiple locations in a single transaction
   */
  createBulk(locations: CreateLocation[]): Promise<Location[]>;
  
  /**
   * Create a single location
   */
  create(location: CreateLocation): Promise<Location>;
  
  /**
   * Find all locations for a world
   */
  findByWorldId(worldId: string): Promise<Location[]>;
  
  /**
   * Find a location by ID
   */
  findById(id: string): Promise<Location | null>;
  
  /**
   * Find locations by parent location ID
   */
  findByParentId(parentId: string): Promise<Location[]>;
  
  /**
   * Update location status and add historical event
   */
  updateStatus(id: string, status: LocationStatus, event: HistoricalEvent): Promise<void>;
  
  /**
   * Update location description
   */
  updateDescription(id: string, description: string): Promise<void>;
  
  /**
   * Add a historical event to a location
   */
  addHistoricalEvent(id: string, event: HistoricalEvent): Promise<void>;
  
  /**
   * Update a location with partial data
   */
  update(id: string, updates: UpdateLocation): Promise<Location>;
  
  /**
   * Search locations by name or tags
   */
  search(worldId: string, query: string, tags?: string[]): Promise<Location[]>;
}

/**
 * Context for initial world map generation
 */
export interface MapGenerationContext {
  worldName: string;
  worldDescription: string;
}

/**
 * Result of world map generation
 */
export interface MapGenerationResult {
  locations: LocationWithPosition[];
  mapSvg?: string;
}

/**
 * Context for location mutations based on story beats
 */
export interface LocationMutationContext {
  worldId: string;
  beatDirectives: string;
  emergentStorylines: string[];
  currentLocations: Array<{
    id: string;
    name: string;
    status: LocationStatus;
    description: string;
  }>;
}

/**
 * Mutation to apply to an existing location
 */
export interface LocationUpdate {
  locationId: string;
  newStatus?: LocationStatus;
  descriptionAppend?: string;
  reason: string;
}

/**
 * New location to discover
 */
export interface LocationDiscovery {
  name: string;
  type: string;
  description: string;
  parentRegionName?: string;
  tags: string[];
}

/**
 * Result of location mutation analysis
 */
export interface LocationMutations {
  updates: LocationUpdate[];
  discoveries: LocationDiscovery[];
}

/**
 * Context for enriching location description
 */
export interface EnrichmentContext {
  location: Location;
  worldContext: string;
  recentEvents?: string[];
}

/**
 * AI adapter interface for location-related AI operations
 */
export interface LocationAI {
  /**
   * Generate initial world map with 8-15 locations (legacy single-step)
   */
  buildWorldMap(context: MapGenerationContext): Promise<MapGenerationResult>;

  /**
   * New staged map generation – returns structural stubs only.
   */
  planWorldMap(ctx: MapGenerationContext & { ids: string[]; coords: Array<{ x: number; y: number }> }): Promise<{ stubs: LocationStub[] }>;

  /**
   * Enrich a stub with full descriptive detail.
   */
  detailLocation(input: { stub: LocationStub; worldName: string; worldDescription: string }): Promise<{ description: string; tags: string[] }>;

  /**
   * Analyze beat and determine location mutations
   */
  mutateLocations(context: LocationMutationContext): Promise<LocationMutations>;
  
  /**
   * Enrich a location's description with more detail
   */
  enrichDescription(context: EnrichmentContext): Promise<string>;
}