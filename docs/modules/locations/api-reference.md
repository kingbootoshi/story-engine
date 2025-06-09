# Location Module API Reference

## tRPC Procedures

All procedures are available through the tRPC client at `trpc.location.*` or REST endpoints at `/api/locations/*`.

### Queries

#### `list`
Get all locations for a world.

**Input:**
```typescript
{
  worldId: string // UUID of the world
}
```

**Output:**
```typescript
Location[] // Array of all locations in the world
```

**Example:**
```typescript
// tRPC
const locations = await trpc.location.list.query({ 
  worldId: 'world-123' 
});

// REST
GET /api/locations/list?input={"worldId":"world-123"}
```

---

#### `get`
Get a single location by ID.

**Input:**
```typescript
string // UUID of the location
```

**Output:**
```typescript
Location // The location entity
```

**Example:**
```typescript
// tRPC
const location = await trpc.location.get.query('location-123');

// REST
GET /api/locations/get?input="location-123"
```

---

#### `getByRegion`
Get all child locations within a region.

**Input:**
```typescript
{
  regionId: string // UUID of the parent region
}
```

**Output:**
```typescript
Location[] // Array of child locations
```

**Example:**
```typescript
// tRPC
const cities = await trpc.location.getByRegion.query({ 
  regionId: 'region-123' 
});

// REST
GET /api/locations/getByRegion?input={"regionId":"region-123"}
```

---

#### `getHistory`
Get historical events for a location.

**Input:**
```typescript
{
  locationId: string, // UUID of the location
  limit?: number      // Max events to return (default: 10, max: 100)
}
```

**Output:**
```typescript
HistoricalEvent[] // Array of events, newest first
```

**Example:**
```typescript
// tRPC
const history = await trpc.location.getHistory.query({ 
  locationId: 'location-123',
  limit: 20
});

// REST
GET /api/locations/getHistory?input={"locationId":"location-123","limit":20}
```

---

#### `search`
Search locations by name or tags.

**Input:**
```typescript
{
  worldId: string,    // UUID of the world
  query: string,      // Search term
  tags?: string[]     // Optional tag filters
}
```

**Output:**
```typescript
Location[] // Matching locations
```

**Example:**
```typescript
// tRPC
const ports = await trpc.location.search.query({
  worldId: 'world-123',
  query: 'port',
  tags: ['coastal', 'trade']
});

// REST
GET /api/locations/search?input={"worldId":"world-123","query":"port","tags":["coastal","trade"]}
```

### Mutations

#### `create`
Manually create a new location.

**Input:**
```typescript
{
  world_id: string,
  parent_location_id?: string | null,
  name: string,              // 2-120 characters
  type: LocationType,        // 'region' | 'city' | 'landmark' | 'wilderness'
  status: LocationStatus,    // 'thriving' | 'stable' | etc.
  description: string,
  tags: string[]
}
```

**Output:**
```typescript
Location // The created location
```

**Example:**
```typescript
// tRPC
const newCity = await trpc.location.create.mutate({
  world_id: 'world-123',
  parent_location_id: 'region-456',
  name: 'Haven Port',
  type: 'city',
  status: 'stable',
  description: 'A bustling coastal trade city...',
  tags: ['port', 'trade', 'coastal']
});

// REST
POST /api/locations/create
Content-Type: application/json
{
  "world_id": "world-123",
  "parent_location_id": "region-456",
  "name": "Haven Port",
  "type": "city",
  "status": "stable",
  "description": "A bustling coastal trade city...",
  "tags": ["port", "trade", "coastal"]
}
```

---

#### `update`
Update a location's properties.

**Input:**
```typescript
{
  id: string,                     // Location UUID
  updates: {
    parent_location_id?: string,
    name?: string,
    type?: LocationType,
    status?: LocationStatus,
    description?: string,
    tags?: string[],
    historical_events?: HistoricalEvent[]
  }
}
```

**Output:**
```typescript
Location // The updated location
```

**Example:**
```typescript
// tRPC
const updated = await trpc.location.update.mutate({
  id: 'location-123',
  updates: {
    status: 'declining',
    description: 'Once bustling, now struggling with plague...'
  }
});

// REST
POST /api/locations/update
Content-Type: application/json
{
  "id": "location-123",
  "updates": {
    "status": "declining",
    "description": "Once bustling, now struggling with plague..."
  }
}
```

---

#### `enrichWithAI`
Use AI to enhance a location's description.

**Input:**
```typescript
{
  locationId: string,    // Location UUID
  worldContext: string   // Additional world context
}
```

**Output:**
```typescript
Location // Location with enriched description
```

**Example:**
```typescript
// tRPC
const enriched = await trpc.location.enrichWithAI.mutate({
  locationId: 'location-123',
  worldContext: 'A medieval fantasy world with declining magic'
});

// REST
POST /api/locations/enrichWithAI
Content-Type: application/json
{
  "locationId": "location-123",
  "worldContext": "A medieval fantasy world with declining magic"
}
```

## Type Definitions

### Location
```typescript
interface Location {
  id: string;
  world_id: string;
  parent_location_id: string | null;
  name: string;
  type: LocationType;
  status: LocationStatus;
  description: string;
  tags: string[];
  historical_events: HistoricalEvent[];
  last_significant_change?: string;
  created_at: string;
  updated_at: string;
}
```

### LocationType
```typescript
type LocationType = 'region' | 'city' | 'landmark' | 'wilderness';
```

### LocationStatus
```typescript
type LocationStatus = 'thriving' | 'stable' | 'declining' | 'ruined' | 'abandoned' | 'lost';
```

### HistoricalEvent
```typescript
interface HistoricalEvent {
  timestamp: string;
  event: string;
  previous_status?: LocationStatus;
  arc_id?: string;
  beat_index?: number;
}
```

## Error Handling

All endpoints may return these errors:

- `404`: Location or world not found
- `400`: Invalid input parameters
- `403`: Unauthorized (user doesn't own the world)
- `500`: Internal server error

Errors follow the format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```