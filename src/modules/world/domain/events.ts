// ---------------------------------------------------------------------------
// DEPRECATION SHIM (v1 → v2)
// ---------------------------------------------------------------------------
// All world-level event interfaces have moved to `events.v2.ts` where they are
// unified and versioned.  This legacy file now only re-exports those types to
// keep import paths stable during migration.
// ---------------------------------------------------------------------------

export * from './events.v2';

/**
 * TEMPORARY SHIM
 * ---------------
 * We re-export v2 event types under the legacy module path so existing imports
 * compile without modification.  Remove this file once all references have
 * been migrated to explicit versioned imports.
 */

export interface Legacy_WorldCreatedEvent {
  worldId: string;
  name: string;
  description: string;
}

export interface Legacy_WorldArcCreatedEvent {
  worldId: string;
  arcId: string;
  arcName: string;
}

export interface Legacy_WorldBeatCreatedEvent {
  worldId: string;
  arcId: string;
  beatId: string;
  beatIndex: number;
  beatName: string;
}

export interface Legacy_WorldArcCompletedEvent {
  worldId: string;
  arcId: string;
  arcName: string;
  summary: string;
}

export interface Legacy_WorldEventLoggedEvent {
  worldId: string;
  eventId: string;
  eventType: 'player_action' | 'system_event' | 'world_event';
  impactLevel: 'minor' | 'moderate' | 'major';
}

export interface Legacy_WorldEventLogged {
  v: 1;
  worldId: string;
  eventId: string;
  impact: 'minor' | 'moderate' | 'major' | 'catastrophic';
  description: string;
  _hop?: number;
}

export interface Legacy_StoryBeatCreated {
  v: 1;
  worldId: string;
  arcId: string;
  beatId: string;
  beatIndex: number;
  beatName: string;
  directives: string[];
  emergent: string[];
  _hop?: number;
}

/*
 * ---------------------------------------------------------------------------
 * Deprecated v1 interfaces (kept here for reference only).  Commented out to
 * prevent duplicate identifier errors after migration to v2.
 * ---------------------------------------------------------------------------
 */
//