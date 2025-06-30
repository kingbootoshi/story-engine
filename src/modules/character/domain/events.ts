import type { CharacterStatus, StoryRole } from './schema';

export interface CharacterCreated {
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  factionId: string | null;
  locationId: string | null;
  storyRole: StoryRole;
}

export interface CharacterDied {
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  cause: string;
  beatId: string;
  beatIndex: number;
}

export interface CharacterReacted {
  v: 1;
  worldId: string;
  characterId: string;
  beatId: string;
  beatIndex: number;
  memoriesAdded: number;
  motivationsChanged: boolean;
  locationChanged: boolean;
  factionChanged: boolean;
}

export interface CharacterStatusChanged {
  v: 1;
  worldId: string;
  characterId: string;
  from: CharacterStatus;
  to: CharacterStatus;
  reason: string;
}

export interface CharacterMemoryAdded {
  v: 1;
  worldId: string;
  characterId: string;
  memoryDescription: string;
  importance: number;
  beatIndex: number;
}

export interface CharacterMotivationChanged {
  v: 1;
  worldId: string;
  characterId: string;
  added: string[];
  removed: string[];
  beatIndex: number;
}

export interface CharacterLocationChanged {
  v: 1;
  worldId: string;
  characterId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  reason: string;
  beatIndex: number;
}

export interface CharacterFactionChanged {
  v: 1;
  worldId: string;
  characterId: string;
  fromFactionId: string | null;
  toFactionId: string | null;
  reason: string;
  beatIndex: number;
}

export interface CharacterBatchGenerated {
  v: 1;
  worldId: string;
  count: number;
  factionId: string | null;
  trigger: 'faction_seeding' | 'beat_spawn';
}

export interface CharactersSelectedForBeat {
  v: 1;
  worldId: string;
  beatId: string;
  beatIndex: number;
  selectedCharacters: Array<{
    characterId: string;
    characterName: string;
    reason: string;
  }>;
  totalCharacters: number;
}

export type CharacterEvent =
  | CharacterCreated
  | CharacterDied
  | CharacterReacted
  | CharacterStatusChanged
  | CharacterMemoryAdded
  | CharacterMotivationChanged
  | CharacterLocationChanged
  | CharacterFactionChanged
  | CharacterBatchGenerated
  | CharactersSelectedForBeat;