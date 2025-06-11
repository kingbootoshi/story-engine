// Redesigned world-scope event contracts – v1 unified schema
// ----------------------------------------------------------
// Every payload carries the world timeline triple:
//   worldId · arcId · beatId
// arcId and beatId MAY be null when they are not yet applicable
// (e.g. during world.created)

export type ID = string; // local alias to keep the file standalone – replace with shared ID type when available

/**
 * Common context keys present on ALL world-level events.
 */
export interface WorldCtx {
  worldId: ID;
  /** Active story arc; null until the first arc is created */
  arcId: ID | null;
  /** Current beat pointer; null until an anchor or dynamic beat exists */
  beatId: ID | null;
}

/** Mandatory version field so the bus can evolve safely. */
export interface Versioned {
  v: 1;
}

/** Discriminated base interface for world events. */
export interface WorldEventBase extends WorldCtx, Versioned {
  kind: string; // discriminator – matches the eventBus topic suffix
  _hop?: number; // eventBus hop counter (injected automatically)
}

/* ────────────────────────────────────────────────────────
   LIFECYCLE EVENTS
   ──────────────────────────────────────────────────────── */

export interface WorldCreated extends WorldEventBase {
  kind: 'world.created';
  name: string;
  description: string;
  // arcId & beatId are null – world just came into existence
}

export interface WorldArcCreated extends WorldEventBase {
  kind: 'world.arc.created';
  arcNumber: number;
  arcName: string;
  // beatId is null – anchors to follow
}

export interface WorldArcCompleted extends WorldEventBase {
  kind: 'world.arc.completed';
  arcName: string;
  summary: string;
}

/* ────────────────────────────────────────────────────────
   STORY BEATS
   ──────────────────────────────────────────────────────── */

export interface StoryBeatCreated extends WorldEventBase {
  kind: 'world.beat.created';
  beatIndex: number; // 0–14 inclusive
  beatName: string;
  beatType: 'anchor' | 'dynamic';
  directives: string[];
  emergent: string[];
}

/* ────────────────────────────────────────────────────────
   WORLD EVENT LOGGING
   ──────────────────────────────────────────────────────── */

export interface WorldEventLogged extends WorldEventBase {
  kind: 'world.event.logged';
  eventId: ID;
  eventType: 'player_action' | 'system_event' | 'world_event';
  impact: 'minor' | 'moderate' | 'major' | 'catastrophic';
  description: string;
}

/* ────────────────────────────────────────────────────────
   UNION EXPORT
   ──────────────────────────────────────────────────────── */

export type WorldDomainEvent =
  | WorldCreated
  | WorldArcCreated
  | WorldArcCompleted
  | StoryBeatCreated
  | WorldEventLogged;

/* ────────────────────────────────────────────────────────
   LEGACY TYPE ALIASES – will be removed after consumers migrate
   ──────────────────────────────────────────────────────── */

// Legacy interfaces with relaxed requirements for backward-compatibility.
// They extend the new canonical payloads but mark newly added fields optional
// so older test fixtures compile without changes.

export interface WorldCreatedEvent extends Omit<WorldCreated, 'v' | 'kind' | 'arcId' | 'beatId'> {
  v?: 1;
  kind?: 'world.created';
  arcId?: ID | null;
  beatId?: ID | null;
  // some older tests added userId – keep it optional to avoid breaking them
  userId?: string;
}

export interface WorldArcCreatedEvent extends Omit<WorldArcCreated, 'v' | 'kind' | 'beatId'> {
  v?: 1;
  kind?: 'world.arc.created';
  beatId?: ID | null;
}

export interface WorldBeatCreatedEvent extends Omit<StoryBeatCreated, 'v' | 'kind' | 'beatType' | 'beatName'> {
  v?: 1;
  kind?: 'world.beat.created';
  beatType?: 'anchor' | 'dynamic';
  beatName?: string;
}

export type WorldArcCompletedEvent = WorldArcCompleted;
export interface WorldEventLoggedEvent extends WorldEventLogged {} // keeping interface form for minimal churn