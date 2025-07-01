# Story Engine SDK API Reference

The Story Engine SDK provides a clean, simple API for creating and managing dynamic story worlds. This document outlines all available endpoints organized by module.

## Authentication

All API requests require authentication. You must provide your API key in the `x-api-key` HTTP header. This key is generated and managed through your Story Engine dashboard.

```http
x-api-key: YOUR_API_KEY
```

**Security Notice:** Never expose your API keys in client-side code (e.g., in a web browser). Always use them server-side and store them securely as environment variables.

## Base API Path

All REST API endpoints are prefixed with:

```
https://playstoryengine.com/api
```

## Core Concepts

1.  **Worlds** - The top-level container for your story.
2.  **Characters** - Entities that can take actions and have personalities.
3.  **Locations** - Places where events occur.
4.  **Factions** - Groups with ideologies and relationships.
5.  **Events** - The primary way to progress your story.

## API Endpoints

### World Module (`/api/worlds`)

#### Create a new world (`POST /api/worlds`)
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

#### List all worlds (`GET /api/worlds`)
List all worlds for the authenticated user.

**Input:** None

**Output:** Array of `World` objects

---

#### Get comprehensive world state (`GET /api/worlds/:worldId`)
Get comprehensive world state including current arc, beats, and recent events. This is the primary endpoint for retrieving world details.

**Path Parameters:**
*   `worldId`: `string` (UUID) - The ID of the world to retrieve.

**Output:**
```typescript
{
  world: World
  currentArc: WorldArc | null
  currentBeats: WorldBeat[]
  recentEvents: WorldEvent[]
}
```
**Note:** The `world.get` endpoint for retrieving just the `World` object is not exposed via REST to avoid conflicts with `getWorldState`. Use this endpoint for comprehensive data.

---

#### Record a world event (`POST /api/worlds/:worldId/events`) ⭐ **PRIMARY INTERACTION**
Add an event to the world. This is the main way to progress your story. The event will be associated with the world's currently active story beat.

**Path Parameters:**
*   `worldId`: `string` (UUID) - The ID of the world the event occurred in.

**Request Body:**
```typescript
{
  event_type: 'player_action' | 'system_event' | 'environmental' | 'social'
  impact_level: 'minor' | 'moderate' | 'major' | 'catastrophic'
  description: string // Detailed description of what happened
}
```

**Output:** `WorldEvent` object

---

#### Create a new story arc (`POST /api/worlds/:worldId/arcs`)
Initiate a new story arc for the specified world. This generates the anchor points for the arc.

**Path Parameters:**
*   `worldId`: `string` (UUID) - The ID of the world to create the arc for.

**Request Body:**
```typescript
{
  worldName: string       // The current name of the world
  worldDescription: string // The current description/theme of the world
  storyIdea?: string      // Optional seed idea provided by the user for the arc
}
```

**Output:**
```typescript
{
  arc: WorldArc,
  anchors: WorldBeat[]
}
```

---

#### Progress the current arc to the next beat (`POST /api/worlds/arcs/:arcId/progress`) ⭐ **STORY PROGRESSION**
Progress the current story arc to the next beat. This generates new narrative content based on recent events and the arc's progression.

**Path Parameters:**
*   `arcId`: `string` (UUID) - The ID of the arc to progress.

**Request Body:**
```typescript
{
  worldId: string   // The ID of the world associated with the arc
  recentEvents?: string // Optional, pre-formatted context about recent player actions or world changes. If omitted, the system will fetch recent events.
}
```

**Output:** `WorldBeat` object or `null` if the arc is now complete.

---

#### Complete an active arc (`POST /api/worlds/:worldId/arcs/:arcId/complete`)
Marks a story arc as completed and generates a summary.

**Path Parameters:**
*   `worldId`: `string` (UUID) - The ID of the world.
*   `arcId`: `string` (UUID) - The ID of the arc to complete.

**Input:** None (all context is derived from path parameters)

**Output:** `{ message: 'Arc completed successfully' }`

---

### Character Module (`/api/characters`)

#### Create a new character (`POST /api/characters`)
Create a new character in a world.

**Input:**
```typescript
{
  world_id: string // UUID
  name: string
  type: 'player' | 'npc'
  story_role: 'major' | 'minor' | 'wildcard' | 'background'
  description?: string
  background?: string
  personality_traits?: string[]
  motivations?: string[]
  location_id?: string // UUID of initial location, nullable
  faction_id?: string  // UUID of initial faction, nullable
}
```

**Output:** `Character` object

---

#### Get character details (`GET /api/characters/:characterId`)
Get full character details including current location, faction, and memories.

**Path Parameters:**
*   `characterId`: `string` (UUID) - The ID of the character to retrieve.

**Output:** `Character` object with all relationships populated

---

#### List all characters in a world (`GET /api/characters`)
List all characters in a world.

**Query Parameters:**
*   `worldId`: `string` (UUID) - **Required.** The ID of the world to list characters for.

**Output:** Array of `Character` objects

---

#### Update character details (`PUT /api/characters/:characterId`)
Update character details.

**Path Parameters:**
*   `characterId`: `string` (UUID) - The ID of the character to update.

**Request Body:**
```typescript
{
  name?: string
  description?: string
  background?: string
  personality_traits?: string[]
  motivations?: string[]
  location_id?: string // UUID, nullable
  faction_id?: string  // UUID, nullable
  status?: 'alive' | 'deceased'
}
```

**Output:** Updated `Character` object

---

#### Remove a character (`DELETE /api/characters/:characterId`)
Remove a character from the world.

**Path Parameters:**
*   `characterId`: `string` (UUID) - The ID of the character to delete.

**Output:** `{ success: true }`

---

### Location Module (`/api/locations`)

#### Create a new location (`POST /api/locations`)
Create a new location in a world.

**Input:**
```typescript
{
  world_id: string // UUID
  parent_location_id?: string  // UUID for nested locations, nullable
  name: string
  type: 'region' | 'city' | 'landmark' | 'wilderness'
  status: 'thriving' | 'stable' | 'declining' | 'ruined' | 'abandoned' | 'lost'
  description: string
  tags?: string[]
  relative_x?: number  // 0-100 for map positioning, nullable
  relative_y?: number  // 0-100 for map positioning, nullable
}
```

**Output:** `Location` object

---

#### Get location details (`GET /api/locations/:locationId`)
Get full location details.

**Path Parameters:**
*   `locationId`: `string` (UUID) - The ID of the location to retrieve.

**Output:** `Location` object

---

#### List all locations in a world (`GET /api/locations`)
List all locations in a world.

**Query Parameters:**
*   `worldId`: `string` (UUID) - **Required.** The ID of the world to list locations for.

**Output:** Array of `Location` objects

---

#### Search locations (`GET /api/locations/search`)
Search locations by name or tags.

**Query Parameters:**
*   `worldId`: `string` (UUID) - **Required.** The ID of the world to search within.
*   `query`: `string` - **Required.** Text to search in name and description.
*   `tags[]`: `string[]` - Optional. Filter by tags (pass as multiple `tags=tag1&tags=tag2`).

**Output:** Array of matching `Location` objects

---

#### Update location details (`PUT /api/locations/:locationId`)
Update location details.

**Path Parameters:**
*   `locationId`: `string` (UUID) - The ID of the location to update.

**Request Body:**
```typescript
{
  name?: string
  description?: string
  status?: LocationStatus
  tags?: string[]
  controlling_faction_id?: string // UUID, nullable
}
```

**Output:** Updated `Location` object

---

#### Remove a location (`DELETE /api/locations/:locationId`)
Remove a location from the world.

**Path Parameters:**
*   `locationId`: `string` (UUID) - The ID of the location to delete.

**Output:** `{ success: true }`

---

### Faction Module (`/api/factions`)

#### Create a new faction (`POST /api/factions`)
Create a new faction in a world.

**Input:**
```typescript
{
  world_id: string // UUID
  name: string
  ideology: string
  status?: 'rising' | 'stable' | 'declining' | 'collapsed' // Defaults to 'stable'
  members_estimate?: number // Defaults to 0
  home_location_id?: string // UUID, nullable
  banner_color?: string  // Hex color, nullable
  emblem_svg?: string    // SVG data, nullable
  tags?: string[] // Defaults to empty array
}
```

**Output:** `Faction` object

---

#### Get faction details (`GET /api/factions/:factionId`)
Get full faction details including controlled locations and member count.

**Path Parameters:**
*   `factionId`: `string` (UUID) - The ID of the faction to retrieve.

**Output:** `Faction` object

---

#### List all factions in a world (`GET /api/factions`)
List all factions in a world.

**Query Parameters:**
*   `worldId`: `string` (UUID) - **Required.** The ID of the world to list factions for.

**Output:** Array of `Faction` objects

---

#### Update faction details (`PUT /api/factions/:factionId`)
Update faction details.

**Path Parameters:**
*   `factionId`: `string` (UUID) - The ID of the faction to update.

**Request Body:**
```typescript
{
  name?: string
  ideology?: string
  status?: FactionStatus
  members_estimate?: number
  banner_color?: string
  emblem_svg?: string
  tags?: string[]
}
```

**Output:** Updated `Faction` object

---

#### Remove a faction (`DELETE /api/factions/:factionId`)
Remove a faction from the world.

**Path Parameters:**
*   `factionId`: `string` (UUID) - The ID of the faction to delete.

**Output:** `{ success: true }`

---

## Data Types

### World
```typescript
{
  id: string // UUID
  user_id: string // UUID
  name: string
  description: string
  current_arc_id: string | null // UUID of the active arc, nullable
  created_at: string // ISO 8601 Date String
  updated_at: string | null // ISO 8601 Date String, nullable
}
```

### WorldArc
```typescript
{
  id: string // UUID
  world_id: string // UUID
  arc_number: number // Integer, positive
  story_name: string
  story_idea: string
  status: 'active' | 'completed'
  summary: string | null // Nullable
  detailed_description: string // Defaults to empty string
  current_beat_id: string | null // UUID of the current beat, nullable
  created_at: string // ISO 8601 Date String
  completed_at: string | null // ISO 8601 Date String, nullable
}
```

### WorldBeat
```typescript
{
  id: string // UUID
  arc_id: string // UUID
  beat_index: number // Integer, 0-14
  beat_type: 'anchor' | 'dynamic'
  beat_name: string
  description: string
  world_directives: string[]
  emergent_storylines: string[]
  created_at: string // ISO 8601 Date String
}
```

### WorldEvent
```typescript
{
  id: string // UUID
  world_id: string // UUID
  arc_id: string // UUID of the arc this event is associated with (resolved by backend)
  beat_id: string // UUID of the beat this event is associated with (resolved by backend)
  event_type: 'player_action' | 'system_event' | 'environmental' | 'social'
  description: string
  impact_level: 'minor' | 'moderate' | 'major' | 'catastrophic'
  created_at: string // ISO 8601 Date String
}
```

### Character
```typescript
{
  id: string // UUID
  world_id: string // UUID
  name: string
  type: 'player' | 'npc'
  status: 'alive' | 'deceased'
  story_role: 'major' | 'minor' | 'wildcard' | 'background'
  description: string
  background: string
  personality_traits: string[]
  motivations: string[]
  location_id: string | null // UUID, nullable
  faction_id: string | null // UUID, nullable
  memories: Array<{
    event_description: string
    timestamp: string // ISO 8601 Date String
    emotional_impact: 'positive' | 'negative' | 'neutral'
    importance: number  // Float between 0.0 - 1.0
    beat_index?: number // Optional
  }>
  story_beats_witnessed: number[] // Array of beat indices
  created_at: string // ISO 8601 Date String
  updated_at: string // ISO 8601 Date String
}
```

### Location
```typescript
{
  id: string // UUID
  world_id: string // UUID
  parent_location_id: string | null // UUID, nullable
  name: string
  type: 'region' | 'city' | 'landmark' | 'wilderness'
  status: 'thriving' | 'stable' | 'declining' | 'ruined' | 'abandoned' | 'lost'
  description: string
  tags: string[]
  relative_x: number | null // Float between 0-100, nullable
  relative_y: number | null // Float between 0-100, nullable
  controlling_faction_id: string | null // UUID, nullable
  historical_events: Array<{
    timestamp: string // ISO 8601 Date String
    event: string
    previous_status?: string // Optional
    beat_index?: number // Optional
  }>
  last_significant_change: string | null // ISO 8601 Date String, nullable
  created_at: string // ISO 8601 Date String
  updated_at: string // ISO 8601 Date String
}
```

### Faction
```typescript
{
  id: string // UUID
  world_id: string // UUID
  name: string
  banner_color: string | null // Hex color, nullable
  emblem_svg: string | null // SVG data, nullable
  ideology: string
  status: 'rising' | 'stable' | 'declining' | 'collapsed'
  members_estimate: number // Integer
  home_location_id: string | null // UUID, nullable
  controlled_locations: string[] // Array of UUIDs
  tags: string[]
  historical_events: Array<{
    timestamp: string // ISO 8601 Date String
    event: string
  }>
  created_at: string // ISO 8601 Date String
  updated_at: string // ISO 8601 Date String
}
```

## Example Usage

All examples use the `x-api-key` header for authentication and demonstrate direct HTTP calls.

### Using curl

```bash
# List all worlds
curl -X GET "https://playstoryengine.com/api/worlds" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json"

# Create a world
curl -X POST "https://playstoryengine.com/api/worlds" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My World", "description": "A fantasy realm"}'

# Record a world event (replace with actual world ID)
curl -X POST "https://playstoryengine.com/api/worlds/YOUR_WORLD_ID/events" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "player_action",
    "impact_level": "major",
    "description": "The hero discovers an ancient artifact in the ruins"
  }'

# Progress the current arc (replace with actual arc ID and optional world ID)
curl -X POST "https://playstoryengine.com/api/worlds/arcs/YOUR_ARC_ID/progress" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "worldId": "YOUR_WORLD_ID",
    "recentEvents": "The hero found a powerful artifact, causing a magical surge."
  }'
```

## Best Practices

1.  **Use Events to Drive Story** - The `POST /api/worlds/:worldId/events` endpoint is your primary tool for story progression. Every significant player action should be recorded as an event.
2.  **Progress Beats Regularly** - Use `POST /api/worlds/arcs/:arcId/progress` to advance the narrative and generate new story content.
3.  **Let the System React** - After adding events, the system automatically updates characters, locations, and factions based on the story beat's directives and emergent storylines.
4.  **Query Full Details** - Use the `GET /api/worlds/:worldId` endpoint to see all relationships and current states.
5.  **Consider Dependencies** - When creating multiple entities manually, create parent entities (e.g., worlds, regions) before their children (e.g., characters, cities within regions).

## Rate Limits

*   100 requests per minute per API key.
*   Maximum 100 items per list query.
*   Events and AI-driven processes (like beat generation) are processed asynchronously; allow a few seconds for full propagation and world state updates.

## Error Handling

All endpoints return standard HTTP status codes. Error responses typically include a message and a machine-readable code.

*   `200 OK` - Success: The request was processed successfully.
*   `201 Created` - Resource Created: A new resource (e.g., World, Character) was successfully created.
*   `400 Bad Request` - Invalid Input: The request body or parameters were malformed or failed validation (e.g., missing required fields, invalid UUID format).
*   `401 Unauthorized` - Authentication Failed: Your API key is missing or invalid.
*   `404 Not Found` - Resource Not Found: The requested resource (e.g., worldId, characterId) does not exist.
*   `429 Too Many Requests` - Rate Limited: You have exceeded the request rate limits.
*   `500 Internal Server Error` - Backend Error: An unexpected error occurred on the server. Please contact support if this persists.

Error responses generally follow this format:
```json
{
  "error": "Description of what went wrong",
  "code": "ERROR_CODE", // e.g., BAD_REQUEST, UNAUTHORIZED, NOT_FOUND
  "issues": [ /* optional: detailed validation errors from Zod */ ]
}