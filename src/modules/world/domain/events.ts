export interface WorldCreatedEvent {
  worldId: string;
  userId: string;
  name: string;
  description: string;
}

export interface WorldArcCreatedEvent {
  worldId: string;
  userId: string;
  arcId: string;
  arcName: string;
}

export interface WorldBeatCreatedEvent {
  worldId: string;
  userId: string;
  arcId: string;
  beatId: string;
  beatIndex: number;
  beatName: string;
}

export interface WorldArcCompletedEvent {
  worldId: string;
  userId: string;
  arcId: string;
  arcName: string;
  summary: string;
}

export interface WorldEventLoggedEvent {
  worldId: string;
  userId: string;
  eventId: string;
  eventType: 'player_action' | 'system_event' | 'world_event';
  impactLevel: 'minor' | 'moderate' | 'major';
}

export interface WorldEventLogged {
  v: 1;
  worldId: string;
  userId: string;
  eventId: string;
  impact: 'minor' | 'moderate' | 'major' | 'catastrophic';
  description: string;
  _hop?: number;
}

export interface StoryBeatCreated {
  v: 1;
  worldId: string;
  userId: string;
  arcId: string;
  beatId: string;
  beatIndex: number;
  beatName: string;
  directives: string[];
  emergent: string[];
  _hop?: number;
}