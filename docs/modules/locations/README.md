# Location Module Documentation

The Location module provides dynamic, narrative-driven geographical entities for game worlds in the Story Engine.

## Quick Start

```typescript
// Locations are automatically created when a world is created
const world = await trpc.world.create.mutate({
  name: 'Mystic Realms',
  description: 'A world of magic and wonder'
});
// → 8-15 locations generated automatically

// List all locations in a world
const locations = await trpc.location.list.query({ 
  worldId: world.id 
});

// Search for specific locations
const ports = await trpc.location.search.query({
  worldId: world.id,
  query: 'port',
  tags: ['coastal']
});
```

## Documentation Structure

### 📋 [System Overview](./system-overview.md)
Core concepts, architecture, and design principles of the Location module.

### 🔧 [API Reference](./api-reference.md)
Complete reference for all tRPC procedures, REST endpoints, and type definitions.

### 🎭 [Narrative Design Guide](./narrative-design.md)
How to use locations for dynamic storytelling, status progressions, and world evolution.

### 💡 [Examples](./examples.md)
Code examples, patterns, and real-world usage scenarios.

## Key Features

- **Automatic World Generation**: 8-15 locations created when a world is initialized
- **Individual AI Agents**: Separate AI agents for regions, cities, landmarks, and wilderness
- **Progressive Generation**: Regions generated first, then child locations per region
- **Event-Driven Updates**: Locations react to story beats and world events
- **Status Lifecycle**: Locations progress through narrative states (thriving → lost)
- **Historical Tracking**: Every change is recorded with timestamp and reason
- **Hierarchical Structure**: Regions contain cities, landmarks, and wilderness
- **Completion Signal**: Emits `location.world.complete` event when all initial locations are generated

## Quick Examples

### Check Location Status
```typescript
const location = await trpc.location.get.query('location-id');
console.log(`${location.name} is ${location.status}`);
// "Ironhold is declining"
```

### View Location History
```typescript
const history = await trpc.location.getHistory.query({
  locationId: 'location-id',
  limit: 5
});
// Recent events affecting this location
```

### Create Custom Location
```typescript
const hideout = await trpc.location.create.mutate({
  world_id: worldId,
  parent_location_id: regionId,
  name: 'Smuggler\'s Cove',
  type: 'landmark',
  status: 'stable',
  description: 'A hidden cove used by smugglers',
  tags: ['hidden', 'coastal', 'criminal']
});
```

## Module Integration

The Location module integrates with:

- **World Module**: Listens to world.created and world.beat.created events
- **Story Module**: Reacts to narrative beats by updating location states
- **Character Module**: Characters reference their home locations
- **Faction Module**: Listens to location.world.complete before generating factions

## Development

### Running Tests
```bash
npm test tests/location/
```

### Type Checking
```bash
npm run typecheck
```

### Database Migration
```bash
# Run the location table migration
psql $DATABASE_URL -f supabase/migrations/*_create_locations.sql
```

## Architecture Decisions

1. **Event-Driven**: All location changes are triggered by domain events
2. **Historical Records**: Full audit trail for time-travel and rollback
3. **AI-Assisted**: Optional AI enrichment while maintaining human control
4. **Bulk Operations**: Efficient handling of initial world generation
5. **Flexible Hierarchy**: Parent-child relationships with NULL for regions

## Performance Notes

- Indexed on world_id, parent_location_id, status, and tags
- Full-text search on name and description fields
- JSONB for flexible historical_events storage
- Bulk creation for initial world generation
- Transaction safety for multi-location updates

## Future Enhancements

- **Dynamic Positioning**: Locations that move (wandering cities, drifting islands)
- **Procedural Generation**: More sophisticated world generation algorithms
- **Climate System**: Weather and seasonal effects on locations
- **Population Tracking**: Demographic data and migration patterns
- **Economic Simulation**: Resource production and trade routes