# Story Engine SDK API Reference

The Story Engine SDK provides a clean, simple API for creating and managing dynamic story worlds. This document outlines all available endpoints organized by module.

## Authentication

All endpoints require authentication via API key passed in the x-api-key header:

```typescript
x-api-key: YOUR_API_KEY
```

## Base URL

```
https://api.storyengine.dev/trpc
```

## Core Concepts

1. **Worlds** - The top-level container for your story
2. **Characters** - Entities that can take actions and have personalities
3. **Locations** - Places where events occur
4. **Factions** - Groups with ideologies and relationships
5. **Events** - The primary way to progress your story

## API Endpoints

### World Module

#### `world.create`
Create a new world with automatic population of characters, locations, and factions.

**Input:**
```typescript
{
  name: string        // World name
  description: string // World description/theme
}
```

**Output:** `World` object with generated entities

---

#### `world.get`
Get details about a specific world.

**Input:** `worldId: string`

**Output:** `World` object or null

---

#### `world.list`
List all worlds for the authenticated user.

**Input:** None

**Output:** Array of `World` objects

---

#### `world.getWorldState`
Get comprehensive world state including current arc, beats, and recent events.

**Input:** `worldId: string`

**Output:**
```typescript
{
  world: World
  currentArc: WorldArc | null
  currentBeats: WorldBeat[]
  recentEvents: WorldEvent[]
}
```

---

#### `world.recordWorldEvent` ⭐ **PRIMARY INTERACTION**
Add an event to the world. This is the main way to progress your story.

**Input:**
```typescript
{
  world_id: string
  event_type: 'player_action' | 'system_event' | 'environmental' | 'social'
  impact_level: 'minor' | 'moderate' | 'major' | 'catastrophic'
  description: string
}
```

**Output:** `WorldEvent` object

---

#### `world.progressArc` ⭐ **STORY PROGRESSION**
Progress the current story arc to the next beat. This generates new narrative content based on recent events.

**Input:**
```typescript
{
  worldId: string
  arcId: string
  recentEvents?: string  // Optional context about recent player actions
}
```

**Output:** `WorldBeat` object or null if arc is complete

---

#### `world.getEvents`
Get world events with flexible filtering.

**Input:**
```typescript
{
  worldId: string
  filters?: {
    eventType?: 'player_action' | 'system_event' | 'environmental' | 'social'
    impactLevel?: 'minor' | 'moderate' | 'major' | 'catastrophic'
    limit?: number      // Max 100
    offset?: number     // For pagination
    startDate?: Date
    endDate?: Date
  }
}
```

**Output:** Array of `WorldEvent` objects

---

### Character Module

#### `character.create`
Create a new character in a world.

**Input:**
```typescript
{
  world_id: string
  name: string
  type: 'player' | 'npc'
  story_role: 'major' | 'minor' | 'wildcard' | 'background'
  description?: string
  background?: string
  personality_traits?: string[]
  motivations?: string[]
  location_id?: string    // Initial location
  faction_id?: string     // Initial faction
}
```

**Output:** `Character` object

---

#### `character.get`
Get full character details including current location, faction, and memories.

**Input:** `characterId: string`

**Output:** `Character` object with all relationships populated

---

#### `character.list`
List all characters in a world.

**Input:**
```typescript
{
  worldId: string
}
```

**Output:** Array of `Character` objects

---

#### `character.update`
Update character details.

**Input:**
```typescript
{
  id: string
  updates: {
    name?: string
    description?: string
    background?: string
    personality_traits?: string[]
    motivations?: string[]
    location_id?: string
    faction_id?: string
    status?: 'alive' | 'deceased'
  }
}
```

**Output:** Updated `Character` object

---

#### `character.delete`
Remove a character from the world.

**Input:** `characterId: string`

**Output:** `{ success: true }`

---

### Location Module

#### `location.create`
Create a new location in a world.

**Input:**
```typescript
{
  world_id: string
  parent_location_id?: string  // For nested locations
  name: string
  type: 'region' | 'city' | 'landmark' | 'wilderness'
  status: 'thriving' | 'stable' | 'declining' | 'ruined' | 'abandoned' | 'lost'
  description: string
  tags?: string[]
  relative_x?: number  // 0-100 for map positioning
  relative_y?: number  // 0-100 for map positioning
}
```

**Output:** `Location` object

---

#### `location.get`
Get full location details.

**Input:** `locationId: string`

**Output:** `Location` object

---

#### `location.list`
List all locations in a world.

**Input:**
```typescript
{
  worldId: string
}
```

**Output:** Array of `Location` objects

---

#### `location.search`
Search locations by name or tags.

**Input:**
```typescript
{
  worldId: string
  query: string       // Search term
  tags?: string[]     // Filter by tags
}
```

**Output:** Array of matching `Location` objects

---

#### `location.update`
Update location details.

**Input:**
```typescript
{
  id: string
  updates: {
    name?: string
    description?: string
    status?: LocationStatus
    tags?: string[]
    controlling_faction_id?: string
  }
}
```

**Output:** Updated `Location` object

---

#### `location.delete`
Remove a location from the world.

**Input:** `locationId: string`

**Output:** `{ success: true }`

---

### Faction Module

#### `faction.create`
Create a new faction in a world.

**Input:**
```typescript
{
  world_id: string
  name: string
  ideology: string
  status?: 'rising' | 'stable' | 'declining' | 'collapsed'
  members_estimate?: number
  home_location_id?: string
  banner_color?: string  // Hex color
  emblem_svg?: string    // SVG data
  tags?: string[]
}
```

**Output:** `Faction` object

---

#### `faction.get`
Get full faction details including controlled locations and member count.

**Input:** `factionId: string`

**Output:** `Faction` object

---

#### `faction.list`
List all factions in a world.

**Input:**
```typescript
{
  worldId: string
}
```

**Output:** Array of `Faction` objects

---

#### `faction.update`
Update faction details.

**Input:**
```typescript
{
  id: string
  updates: {
    name?: string
    ideology?: string
    status?: FactionStatus
    members_estimate?: number
    banner_color?: string
    emblem_svg?: string
    tags?: string[]
  }
}
```

**Output:** Updated `Faction` object

---

#### `faction.setStance`
Set diplomatic stance between two factions.

**Input:**
```typescript
{
  sourceId: string
  targetId: string
  stance: 'ally' | 'neutral' | 'hostile'
  reason: string
}
```

**Output:** `{ success: true }`

---

#### `faction.getStances`
Get all diplomatic stances for a faction.

**Input:** `factionId: string`

**Output:**
```typescript
Array<{
  targetId: string
  stance: 'ally' | 'neutral' | 'hostile'
}>
```

---

#### `faction.delete`
Remove a faction from the world.

**Input:** `factionId: string`

**Output:** `{ success: true }`

---

## Data Types

### World
```typescript
{
  id: string
  user_id: string
  name: string
  description: string
  current_arc_id: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}
```

### Character
```typescript
{
  id: string
  world_id: string
  name: string
  type: 'player' | 'npc'
  status: 'alive' | 'deceased'
  story_role: 'major' | 'minor' | 'wildcard' | 'background'
  description: string
  background: string
  personality_traits: string[]
  motivations: string[]
  location_id: string | null
  faction_id: string | null
  memories: Array<{
    event_description: string
    timestamp: string
    emotional_impact: 'positive' | 'negative' | 'neutral'
    importance: number  // 0-1
    beat_index?: number
  }>
  story_beats_witnessed: number[]
  created_at: string
  updated_at: string
}
```

### Location
```typescript
{
  id: string
  world_id: string
  parent_location_id: string | null
  name: string
  type: 'region' | 'city' | 'landmark' | 'wilderness'
  status: 'thriving' | 'stable' | 'declining' | 'ruined' | 'abandoned' | 'lost'
  description: string
  tags: string[]
  relative_x: number | null
  relative_y: number | null
  controlling_faction_id: string | null
  historical_events: Array<{
    timestamp: string
    event: string
    previous_status?: string
    beat_index?: number
  }>
  last_significant_change: string | null
  created_at: string
  updated_at: string
}
```

### Faction
```typescript
{
  id: string
  world_id: string
  name: string
  banner_color: string | null
  emblem_svg: string | null
  ideology: string
  status: 'rising' | 'stable' | 'declining' | 'collapsed'
  members_estimate: number
  home_location_id: string | null
  controlled_locations: string[]
  tags: string[]
  historical_events: Array<{
    timestamp: string
    event: string
    impact?: string
  }>
  created_at: string
  updated_at: string
}
```

### WorldEvent
```typescript
{
  id: string
  world_id: string
  arc_id: string | null
  beat_id: string | null
  event_type: 'player_action' | 'system_event' | 'environmental' | 'social'
  description: string
  impact_level: 'minor' | 'moderate' | 'major' | 'catastrophic'
  affected_regions: string[]
  created_at: string
  metadata: Record<string, any>
}
```

## Example Usage

### Using curl

```bash
# List all worlds
curl -X GET https://api.storyengine.dev/api/worlds \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json"

# Create a world
curl -X POST https://api.storyengine.dev/api/worlds \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My World", "description": "A fantasy realm"}'
```

### Using JavaScript/TypeScript

```typescript
// Example client setup
const headers = {
  'x-api-key': 'YOUR_API_KEY',
  'Content-Type': 'application/json'
};

// 1. Create a world (auto-populates with entities)
const world = await fetch('https://api.storyengine.dev/api/worlds', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: "The Shattered Realms",
    description: "A dark fantasy world where magic is dying"
  })
}).then(res => res.json());

// 2. List generated entities
const characters = await client.character.list({ worldId: world.id });
const locations = await client.location.list({ worldId: world.id });
const factions = await client.faction.list({ worldId: world.id });

// 3. Add a world event (primary interaction)
const event = await client.world.recordWorldEvent({
  world_id: world.id,
  event_type: 'player_action',
  impact_level: 'major',
  description: "The hero discovers an ancient artifact in the ruins"
});

// 4. Check world state after event
const state = await client.world.getWorldState(world.id);
console.log(state.currentArc);
console.log(state.recentEvents);

// 5. Progress the story to the next beat
const nextBeat = await client.world.progressArc({
  worldId: world.id,
  arcId: state.currentArc.id,
  recentEvents: "The hero found a powerful artifact"
});
console.log(nextBeat.description);
console.log(nextBeat.worldDirectives);
```

## Best Practices

1. **Use Events to Drive Story** - The `recordWorldEvent` endpoint is your primary tool for story progression
2. **Progress Beats Regularly** - Use `progressArc` to advance the narrative and generate new story content
3. **Let the System React** - After adding events, the system automatically updates characters, locations, and factions
4. **Query Full Details** - Use the `get` endpoints to see all relationships and current states
5. **Batch Related Operations** - When creating multiple entities, consider the dependencies (e.g., create locations before assigning characters to them)

## Rate Limits

- 100 requests per minute per API key
- Maximum 100 items per list query
- Events are processed asynchronously; allow a few seconds for full propagation

## Error Handling

All endpoints return standard HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

Error responses include a message field:
```json
{
  "error": {
    "message": "Description of what went wrong"
  }
}
```