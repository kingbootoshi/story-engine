import type { CharacterStatus, RelationshipType, ImpactLevel } from './schema';

export interface CharacterCreated {
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  type: 'player' | 'npc';
  factionId?: string;
  locationId?: string;
}

export interface CharacterDied {
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  cause: string;
  impactLevel: ImpactLevel;
  beatId: string;
  beatIndex: number;
}

export interface CharacterStatusChanged {
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  previousStatus: CharacterStatus;
  newStatus: CharacterStatus;
  reason: string;
}

export interface CharacterFactionChanged {
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  previousFactionId?: string;
  newFactionId?: string;
  reason: string;
}

export interface CharacterRelationshipFormed {
  v: 1;
  worldId: string;
  characterId: string;
  targetCharacterId: string;
  characterName: string;
  targetName: string;
  relationshipType: RelationshipType;
  sentiment: number;
  reason: string;
}

export interface CharacterRelationshipBroken {
  v: 1;
  worldId: string;
  characterId: string;
  targetCharacterId: string;
  characterName: string;
  targetName: string;
  relationshipType: RelationshipType;
  reason: string;
}

export interface CharacterAchievedGoal {
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  goal: string;
  impact: ImpactLevel;
}

export interface CharacterRelocated {
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  fromLocationId?: string;
  toLocationId: string;
  reason: string;
}