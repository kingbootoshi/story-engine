# Character Module - API Reference

## Overview
The Character module provides endpoints for managing individual characters within story worlds. Characters react to world events, form memories, and drive personal narratives.

## Schema

### Character
```typescript
{
  id: string;                        // UUID
  world_id: string;                  // UUID - Parent world
  name: string;                      // Character name (max 120 chars)
  type: 'player' | 'npc';           // Character type
  status: 'alive' | 'deceased';      // Current status
  story_role: 'major' | 'minor' | 'wildcard' | 'background';
  location_id: string | null;        // Current location UUID
  faction_id: string | null;         // Faction affiliation UUID
  description: string;               // Physical description
  background: string;                // Character history
  personality_traits: string[];      // Character traits
  motivations: string[];             // Current goals
  memories: CharacterMemory[];       // Event memories
  story_beats_witnessed: number[];   // Beat indices witnessed
  created_at: string;                // ISO timestamp
  updated_at: string;                // ISO timestamp
}
```

### CharacterMemory
```typescript
{
  event_description: string;         // What happened
  timestamp: string;                 // ISO timestamp
  emotional_impact: 'positive' | 'negative' | 'neutral';
  importance: number;                // 0.0 - 1.0
  beat_index?: number;               // Associated beat
}
```

## Endpoints

### List Characters by World
```http
GET /api/characters?worldId={worldId}
```

**Response**: `Character[]`

Lists all characters in a specific world, ordered by creation date.

---

### Get Character
```http
GET /api/characters/{characterId}
```

**Response**: `Character | null`

Retrieves a specific character by ID.

---

### Create Character
```http
POST /api/characters
Content-Type: application/json
```

**Request Body**:
```json
{
  "world_id": "uuid",
  "name": "Elena the Healer",
  "type": "npc",
  "story_role": "minor",
  "location_id": "uuid",
  "faction_id": "uuid",
  "description": "A young woman with gentle eyes",
  "background": "Orphaned by plague as a child",
  "personality_traits": ["compassionate", "brave"],
  "motivations": ["heal the sick", "protect innocents"]
}
```

**Response**: `Character`

Creates a new character. Optional fields:
- `status` (defaults to 'alive')
- `memories` (defaults to [])
- `story_beats_witnessed` (defaults to [])

---

### Update Character
```http
PATCH /api/characters/{characterId}
Content-Type: application/json
```

**Request Body**: Partial character object with fields to update

**Response**: `Character`

Updates character properties. Cannot change `id`, `world_id`, or `created_at`.

---

### Delete Character
```http
DELETE /api/characters/{characterId}
```

**Response**: `204 No Content`

Permanently deletes a character.

---

### List Characters by Faction
```http
GET /api/characters/faction/{factionId}
```

**Response**: `Character[]`

Lists all characters belonging to a specific faction, ordered by story role.

---

### List Characters by Location
```http
GET /api/characters/location/{locationId}
```

**Response**: `Character[]`

Lists all characters at a specific location, ordered by name.

## Event System

### Incoming Events

#### faction.seeding.complete
Triggers initial character generation for a new world.

**Payload**:
```typescript
{
  v: 1;
  worldId: string;
  factionCount: number;
}
```

**Behavior**:
- Generates 3-8 characters per faction
- Generates 3-8 independent characters
- Distributes characters across available locations

#### world.beat.created
Triggers character reactions to story beats.

**Payload**:
```typescript
{
  v: 1;
  worldId: string;
  beatId: string;
  beatIndex: number;
  directives: string[];
  emergent: string[];
}
```

**Behavior**:
- Each character evaluates if affected
- Affected characters form memories
- May trigger motivation/location/faction changes
- May spawn new characters based on narrative

### Outgoing Events

#### character.created
Emitted when a new character is created.

```typescript
{
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  factionId: string | null;
  locationId: string | null;
  storyRole: string;
}
```

#### character.died
Emitted when a character dies.

```typescript
{
  v: 1;
  worldId: string;
  characterId: string;
  name: string;
  cause: string;
  beatId: string;
  beatIndex: number;
}
```

#### character.memory_added
Emitted when a character forms a significant memory.

```typescript
{
  v: 1;
  worldId: string;
  characterId: string;
  memoryDescription: string;
  importance: number;
  beatIndex: number;
}
```

## AI Integration

### Character Generation (`generate_character_batch@v1`)
- **Model**: OpenAI GPT-4o-mini
- **Context**: World theme, faction details, available locations
- **Output**: Batch of 3-8 diverse characters

### Beat Evaluation (`evaluate_character_reaction@v1`)
- **Model**: OpenAI GPT-4o-mini
- **Context**: Beat details, character state, faction relations
- **Output**: Reaction decision and character changes

### Spawn Analysis (`analyze_spawn_need@v1`)
- **Model**: OpenAI GPT-4o-mini
- **Context**: Beat narrative, existing world state
- **Output**: Decision to spawn new characters

## Usage Examples

### Creating a Character
```javascript
const character = await fetch('/api/characters', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    world_id: worldId,
    name: 'Marcus the Scholar',
    type: 'npc',
    story_role: 'minor',
    location_id: libraryId,
    faction_id: null,
    description: 'An elderly man with keen eyes behind wire spectacles',
    background: 'Former court advisor turned independent researcher',
    personality_traits: ['curious', 'cautious', 'wise'],
    motivations: ['uncover ancient knowledge', 'avoid political entanglements']
  })
});
```

### Querying Characters by Location
```javascript
const charactersAtMarket = await fetch(
  `/api/characters/location/${marketSquareId}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

### Updating Character After Event
```javascript
await fetch(`/api/characters/${characterId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    location_id: newLocationId,
    motivations: [...oldMotivations, 'seek revenge for market fire']
  })
});
```

## Best Practices

1. **Memory Management**: Keep memories focused and personal to the character
2. **Batch Operations**: Process character reactions in groups to avoid API limits
3. **Story Roles**: Use appropriate roles to control narrative participation
4. **Faction Context**: Leverage faction relationships for social dynamics
5. **Event Significance**: Only emit world events for major character actions

## Performance Considerations

- Characters are processed in batches of 10 during beat reactions
- Memory arrays are capped at 100 entries (sorted by importance)
- Background characters are evaluated as groups for efficiency
- Use faction/location queries to reduce data transfer