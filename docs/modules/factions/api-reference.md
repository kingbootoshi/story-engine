# Faction Module API Reference

## tRPC Procedures

All procedures are available through the tRPC client at `trpc.faction.*` or REST endpoints at `/api/factions/*`.

### Queries

#### `list`
Get all factions for a world.
- **Input**: `{ worldId: string }`
- **Output**: `Faction[]`

---

#### `get`
Get a single faction by its ID.
- **Input**: `string` (Faction UUID)
- **Output**: `Faction | null`

---

#### `getStances`
Get all diplomatic relations for a single faction.
- **Input**: `string` (Faction UUID)
- **Output**: `{ targetId: string; stance: DiplomaticStance; }[]`

---

#### `getHistory`
Get the most recent historical events for a faction.
- **Input**: `{ id: string, limit?: number }`
- **Output**: `HistoricalEvent[]`

### Mutations

#### `create`
Create a new faction. The AI will be used to enrich the details.
- **Input**: `CreateFaction` (see type definitions)
- **Output**: `Faction`

---

#### `update`
Update a faction's properties.
- **Input**: `{ id: string, updates: UpdateFaction }`
- **Output**: `Faction`

---

#### `setStance`
Set or update the diplomatic stance between two factions.
- **Input**: `{ sourceId: string, targetId: string, stance: DiplomaticStance, reason: string }`
- **Output**: `{ success: true }`

---

#### `claimLocation`
Assign control of a location to a faction.
- **Input**: `{ factionId: string, locationId: string, method: 'conquest' | 'treaty' }`
- **Output**: `{ success: true }`

---

#### `releaseLocation`
Remove a faction's control over a location.
- **Input**: `{ factionId: string, locationId: string, reason: string }`
- **Output**: `{ success: true }`

---

#### `setStatus`
Manually set a faction's lifecycle status. This will trigger an AI-driven doctrine update.
- **Input**: `{ id: string, status: FactionStatus, reason: string }`
- **Output**: `{ success: true }`

---

#### `generateDoctrine`
Force the AI to regenerate the ideology and tags for a faction.
- **Input**: `string` (Faction UUID)
- **Output**: `Faction`

## Type Definitions

### Faction
```typescript
interface Faction {
  id: string;
  world_id: string;
  name: string;
  banner_color: string | null;
  emblem_svg: string | null;
  ideology: string;
  status: FactionStatus;
  members_estimate: number;
  home_location_id: string | null;
  controlled_locations: string[];
  tags: string[];
  historical_events: HistoricalEvent[];
  created_at: string;
  updated_at: string;
}
```

### FactionStatus
```typescript
type FactionStatus = 'rising' | 'stable' | 'declining' | 'collapsed';
```

### DiplomaticStance
```typescript
type DiplomaticStance = 'ally' | 'neutral' | 'hostile';
```

### HistoricalEvent
```typescript
interface HistoricalEvent {
  timestamp: string;
  event: string;
  previous_status?: FactionStatus;
  beat_index?: number;
}
```