# Location Module Examples

## Complete Working Examples

### 1. Creating a World and Viewing Generated Locations

```typescript
// Frontend React component
import { trpc } from '@/trpcClient';

function WorldCreator() {
  const createWorld = trpc.world.create.useMutation();
  const listLocations = trpc.location.list.useQuery(
    { worldId: selectedWorldId },
    { enabled: !!selectedWorldId }
  );

  const handleCreateWorld = async () => {
    const world = await createWorld.mutateAsync({
      name: 'The Shattered Realms',
      description: 'A world of floating islands connected by magical bridges'
    });
    
    // The world.created event automatically generates 8-15 locations
    // Wait a moment for processing, then refetch
    setTimeout(() => {
      listLocations.refetch();
    }, 3000);
  };

  return (
    <div>
      <button onClick={handleCreateWorld}>Create World</button>
      
      {listLocations.data && (
        <div>
          <h3>Generated Locations:</h3>
          {listLocations.data.map(location => (
            <div key={location.id}>
              <h4>{location.name} ({location.type})</h4>
              <p>Status: {location.status}</p>
              <p>{location.description}</p>
              <p>Tags: {location.tags.join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. Searching and Filtering Locations

```typescript
// Find all coastal cities
const coastalCities = await trpc.location.search.query({
  worldId: 'world-123',
  query: 'city',
  tags: ['coastal']
});

// Find locations with "iron" in name or description
const ironLocations = await trpc.location.search.query({
  worldId: 'world-123',
  query: 'iron'
});

// Get all locations in a specific region
const northernLocations = await trpc.location.getByRegion.query({
  regionId: 'region-northern-realm'
});
```

### 3. Manual Location Management

```typescript
// Create a new hidden location
const secretBase = await trpc.location.create.mutate({
  world_id: 'world-123',
  parent_location_id: 'region-456',
  name: 'The Shadow Sanctum',
  type: 'landmark',
  status: 'stable',
  description: 'A hidden fortress known only to the initiated',
  tags: ['hidden', 'fortress', 'magical']
});

// Update location when discovered by players
await trpc.location.update.mutate({
  id: secretBase.id,
  updates: {
    tags: ['fortress', 'magical'], // Remove 'hidden' tag
    description: secretBase.description + '\n\nRecently discovered by brave adventurers.'
  }
});
```

### 4. Tracking Location History

```typescript
// Component to display location timeline
function LocationTimeline({ locationId }) {
  const history = trpc.location.getHistory.useQuery({
    locationId,
    limit: 50
  });

  return (
    <div className="timeline">
      {history.data?.map((event, index) => (
        <div key={index} className="timeline-event">
          <time>{new Date(event.timestamp).toLocaleDateString()}</time>
          <p>{event.event}</p>
          {event.previous_status && (
            <p className="status-change">
              Status: {event.previous_status} → (changed)
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 5. AI-Enhanced Descriptions

```typescript
// Enrich a location with more detail
async function enrichLocation(locationId: string) {
  const location = await trpc.location.get.query(locationId);
  const world = await trpc.world.get.query(location.world_id);
  
  const enriched = await trpc.location.enrichWithAI.mutate({
    locationId,
    worldContext: `${world.description} The current story arc focuses on political intrigue.`
  });
  
  console.log('Original:', location.description.length, 'chars');
  console.log('Enriched:', enriched.description.length, 'chars');
}
```

### 6. Event-Driven Location Updates

```typescript
// Simulate a story beat affecting locations
async function simulatePlagueBeat(worldId: string) {
  // Create a story beat (normally done by the story module)
  const beat = {
    v: 1,
    worldId,
    beatId: 'beat-plague-1',
    beatIndex: 15,
    directives: ['A mysterious plague begins spreading from the port cities'],
    emergent: ['Trade routes are blocked', 'Fear grips the population']
  };
  
  // Emit the beat event
  eventBus.emit('world.beat.created', beat);
  
  // The LocationService will:
  // 1. Analyze the beat for location impacts
  // 2. Change port city statuses to 'declining'
  // 3. Possibly discover quarantine camps
  // 4. Add historical events to affected locations
}
```

### 7. World Map Visualization

```typescript
// React component using the relative positions
function WorldMap({ worldId }) {
  const locations = trpc.location.list.useQuery({ worldId });
  
  return (
    <svg viewBox="0 0 100 100" className="world-map">
      {locations.data?.map(location => (
        <g key={location.id}>
          <circle
            cx={location.relative_position?.x || 50}
            cy={location.relative_position?.y || 50}
            r={location.type === 'region' ? 8 : 4}
            className={`location-${location.type} status-${location.status}`}
          />
          <text
            x={location.relative_position?.x || 50}
            y={(location.relative_position?.y || 50) - 10}
            textAnchor="middle"
            className="location-label"
          >
            {location.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
```

### 8. Batch Location Updates

```typescript
// Update multiple locations after a major event
async function applyWarDevastation(worldId: string, regionId: string) {
  const locations = await trpc.location.getByRegion.query({ regionId });
  
  // Update each location based on type
  for (const location of locations) {
    const updates: any = {
      historical_events: [
        ...location.historical_events,
        {
          timestamp: new Date().toISOString(),
          event: 'Devastated by the War of Shadows',
          previous_status: location.status
        }
      ]
    };
    
    // Cities become ruined
    if (location.type === 'city') {
      updates.status = 'ruined';
      updates.description = location.description + '\n\nThe war has left this once-proud city in ruins.';
    }
    
    // Landmarks might survive
    if (location.type === 'landmark' && !location.tags.includes('fortified')) {
      updates.status = 'abandoned';
    }
    
    await trpc.location.update.mutate({
      id: location.id,
      updates
    });
  }
}
```

### 9. Location-Based Queries

```typescript
// Find all locations with recent activity
async function getActiveLocations(worldId: string) {
  const allLocations = await trpc.location.list.query({ worldId });
  
  const recentlyActive = allLocations.filter(location => {
    if (!location.last_significant_change) return false;
    
    const daysSinceChange = 
      (Date.now() - new Date(location.last_significant_change).getTime()) 
      / (1000 * 60 * 60 * 24);
    
    return daysSinceChange < 7; // Active in last week
  });
  
  return recentlyActive;
}

// Find all child locations with specific status
async function findAbandonedCities(worldId: string) {
  const locations = await trpc.location.list.query({ worldId });
  
  return locations.filter(loc => 
    loc.type === 'city' && 
    loc.status === 'abandoned'
  );
}
```

### 10. Testing Location Events

```typescript
// Jest test example
describe('Location Events', () => {
  it('should create locations when world is created', async () => {
    const worldId = 'test-world-123';
    
    // Emit world created event
    eventBus.emit('world.created', {
      worldId,
      name: 'Test Realm',
      description: 'A world for testing'
    });
    
    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check locations were created
    const locations = await trpc.location.list.query({ worldId });
    expect(locations.length).toBeGreaterThanOrEqual(8);
    expect(locations.length).toBeLessThanOrEqual(15);
    
    // Verify location types
    const regions = locations.filter(l => l.type === 'region');
    expect(regions.length).toBeGreaterThanOrEqual(2);
  });
});
```

## Common Patterns

### Pattern: Status Cascade
When a region's status changes, affect all child locations:

```typescript
async function cascadeRegionStatus(regionId: string, newStatus: LocationStatus) {
  const children = await trpc.location.getByRegion.query({ regionId });
  
  for (const child of children) {
    // Only cascade if child is in better status
    if (getStatusLevel(child.status) > getStatusLevel(newStatus)) {
      await trpc.location.update.mutate({
        id: child.id,
        updates: { 
          status: getDowngradedStatus(child.status),
          historical_events: [...child.historical_events, {
            timestamp: new Date().toISOString(),
            event: `Affected by regional ${newStatus} status`,
            previous_status: child.status
          }]
        }
      });
    }
  }
}
```

### Pattern: Location Discovery
Reveal locations based on player progress:

```typescript
async function discoverLocation(
  worldId: string, 
  parentRegionId: string,
  discovery: LocationDiscovery
) {
  // Create the location as initially hidden
  const location = await trpc.location.create.mutate({
    world_id: worldId,
    parent_location_id: parentRegionId,
    name: discovery.name,
    type: discovery.type,
    status: 'stable',
    description: discovery.description,
    tags: [...discovery.tags, 'newly-discovered']
  });
  
  // Log the discovery event
  eventBus.emit('world.event.logged', {
    v: 1,
    worldId,
    eventId: `discovery-${location.id}`,
    impact: 'moderate',
    description: `New location discovered: ${discovery.name}`
  });
  
  return location;
}
```