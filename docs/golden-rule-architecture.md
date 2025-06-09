# The Golden Rule: Event-Driven Narrative Architecture

## Overview

The Story Engine implements a fundamental design pattern called the "Golden Rule" that governs how all narrative progression occurs. This architecture ensures that every action in the world contributes to an emergent, self-evolving story.

## The Golden Rule

```
Every Action → Event → Beat → Reactions → More Events
```

This single invariant creates a perpetual narrative loop where player actions, system events, and world changes all feed into a unified story progression system.

## Core Components

### 1. Event Emission (`world.event.logged`)

Every significant action in the world is logged as an event with:
- **Impact Level**: minor, moderate, major, or catastrophic
- **Description**: What happened
- **Context**: World ID, event ID, timestamp

```typescript
// Example: Player destroys a bridge
worldService.logEvent({
  world_id: "abc-123",
  event_type: "player_action",
  impact_level: "major",
  description: "Player destroyed the Stone Bridge connecting the Northern Territories"
});
```

### 2. Event Buffering (StoryAIService)

The StoryAIService acts as the narrative brain:
- Listens to all `world.event.logged` events
- Buffers events until a threshold is reached
- Triggers beat generation based on:
  - **Impact Threshold**: 3+ major/catastrophic events
  - **Time Threshold**: 24 hours since last beat

### 3. Beat Generation (`world.beat.created`)

When triggered, the AI analyzes buffered events and generates a story beat containing:
- **Beat Name**: A thematic title
- **Description**: Narrative context
- **World Directives**: Specific changes the world should make
- **Emergent Storylines**: New conflicts or plot threads

```typescript
// Example beat emitted after bridge destruction
{
  beatName: "Isolation of the North",
  directives: [
    "Northern settlements begin rationing supplies",
    "Southern merchants raise prices on essential goods",
    "Bandit activity increases near the broken bridge"
  ],
  emergent: [
    "A mysterious faction offers to rebuild the bridge for a price",
    "Northern separatist movement gains momentum"
  ]
}
```

### 4. Module Reactions

Any module can subscribe to `world.beat.created` events and react:

```typescript
// Location module example
eventBus.on('world.beat.created', (event) => {
  if (event.directives.includes("Bandit activity increases")) {
    spawnBanditCamp(nearBridge);
    emit('world.event.logged', {
      impact: 'moderate',
      description: 'Bandit camp established at Old Bridge Crossing'
    });
  }
});
```

## Event Flow Example

Here's a complete flow showing how the Golden Rule creates emergent narratives:

```
1. Initial Action
   Player assassinates the Duke of Westford
   → world.event.logged (impact: catastrophic)

2. Immediate Reactions
   Guards discover the body
   → world.event.logged (impact: major)
   
   Duchess flees the castle
   → world.event.logged (impact: major)

3. Beat Generation Triggered
   [3 major events accumulated]
   
   StoryAIService generates: "The Succession Crisis"
   - Directives: ["Nobles choose sides", "Trade routes disrupted", "Military mobilizes"]
   - Emergent: ["The Duke's bastard son emerges", "Ancient succession law discovered"]

4. Module Reactions to Beat
   Faction Module:
   - Creates two rival noble factions
   - → world.event.logged: "House Blackwater supports the Duchess"
   - → world.event.logged: "House Ironhold backs the bastard"
   
   Location Module:
   - Converts castle to "Contested Territory"
   - → world.event.logged: "Westford Castle sealed its gates"
   
   Character Module:
   - Spawns the bastard son NPC
   - → world.event.logged: "Mysterious young man claims ducal birthright"

5. Cycle Continues
   [New events accumulate, leading to the next beat...]
```

## Implementation Details

### Event Bus Safety

The event bus includes safety mechanisms:
- **Hop Limit**: Events can only cascade 8 times (prevents infinite loops)
- **Size Limit**: 50KB max payload (prevents memory issues)
- **Debug Logging**: Every emission is tracked

### Flush Strategies

The StoryAIService uses two flush strategies:
1. **Threshold Flush**: Immediate beat generation when significant events accumulate
2. **Timer Flush**: Hourly check for any major events requiring progression

### Event Versioning

All events include a version field (`v: 1`) for future compatibility:
```typescript
interface WorldEventLogged {
  v: 1;  // Version for future schema evolution
  worldId: string;
  eventId: string;
  impact: 'minor' | 'moderate' | 'major' | 'catastrophic';
  description: string;
  _hop?: number;  // Added by event bus
}
```

## Best Practices

### For Module Developers

1. **Emit Meaningful Events**: Include rich descriptions that help the AI understand context
2. **Choose Impact Levels Carefully**:
   - `minor`: Daily activities, routine changes
   - `moderate`: Notable but localized effects
   - `major`: Region-affecting changes
   - `catastrophic`: World-shaking events

3. **React Selectively**: Not every beat requires every module to respond
4. **Avoid Direct Module Communication**: Always go through events

### For World Designers

1. **Seed with Events**: Kickstart narratives by logging initial world events
2. **Balance Impact Levels**: Too many major events create chaos; too few create stagnation
3. **Monitor Event Chains**: Use debug logs to understand narrative flow

## Architecture Benefits

### Emergent Complexity
Simple rules (the Golden Rule) create complex narratives through interaction.

### Perfect Decoupling
Modules never directly communicate, only through the event system.

### Historical Record
Every event is logged, creating a complete narrative history.

### Extensibility
New modules simply subscribe to beats and emit events - no core changes needed.

### Narrative Coherence
The AI ensures each beat makes sense given the accumulated events.

## Future Enhancements

The Golden Rule architecture supports planned features:

1. **Event Weights**: Some events could count more toward thresholds
2. **Localized Beats**: Regional beats for large worlds
3. **Player-Specific Beats**: Personalized narrative threads
4. **Event Decay**: Old events matter less over time
5. **Narrative Themes**: Beats that follow genre conventions

## Conclusion

The Golden Rule creates a living world where every action matters. By funneling all changes through a single pattern - events accumulating into beats that trigger more events - we achieve both narrative coherence and emergent complexity. This is the heart of the Story Engine: not scripted stories, but dynamic narratives that evolve from player actions and system interactions.