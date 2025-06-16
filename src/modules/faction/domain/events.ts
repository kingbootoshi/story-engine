import type { FactionStatus, DiplomaticStance } from './schema';

export interface FactionCreated {
  v: 1;
  worldId: string;
  factionId: string;
  name: string;
}

export interface FactionStatusChanged {
  v: 1;
  worldId: string;
  factionId: string;
  prev: FactionStatus;
  next: FactionStatus;
  reason: string;
  beatId: string;
  beatIndex: number;
}

export interface FactionRelationChanged {
  v: 1;
  worldId: string;
  sourceId: string;
  targetId: string;
  previous: DiplomaticStance;
  next: DiplomaticStance;
  reason: string;
}

export interface FactionTookLocation {
  v: 1;
  worldId: string;
  factionId: string;
  locationId: string;
  method: 'conquest' | 'diplomacy' | 'inheritance';
  beatId: string;
  beatIndex: number;
}

export interface FactionLostLocation {
  v: 1;
  worldId: string;
  factionId: string;
  locationId: string;
  reason: string;
  beatId: string;
  beatIndex: number;
}