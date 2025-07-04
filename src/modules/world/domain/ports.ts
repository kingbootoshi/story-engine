import type { World, WorldArc, WorldBeat, WorldEvent, CreateEvent } from './schema';

// AI port interfaces
export interface AnchorContext {
  worldName: string;
  worldDescription: string;
  storyIdea?: string;
  previousArcs?: string[];
  currentLocations: string;
  /** Markdown list of factions in the world */
  currentFactions?: string;
  /** Markdown list of characters in the world */
  currentCharacters?: string;
  /** User ID for usage tracking */
  userId: string;
}

export interface BeatContext {
  worldName: string;
  worldDescription: string;
  arcDetailedDescription?: string;
  currentBeatIndex: number;
  previousBeats: WorldBeat[];
  nextAnchor: WorldBeat;
  recentEvents: string;
  currentLocations: string;
  /** Markdown list of factions in the world */
  currentFactions?: string;
  /** Markdown list of characters in the world */
  currentCharacters?: string;
  /** User ID for usage tracking */
  userId: string;
}

export interface SummaryContext {
  arcName: string;
  arcIdea: string;
  beatDescriptions: string;
  /** User ID for usage tracking */
  userId: string;
}

export interface AnchorDTO {
  beatIndex: number;
  beatName: string;
  description: string;
  worldDirectives: string[];
  majorEvents: string[];
  emergentStorylines: string[];
}

export interface BeatDTO {
  beatName: string;
  description: string;
  worldDirectives: string[];
  emergingConflicts: string[];
  environmentalChanges: string[] | null;
}

export interface WorldAI {
  generateAnchors(ctx: AnchorContext): Promise<{ anchors: AnchorDTO[]; arcDetailedDescription: string }>;
  generateBeat(ctx: BeatContext): Promise<BeatDTO>;
  summarizeArc(ctx: SummaryContext): Promise<string>;
}

// Repository port interfaces
export interface WorldRepo {
  // World operations
  createWorld(data: { name: string; description: string; user_id?: string }): Promise<World>;
  getWorld(id: string): Promise<World | null>;
  listWorlds(userId?: string): Promise<World[]>;
  updateWorld(id: string, data: Partial<World>): Promise<void>;
  
  // Arc operations
  createArc(worldId: string, storyName: string, storyIdea: string, detailedDescription?: string): Promise<WorldArc>;
  getArc(arcId: string): Promise<WorldArc | null>;
  getWorldArcs(worldId: string): Promise<WorldArc[]>;
  completeArc(arcId: string, summary: string): Promise<void>;
  
  // Beat operations
  createBeat(
    arcId: string,
    beatIndex: number,
    beatType: 'anchor' | 'dynamic',
    data: {
      beat_name: string;
      description: string;
      world_directives: string[];
      emergent_storylines: string[];
    }
  ): Promise<WorldBeat>;
  getArcBeats(arcId: string): Promise<WorldBeat[]>;
  getCurrentBeat(arcId: string): Promise<WorldBeat | null>;
  getBeat(beatId: string): Promise<WorldBeat | null>;
  
  // Event operations
  createEvent(event: CreateEvent): Promise<WorldEvent>;
  getRecentEvents(worldId: string, limit?: number): Promise<WorldEvent[]>;
  getBeatEvents(beatId: string): Promise<WorldEvent[]>;
  getEvents(worldId: string, filters?: {
    eventType?: string;
    impactLevel?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<WorldEvent[]>;
  
  // Helper operations
  getArcByWorld(worldId: string): Promise<WorldArc | null>;
}