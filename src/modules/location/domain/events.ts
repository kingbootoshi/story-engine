import type { LocationType, LocationStatus } from './schema';

/**
 * Event emitted when a location is created
 */
export interface LocationCreatedEvent {
  v: 1;
  worldId: string;
  locationId: string;
  name: string;
  type: LocationType;
  parentId?: string;
}

/**
 * Event emitted when a location's status changes
 */
export interface LocationStatusChangedEvent {
  v: 1;
  worldId: string;
  locationId: string;
  locationName: string;
  oldStatus: LocationStatus;
  newStatus: LocationStatus;
  reason: string;
  beatId?: string;
  beatIndex?: number;
}

/**
 * Event emitted when a new location is discovered during story progression
 */
export interface LocationDiscoveredEvent {
  v: 1;
  worldId: string;
  locationId: string;
  locationName: string;
  type: LocationType;
  beatId: string;
  beatIndex: number;
}

/**
 * Event emitted when all initial locations for a world have been generated
 */
export interface LocationWorldCompleteEvent {
  v: 1;
  worldId: string;
  regionCount: number;
  totalLocationCount: number;
}

/**
 * All location event types
 */
export type LocationEvent = 
  | LocationCreatedEvent 
  | LocationStatusChangedEvent 
  | LocationDiscoveredEvent
  | LocationWorldCompleteEvent;