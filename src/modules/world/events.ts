import type { DomainEvent } from '../../core/types';

export interface WorldCreatedEvent extends DomainEvent<{
  worldId: string;
  name: string;
  description: string;
}> {
  topic: 'world.created';
}

export interface WorldArcCreatedEvent extends DomainEvent<{
  worldId: string;
  arcId: string;
  arcName: string;
}> {
  topic: 'world.arcCreated';
}

export interface WorldBeatCreatedEvent extends DomainEvent<{
  worldId: string;
  arcId: string;
  beatId: string;
  beatIndex: number;
  beatName: string;
}> {
  topic: 'world.beatCreated';
}

export interface WorldArcCompletedEvent extends DomainEvent<{
  worldId: string;
  arcId: string;
  arcName: string;
  summary: string;
}> {
  topic: 'world.arcCompleted';
}

export interface WorldEventLoggedEvent extends DomainEvent<{
  worldId: string;
  eventId: string;
  eventType: string;
  impactLevel: string;
}> {
  topic: 'world.eventLogged';
}

export type WorldModuleEvents = 
  | WorldCreatedEvent
  | WorldArcCreatedEvent
  | WorldBeatCreatedEvent
  | WorldArcCompletedEvent
  | WorldEventLoggedEvent;