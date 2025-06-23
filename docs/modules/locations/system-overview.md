# Location Module System Overview

The Location module provides persistent spatial entities within game worlds, enabling dynamic world geography that evolves with the narrative.

## Core Concepts

### Location Types
- **Region**: Top-level geographical areas (no parent)
- **City**: Population centers within regions
- **Landmark**: Significant sites (ruins, monuments, natural wonders)
- **Wilderness**: Natural areas (forests, deserts, mountains)

### Location Status
Locations have a lifecycle that reflects their narrative state:
```
thriving → stable → declining → ruined → abandoned → lost
```

- **Thriving**: Prosperous and growing
- **Stable**: Normal functioning state
- **Declining**: Facing challenges or decay
- **Ruined**: Severely damaged but recognizable
- **Abandoned**: Empty but intact
- **Lost**: Forgotten by the world

## Event-Driven Architecture

The module follows the Golden Rule: **Action → Event → Beat → Reactions**

### Event Subscriptions
1. **world.created** → Generate initial world map using progressive AI agents
2. **world.beat.created** → Analyze beat for location mutations

### Event Emissions
- **location.created**: New location added to world
- **location.status_changed**: Location status transition
- **location.discovered**: New location revealed during story
- **location.world.complete**: All initial locations have been generated

## AI Integration

### World Map Generation
When a world is created, locations are generated progressively using individual AI agents:

#### Phase 1: Region Generation
- Single AI call generates 2-4 major regions
- Each region gets global coordinates (0-100 on world map)
- Regions saved to database immediately

#### Phase 2: Location Generation (per region)
For each region, three specialized AI agents generate:
1. **Cities Agent**: 1-5 cities with local coordinates
2. **Landmarks Agent**: 1-3 landmarks (ruins, monuments, natural wonders)
3. **Wilderness Agent**: 1-2 wilderness areas (forests, deserts, mountains)

Each location includes:
- Evocative name fitting the world and region theme
- Rich description (100-200 words)
- Tags for features (e.g., "coastal", "fortified", "magical")
- Relative position on 0-100 x/y grid within the region

#### Phase 3: Completion
- After all locations are saved, emits `location.world.complete` event
- This signals other modules (e.g., factions) to begin their generation

### Beat Reaction
For each story beat, the AI analyzes:
- Beat directives and emergent storylines
- Current location states
- Narrative implications

The AI may suggest:
- Status changes with narrative reasons
- Description additions reflecting events
- Discovery of new locations (max 2 per beat)

## Database Schema

```sql
locations
├── id (UUID)
├── world_id (UUID, FK → worlds)
├── parent_location_id (UUID, FK → locations, nullable)
├── name (VARCHAR 120, unique per world)
├── type (ENUM: region|city|landmark|wilderness)
├── status (ENUM: thriving|stable|declining|ruined|abandoned|lost)
├── description (TEXT)
├── tags (TEXT[])
├── historical_events (JSONB[])
├── last_significant_change (TIMESTAMPTZ)
└── timestamps (created_at, updated_at)
```

### Historical Events Structure
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "event": "Economic crisis devastates trade",
  "previous_status": "thriving",
  "arc_id": "uuid",
  "beat_index": 5
}
```

## Usage Example

```typescript
// Automatic world map generation
eventBus.emit('world.created', {
  worldId: 'world-123',
  name: 'Eldoria',
  description: 'A realm of ancient magic...'
});
// → Creates 8-15 initial locations

// Beat reaction
eventBus.emit('world.beat.created', {
  worldId: 'world-123',
  beatId: 'beat-456',
  directives: ['The plague spreads to the capital'],
  emergent: ['Trade routes blocked']
});
// → May change capital status to 'declining'
// → May discover quarantine camps
```

## Design Principles

1. **Persistence**: All location changes create historical records
2. **Narrative Integration**: Changes must have story reasons
3. **Player Agency**: Manual location management available via API
4. **AI Augmentation**: Optional enrichment for descriptions
5. **Hierarchical Structure**: Logical parent-child relationships

## Performance Considerations

- Bulk creation for initial world generation
- Indexed searches on world_id, parent_id, status, tags
- Full-text search on names and descriptions
- JSON operations for historical events
- Transaction safety for multi-location updates