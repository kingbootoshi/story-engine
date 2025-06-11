import type { ID } from '../../../core/types';

// ---------------------------------------------------------------------------
// Version-2 World-level domain events
// ---------------------------------------------------------------------------
//  Every payload carries the trio (worldId, arcId, beatId) so downstream
//  consumers never have to perform additional look-ups.
//  A common `kind` discriminator enables pattern matching / exhaustive
//  switches, while `v` allows future migrations without breaking listeners.
// ---------------------------------------------------------------------------

/** Context fields available on *every* world event */
interface WorldCtx {
  /** Owning world */
  worldId: ID;
  /** Arc in which this event occurred – null when no arc yet exists */
  arcId: ID | null;
  /** Beat in which this event occurred – null when unrelated */
  beatId: ID | null;
}

/** Version tag for forward-compatibility */
interface Versioned { v: 1 }

/** All valid `kind` discriminators – double as eventBus topic names */
export type WorldEventKind =
  | 'world.created'
  | 'world.arc.created'
  | 'world.arc.completed'
  | 'world.beat.created'
  | 'world.event.logged';

/** Base mix-in extended by every concrete event */
interface WorldEventBase extends WorldCtx, Versioned {
  kind: WorldEventKind;
  /**
   * Hop counter injected by the event bus.  *Do not* populate manually – the
   * bus will add / increment the `_hop` field on every re-emit in order to
   * guard against infinite loops (see `core/infra/eventBus.ts`).
   */
  _hop?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Concrete events (leaf nodes of the discriminated union)
// ─────────────────────────────────────────────────────────────────────────────
export interface WorldCreated extends WorldEventBase {
  kind: 'world.created';
  name: string;
  description: string;
}

export interface WorldArcCreated extends WorldEventBase {
  kind: 'world.arc.created';
  arcNumber: number;
  arcName: string;
}

export interface WorldArcCompleted extends WorldEventBase {
  kind: 'world.arc.completed';
  arcName: string;
  summary: string;
}

export interface StoryBeatCreated extends WorldEventBase {
  kind: 'world.beat.created';
  beatIndex: number;
  beatName: string;
  beatType: 'anchor' | 'dynamic';
  directives: string[];
  emergent: string[];
}

export interface WorldEventLogged extends WorldEventBase {
  kind: 'world.event.logged';
  eventId: ID;
  eventType: 'player_action' | 'system_event' | 'world_event';
  impact: 'minor' | 'moderate' | 'major' | 'catastrophic';
  description: string;
}

// Union helper – import this everywhere for exhaustive switches
export type WorldDomainEvent =
  | WorldCreated
  | WorldArcCreated
  | WorldArcCompleted
  | StoryBeatCreated
  | WorldEventLogged;

// ---------------------------------------------------------------------------
//  Legacy aliases – keep the codebase compiling while we migrate gradually.
//  Remove these in the clean-up sprint once every import has switched to the
//  canonical names above.
// ---------------------------------------------------------------------------
export type WorldCreatedEvent       = WorldCreated;
export type WorldArcCreatedEvent    = WorldArcCreated;
export type WorldArcCompletedEvent  = WorldArcCompleted;
export type WorldBeatCreatedEvent   = StoryBeatCreated; // renamed for clarity
export type StoryBeatCreatedEvent   = StoryBeatCreated; // compat – some tests
export type WorldEventLoggedEvent   = WorldEventLogged;