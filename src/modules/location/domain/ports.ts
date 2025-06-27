import type { 
  Location, 
  CreateLocation, 
  UpdateLocation, 
  LocationStatus, 
  HistoricalEvent,
  LocationWithPosition 
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
  
  /**
   * Delete a location by ID
   */
  delete(id: string): Promise<void>;
}

/**
 * Context for initial world map generation
 */
export interface MapGenerationContext {
  worldName: string;
  worldDescription: string;
  userId?: string;
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
  userId?: string;
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
 * Result of location mutation analysis
 */
export interface LocationMutations {
  updates: LocationUpdate[];
}


/**
 * Context for enriching location description
 */
export interface EnrichmentContext {
  location: Location;
  worldContext: string;
  recentEvents?: string[];
  userId?: string;
}

/**
 * Context for region generation
 */
export interface RegionGenerationContext {
  worldName: string;
  worldDescription: string;
  userId?: string;
}

/**
 * Result of region generation
 */
export interface RegionGenerationResult {
  regions: Array<{
    name: string;
    description: string;
    tags: string[];
    relative_position: {
      x: number;
      y: number;
    };
  }>;
}

/**
 * Context for location generation within a region
 */
export interface LocationGenerationContext {
  worldName: string;
  worldDescription: string;
  regionName: string;
  regionDescription: string;
  regionTags: string[];
  existingLocationsInRegion: Array<{
    name: string;
    type: string;
    relative_position: {
      x: number;
      y: number;
    };
  }>;
  userId?: string;
}

/**
 * Result of city generation
 */
export interface CityGenerationResult {
  cities: Array<{
    name: string;
    description: string;
    tags: string[];
    relative_position: {
      x: number;
      y: number;
    };
  }>;
}

/**
 * Result of landmark generation
 */
export interface LandmarkGenerationResult {
  landmarks: Array<{
    name: string;
    description: string;
    tags: string[];
    relative_position: {
      x: number;
      y: number;
    };
  }>;
}

/**
 * Result of wilderness generation
 */
export interface WildernessGenerationResult {
  wilderness: Array<{
    name: string;
    description: string;
    tags: string[];
    relative_position: {
      x: number;
      y: number;
    };
  }>;
}

/**
 * Context for mutation decision
 */
export interface MutationDecisionContext {
  worldId: string;
  beatDirectives: string;
  emergentStorylines: string[];
  userId?: string;
}

/**
 * Result of mutation decision
 */
export interface MutationDecisionResult {
  think: string;
  shouldMutate: boolean;
}


/**
 * AI adapter interface for location-related AI operations
 */
export interface LocationAI {
  /**
   * Generate initial world map with 8-15 locations
   */
  buildWorldMap(context: MapGenerationContext): Promise<MapGenerationResult>;
  
  /**
   * Generate regions for a world (2-4 regions)
   */
  generateRegions(context: RegionGenerationContext): Promise<RegionGenerationResult>;
  
  /**
   * Generate cities for a region (1-5 cities)
   */
  generateCities(context: LocationGenerationContext): Promise<CityGenerationResult>;
  
  /**
   * Generate landmarks for a region (1-3 landmarks)
   */
  generateLandmarks(context: LocationGenerationContext): Promise<LandmarkGenerationResult>;
  
  /**
   * Generate wilderness areas for a region (1-2 wilderness)
   */
  generateWilderness(context: LocationGenerationContext): Promise<WildernessGenerationResult>;
  
  /**
   * Decide if locations should be mutated based on story beat
   */
  decideMutation(context: MutationDecisionContext): Promise<MutationDecisionResult>;
  
  /**
   * Analyze beat and determine location mutations
   */
  mutateLocations(context: LocationMutationContext): Promise<LocationMutations>;
  
  /**
   * Enrich a location's description with more detail
   */
  enrichDescription(context: EnrichmentContext): Promise<string>;
}