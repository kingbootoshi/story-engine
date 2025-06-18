# Character Module API Reference

## tRPC Procedures

All procedures are available through the tRPC client at `trpc.character.*` or REST endpoints at `/api/characters/*`.

### Queries

#### `list`
Get all characters for a world.
- **Input**: `{ worldId: string }`
- **Output**: `Character[]`

---

#### `get`
Get a single character by its ID.
- **Input**: `string` (Character UUID)
- **Output**: `Character | null`

---

#### `getByFaction`
Get all characters belonging to a specific faction.
- **Input**: `{ factionId: string }`
- **Output**: `Character[]`

---

#### `getByLocation`
Get all characters at a specific location.
- **Input**: `{ locationId: string, currentOnly?: boolean }`
- **Output**: `Character[]`
- **Note**: `currentOnly` defaults to `true` (current location vs home location)

---

#### `getRelationships`
Get all relationships for a character.
- **Input**: `{ characterId: string }`
- **Output**: `CharacterRelation[]`

---

#### `getMajorCharacters`
Get all major characters (protagonists/antagonists) in a world.
- **Input**: `{ worldId: string }`
- **Output**: `Character[]`

---

#### `getDeceasedLegacies`
Get all deceased characters who left significant legacies.
- **Input**: `{ worldId: string }`
- **Output**: `Character[]`

### Mutations

#### `createPlayer`
Create a player character (requires authentication).
- **Input**: `CreateCharacter` (see type definitions)
- **Output**: `Character`

---

#### `spawnNPCs`
Generate multiple NPC characters for a context.
- **Input**: `SpawnContext`
- **Output**: `Character[]`

---

#### `updateCharacter`
Update a character's properties.
- **Input**: `{ id: string, updates: UpdateCharacter }`
- **Output**: `Character`

---

#### `relocate`
Move a character to a new location.
- **Input**: `{ characterId: string, locationId: string, reason: string }`
- **Output**: `{ success: true }`

---

#### `changeFaction`
Change a character's faction allegiance.
- **Input**: `{ characterId: string, factionId: string | null, reason: string }`
- **Output**: `{ success: true }`

---

#### `updateStatus`
Update a character's life status.
- **Input**: `{ characterId: string, status: CharacterStatus, reason: string }`
- **Output**: `{ success: true }`

---

#### `die`
Kill a character with specific cause and story impact.
- **Input**: `{ characterId: string, cause: string, impact: ImpactLevel }`
- **Output**: `{ success: true }`

---

#### `resurrect`
Resurrect a deceased character.
- **Input**: `{ characterId: string, method: string }`
- **Output**: `{ success: true }`

---

#### `formRelationship`
Establish a relationship between two characters.
- **Input**: `{ char1Id: string, char2Id: string, type: RelationshipType, reason: string }`
- **Output**: `{ success: true }`

---

#### `updateGoals`
Update a character's current goals.
- **Input**: `{ characterId: string, goals: string[] }`
- **Output**: `Character`

---

#### `updatePersonality`
Update personality traits and beliefs.
- **Input**: `{ characterId: string, updates: PersonalityUpdate }`
- **Output**: `{ success: true }`

---

#### `addReputation`
Add a reputation tag to a character.
- **Input**: `{ characterId: string, tag: string, reason: string }`
- **Output**: `{ success: true }`

---

#### `achieveGoal`
Mark a character goal as achieved.
- **Input**: `{ characterId: string, goal: string }`
- **Output**: `{ success: true }`

---

#### `enrichCharacter`
Use AI to enhance character details and background.
- **Input**: `{ characterId: string, context: EnrichmentContext }`
- **Output**: `Character`

---

#### `generateNPCsForBeat`
Generate NPCs relevant to a specific story beat.
- **Input**: `{ worldId: string, beatContext: string, count?: number }`
- **Output**: `Character[]`

## Type Definitions

### Character
```typescript
interface Character {
  id: string;
  world_id: string;
  user_id: string | null;
  
  // Core attributes
  name: string;
  type: CharacterType;
  status: CharacterStatus;
  story_role: StoryRole;
  
  // Personality & beliefs
  personality_traits: string[];
  core_beliefs: string[];
  goals: string[];
  fears: string[];
  
  // Affiliations
  faction_id: string | null;
  home_location_id: string | null;
  current_location_id: string | null;
  
  // Story tracking
  story_beats_witnessed: number[];
  reputation_tags: string[];
  historical_events: HistoricalEvent[];
  
  // Dates
  date_of_birth: string | null;
  date_of_death: string | null;
  
  // Descriptions
  appearance_description: string | null;
  backstory: string | null;
  voice_description: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_active_at: string;
}
```

### CharacterType
```typescript
type CharacterType = 'player' | 'npc';
```

### CharacterStatus
```typescript
type CharacterStatus = 'alive' | 'deceased' | 'missing' | 'ascended';
```

### StoryRole
```typescript
type StoryRole = 'major' | 'minor' | 'wildcard' | 'background';
```

### RelationshipType
```typescript
type RelationshipType = 'family' | 'romantic' | 'friendship' | 'rivalry' | 'professional' | 'nemesis';
```

### CharacterRelation
```typescript
interface CharacterRelation {
  id: string;
  world_id: string;
  character_id: string;
  target_character_id: string;
  relationship_type: RelationshipType;
  sentiment: number; // -100 to 100
  description: string | null;
  established_at: string;
  last_interaction: string;
}
```

### HistoricalEvent
```typescript
interface HistoricalEvent {
  timestamp: string;
  event: string;
  impact: ImpactLevel;
  beat_index?: number;
}
```

### ImpactLevel
```typescript
type ImpactLevel = 'minor' | 'moderate' | 'major' | 'transformative';
```

### SpawnContext
```typescript
interface SpawnContext {
  world_id: string;
  count: number;
  context: string;
  location_id?: string;
  faction_id?: string;
}
```

### EnrichmentContext
```typescript
interface EnrichmentContext {
  world_theme: string;
  recent_events: string[];
}
```

### PersonalityUpdate
```typescript
interface PersonalityUpdate {
  personality_traits?: string[];
  core_beliefs?: string[];
  goals?: string[];
  fears?: string[];
}
``` 