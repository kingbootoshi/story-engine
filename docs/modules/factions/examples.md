# Faction Module Examples

## Complete Working Examples

### 1. Seeding and Listing Factions

Factions are created automatically when a world is made. You can immediately query them.

```typescript
// Create a world, which automatically triggers faction seeding
const world = await trpc.world.create.mutate({
  name: 'Aethelgard',
  description: 'A grim world of warring baronies and fading magic.'
});

// Wait a moment for background processing, then list the new factions
setTimeout(async () => {
  const factions = await trpc.faction.list.query({ worldId: world.id });
  console.log('Initial Factions:', factions);
  // → [{ name: 'The Iron Host', ... }, { name: 'Circle of the Last Light', ... }]
}, 3000);
```

### 2. Managing Diplomatic Relations

Change stances in response to player actions or story events.

```typescript
// Two factions, ironHost and lastLight
const ironHost = factions.find(f => f.name === 'The Iron Host');
const lastLight = factions.find(f => f.name === 'Circle of the Last Light');

// A player brokers a truce between them
await trpc.faction.setStance.mutate({
  sourceId: ironHost.id,
  targetId: lastLight.id,
  stance: 'neutral',
  reason: 'A truce was brokered by the Heroes of Oakhaven.'
});

// Later, a story beat reveals one faction was treacherous
await trpc.faction.setStance.mutate({
  sourceId: lastLight.id,
  targetId: ironHost.id,
  stance: 'hostile',
  reason: 'The Iron Host violated the truce by seizing the Sunstone Mine.'
});
```

### 3. Territorial Control

A faction's power is tied to the locations it controls.

```typescript
// Find a target location
const locations = await trpc.location.list.query({ worldId: world.id });
const sunstoneMine = locations.find(l => l.name === 'Sunstone Mine');

// The Iron Host conquers the mine
await trpc.faction.claimLocation.mutate({
  factionId: ironHost.id,
  locationId: sunstoneMine.id,
  method: 'conquest'
});

// Verify the change
const updatedMine = await trpc.location.get.query(sunstoneMine.id);
console.log(updatedMine.controlling_faction_id === ironHost.id); // → true
```

### 4. Responding to Location Status Changes

If a location a faction controls is ruined, the faction is weakened.

```typescript
// A story beat causes the Sunstone Mine to collapse and become 'ruined'
// The LocationService emits 'location.status_changed'
// The FactionService listens and automatically reacts:

// 1. FactionService.checkTerritory is called by the event handler.
// 2. It sees the location is ruined and calls releaseLocation.
// 3. It checks if this was the faction's last territory.
// 4. If so, it calls setStatus to change the faction to 'declining'.

// You can view the result in the faction's history.
const history = await trpc.faction.getHistory.query({ id: ironHost.id });
console.log(history[0].event);
// → "Status changed from stable to declining: Lost last controlled location"
```

### 5. AI-Driven Doctrine Updates

When a faction's status changes, its entire ideology can evolve.

```typescript
// The Iron Host is now 'declining'
const decliningHost = await trpc.faction.get.query(ironHost.id);

// Original Ideology: "Strength through industry and unwavering control. We will forge this land into a new empire."
// New Ideology (after AI update): "Our strength was squandered. We must reclaim our lost glory through discipline and secrecy, punishing the weak who failed us."

console.log(decliningHost.ideology);
```

### 6. Simulating a Beat and Watching Factions React

```typescript
// Simulate a story beat about a monstrous invasion
const beat = {
  v: 1,
  worldId: world.id,
  beatId: 'beat-invasion-1',
  beatIndex: 5,
  directives: ['Monstrous hordes pour from the northern wastes, threatening all baronies.'],
  emergent: []
};
eventBus.emit('world.beat.created', beat);

// The FactionService's AI will analyze this. It will likely see that the two
// hostile factions (Iron Host and Last Light) now have a common enemy.
// It may suggest a change in relations.

setTimeout(async () => {
    const relations = await trpc.faction.getStances.query(ironHost.id);
    const relationToLight = relations.find(r => r.targetId === lastLight.id);
    console.log(relationToLight.stance); // → 'ally' (potentially)
}, 3000);
```