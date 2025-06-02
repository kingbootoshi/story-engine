# API Reference

Complete API documentation for the World Story Engine.

## Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

Currently, the API is open. For production, implement JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Health Check

#### GET /api/health

Check if the API is running and services are connected.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "services": {
    "ai": true,
    "database": true
  }
}
```

---

### Worlds

#### POST /api/worlds

Create a new world.

**Request Body:**
```json
{
  "name": "Aethermoor",
  "description": "A world where magic and technology collide"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Aethermoor",
  "description": "A world where magic and technology collide",
  "created_at": "2024-01-20T10:30:00.000Z",
  "updated_at": "2024-01-20T10:30:00.000Z",
  "current_arc_id": null,
  "metadata": {}
}
```

**Status Codes:**
- `201`: World created successfully
- `400`: Invalid request body
- `500`: Server error

---

#### GET /api/worlds/:worldId

Get detailed world state including current arc and recent events.

**Parameters:**
- `worldId` (UUID): The world's unique identifier

**Response:**
```json
{
  "world": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Aethermoor",
    "description": "A world where magic and technology collide",
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z",
    "current_arc_id": "660e8400-e29b-41d4-a716-446655440001"
  },
  "currentArc": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "world_id": "550e8400-e29b-41d4-a716-446655440000",
    "arc_number": 1,
    "story_name": "The Great Awakening",
    "story_idea": "Ancient magic returns to the world",
    "status": "active",
    "created_at": "2024-01-20T10:30:00.000Z"
  },
  "currentBeats": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "arc_id": "660e8400-e29b-41d4-a716-446655440001",
      "beat_index": 0,
      "beat_type": "anchor",
      "beat_name": "The Slumbering World",
      "description": "For a thousand years, magic has been dormant...",
      "world_directives": [
        "Magic is considered myth by most",
        "Technology has filled the void"
      ],
      "emergent_storylines": [
        "Strange dreams plague sensitives",
        "Ancient ruins pulse with faint energy"
      ],
      "created_at": "2024-01-20T10:30:00.000Z"
    }
  ],
  "recentEvents": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "world_id": "550e8400-e29b-41d4-a716-446655440000",
      "event_type": "player_action",
      "description": "Players discovered the Crystal of Awakening",
      "impact_level": "major",
      "created_at": "2024-01-20T11:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `404`: World not found
- `500`: Server error

---

### Story Arcs

#### POST /api/worlds/:worldId/arcs

Create a new story arc for a world.

**Parameters:**
- `worldId` (UUID): The world's unique identifier

**Request Body:**
```json
{
  "storyIdea": "The return of ancient magic disrupts technological society"
}
```

**Response:**
```json
{
  "arc": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "world_id": "550e8400-e29b-41d4-a716-446655440000",
    "arc_number": 1,
    "story_name": "The Great Awakening",
    "story_idea": "The return of ancient magic disrupts technological society",
    "status": "active",
    "created_at": "2024-01-20T10:30:00.000Z"
  },
  "anchors": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "beat_index": 0,
      "beat_name": "The Slumbering World",
      "description": "...",
      "world_directives": ["..."],
      "emergent_storylines": ["..."]
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "beat_index": 7,
      "beat_name": "The Awakening Moment",
      "description": "...",
      "world_directives": ["..."],
      "emergent_storylines": ["..."]
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440004",
      "beat_index": 14,
      "beat_name": "The New Age",
      "description": "...",
      "world_directives": ["..."],
      "emergent_storylines": ["..."]
    }
  ]
}
```

**Status Codes:**
- `201`: Arc created successfully
- `404`: World not found
- `500`: Server error

---

#### GET /api/worlds/:worldId/arcs

List all story arcs for a world.

**Parameters:**
- `worldId` (UUID): The world's unique identifier

**Response:**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "world_id": "550e8400-e29b-41d4-a716-446655440000",
    "arc_number": 1,
    "story_name": "The Great Awakening",
    "story_idea": "Ancient magic returns to the world",
    "status": "completed",
    "created_at": "2024-01-20T10:30:00.000Z",
    "completed_at": "2024-02-20T10:30:00.000Z",
    "summary": "The world transformed as magic returned..."
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "world_id": "550e8400-e29b-41d4-a716-446655440000",
    "arc_number": 2,
    "story_name": "The War of Principles",
    "story_idea": "Technology and magic clash for dominance",
    "status": "active",
    "created_at": "2024-02-20T10:30:00.000Z"
  }
]
```

---

#### POST /api/worlds/:worldId/arcs/:arcId/progress

Generate the next beat in the story arc.

**Parameters:**
- `worldId` (UUID): The world's unique identifier
- `arcId` (UUID): The arc's unique identifier

**Request Body (Optional):**
```json
{
  "recentEvents": "Players formed an alliance with the Techno-Mages. The Crystal of Awakening was shattered, releasing wild magic across the northern provinces."
}
```

**Response (Success):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440005",
  "arc_id": "660e8400-e29b-41d4-a716-446655440001",
  "beat_index": 1,
  "beat_type": "dynamic",
  "beat_name": "The First Ripples",
  "description": "As wild magic spreads from the shattered crystal...",
  "world_directives": [
    "Northern provinces experience random magical phenomena",
    "Techno-Mages work to contain the chaos",
    "Traditional technologists denounce the alliance"
  ],
  "emergent_storylines": [
    "Magical storms disrupt communications",
    "New mage talents emerge among the populace",
    "Ancient creatures stir in forgotten places"
  ],
  "created_at": "2024-01-20T12:00:00.000Z"
}
```

**Response (Arc Complete):**
```json
{
  "message": "Arc is complete",
  "completed": true
}
```

**Status Codes:**
- `200`: Success
- `404`: World or arc not found
- `500`: Server error

---

### World Events

#### POST /api/worlds/:worldId/events

Record a significant world event.

**Parameters:**
- `worldId` (UUID): The world's unique identifier

**Request Body:**
```json
{
  "eventType": "player_action",
  "description": "The Grand Alliance conquered the Shadow Fortress",
  "impactLevel": "major",
  "arcId": "660e8400-e29b-41d4-a716-446655440001",
  "beatId": "770e8400-e29b-41d4-a716-446655440005",
  "affectedRegions": ["Northern Wastes", "Crystal Plains"]
}
```

**Event Types:**
- `player_action`: Direct player actions
- `system_event`: Game system events
- `environmental`: Natural/environmental changes
- `social`: Social/political events

**Impact Levels:**
- `minor`: Local effect
- `moderate`: Regional effect
- `major`: World-significant
- `catastrophic`: Reality-altering

**Response:**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440004",
  "world_id": "550e8400-e29b-41d4-a716-446655440000",
  "arc_id": "660e8400-e29b-41d4-a716-446655440001",
  "beat_id": "770e8400-e29b-41d4-a716-446655440005",
  "event_type": "player_action",
  "description": "The Grand Alliance conquered the Shadow Fortress",
  "impact_level": "major",
  "affected_regions": ["Northern Wastes", "Crystal Plains"],
  "created_at": "2024-01-20T13:00:00.000Z",
  "metadata": {}
}
```

**Status Codes:**
- `201`: Event recorded successfully
- `400`: Invalid event data
- `404`: World not found
- `500`: Server error

---

#### GET /api/worlds/:worldId/events

Get recent events for a world.

**Parameters:**
- `worldId` (UUID): The world's unique identifier

**Query Parameters:**
- `limit` (number): Maximum number of events to return (default: 20, max: 100)

**Example:**
```
GET /api/worlds/550e8400-e29b-41d4-a716-446655440000/events?limit=10
```

**Response:**
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440004",
    "world_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_type": "player_action",
    "description": "The Grand Alliance conquered the Shadow Fortress",
    "impact_level": "major",
    "created_at": "2024-01-20T13:00:00.000Z"
  },
  {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "world_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_type": "environmental",
    "description": "Magical storm engulfed the Eastern Territories",
    "impact_level": "moderate",
    "created_at": "2024-01-20T12:30:00.000Z"
  }
]
```

---

## Error Responses

All endpoints may return these standard error formats:

### 400 Bad Request
```json
{
  "error": "Name and description are required",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### 404 Not Found
```json
{
  "error": "World not found",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per minute
- **AI generation endpoints** (`/progress`, `/arcs`): 10 requests per minute

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705749000
```

## Webhooks (Planned)

Configure webhooks to receive real-time updates:

```json
{
  "url": "https://your-game.com/webhooks/world-story",
  "events": ["beat.created", "arc.completed", "event.recorded"],
  "secret": "your-webhook-secret"
}
```

## WebSocket Support (Planned)

Real-time updates via WebSocket:

```javascript
const ws = new WebSocket('wss://your-domain.com/api/ws');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  // Handle beat.created, event.recorded, etc.
});
```