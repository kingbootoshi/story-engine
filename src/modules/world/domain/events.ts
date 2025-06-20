export interface WorldCreatedEvent {
  worldId: string;
  name: string;
  description: string;
}

export interface WorldArcCreatedEvent {
  worldId: string;
  arcId: string;
  arcName: string;
}

export interface WorldBeatCreatedEvent {
  worldId: string;
  arcId: string;
  beatId: string;
  beatIndex: number;
  beatName: string;
}

export interface WorldArcCompletedEvent {
  worldId: string;
  arcId: string;
  arcName: string;
  summary: string;
}

export interface WorldEventLoggedEvent {
  worldId: string;
  eventId: string;
  eventType: 'player_action' | 'system_event' | 'world_event';
  impactLevel: 'minor' | 'moderate' | 'major';
}

export interface WorldEventLogged {
  v: 1;
  worldId: string;
  eventId: string;
  impact: 'minor' | 'moderate' | 'major' | 'catastrophic';
  description: string;
  _hop?: number;
}

export interface StoryBeatCreated {
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