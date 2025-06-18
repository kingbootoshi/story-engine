# Character Module

The Character module manages dynamic, AI-enhanced characters within story worlds. It provides comprehensive character lifecycle management, personality evolution, dialogue generation, and relationship tracking.

## Overview

Characters are the heart of any narrative. This module enables:

- **Character Creation** - Generate rich characters with AI-enhanced personalities
- **Location & Faction Management** - Track character affiliations and movements
- **Relationship System** - Model complex inter-character dynamics
- **Memory System** - Characters remember and react to events
- **Dialogue Generation** - Context-aware, personality-driven dialogue
- **Personality Evolution** - Characters grow based on experiences

## Core Concepts

### Character Roles

Characters are classified into four narrative roles:

- `protagonist` - Main characters driving the story
- `antagonist` - Opposition characters creating conflict
- `supporting` - Secondary characters enriching the world
- `background` - Minor characters for atmosphere

### Personality System

Each character has:

- **Personality Traits** - Weighted attributes (0.1-1.0 strength)
- **Motivations** - Driving goals that influence behavior
- **Emotional States** - Current feelings affecting dialogue

### Memory System

Characters maintain memories of significant events:

- Event description and emotional impact
- Importance rating (0-1 scale)
- Connection to story beats
- Limited to 100 most recent memories

### Relationship Network

Characters track relationships with:

- Relationship types: ally, enemy, friend, rival, family, romantic, neutral
- Strength values: -1 (hostile) to 1 (devoted)
- Historical context for each relationship

## API Reference

### tRPC Procedures

#### Character Management

```typescript
// List characters in a world
const characters = await trpc.character.list.query({ worldId });

// Get specific character
const character = await trpc.character.get.query({ id: characterId });

// Create character (with optional AI enrichment)
const newCharacter = await trpc.character.create.mutate({
  world_id: worldId,
  name: 'Elena Starweaver',
  role: 'protagonist',
  description: 'A skilled mage',
  background: 'Trained at the Academy',
  enrichAI: true // Generate personality with AI
});

// Update character
const updated = await trpc.character.update.mutate({
  id: characterId,
  updates: {
    location_id: newLocationId,
    faction_id: newFactionId
  }
});
```

#### Movement & Affiliation

```typescript
// Move character to new location
const moved = await trpc.character.move.mutate({
  characterId,
  toLocationId,
  reason: 'Fleeing from danger'
});

// Change faction allegiance
const changed = await trpc.character.changeFaction.mutate({
  characterId,
  toFactionId: newFactionId, // or null to leave faction
  reason: 'Betrayed by leadership'
});
```

#### Memory Management

```typescript
// Add memory
await trpc.character.addMemory.mutate({
  characterId,
  memory: {
    event_description: 'Witnessed the destruction of the temple',
    emotional_impact: 'negative',
    importance: 0.9,
    beat_index: 5
  }
});

// Retrieve memories
const memories = await trpc.character.getMemories.query({
  characterId,
  limit: 20 // Optional, get last 20 memories
});
```

#### Relationships

```typescript
// Set relationship
await trpc.character.setRelationship.mutate({
  characterId: char1Id,
  targetId: char2Id,
  type: 'ally',
  strength: 0.8,
  history: 'Fought together in the war'
});

// Get all relationships
const relationships = await trpc.character.getRelationships.query({
  characterId
});
```

#### AI Features

```typescript
// Generate contextual dialogue
const dialogue = await trpc.character.generateDialogue.mutate({
  character_id: characterId,
  context: 'Meeting a stranger on the road',
  speaking_to: otherCharacterId, // Optional
  emotional_state: 'suspicious', // Optional
  recent_events: ['Town was attacked', 'Lost a friend'] // Optional
});
// Returns: { utterance, internal_thoughts, emotional_state, gesture }

// Evolve personality based on experiences
const evolved = await trpc.character.evolvePersonality.mutate({
  characterId
});
```

#### Character Removal

```typescript
// Remove character from world
await trpc.character.remove.mutate({
  characterId,
  cause: 'Died in battle'
});
```

### REST Endpoints

The module automatically exposes REST endpoints via the tRPC bridge:

- `GET /api/characters?worldId={worldId}` - List characters
- `GET /api/characters/{id}` - Get character
- `POST /api/characters` - Create character
- `PUT /api/characters/{id}` - Update character
- `DELETE /api/characters/{id}` - Remove character
- `POST /api/characters/move` - Move character
- `POST /api/characters/dialogue` - Generate dialogue

## Event Integration

### Events Emitted

The Character module emits these events:

- `character.created` - New character added to world
- `character.moved` - Character changed locations
- `character.faction_changed` - Character joined/left faction
- `character.relationship_changed` - Relationship modified
- `character.dialogue_generated` - Significant dialogue created
- `character.evolved` - Personality traits changed
- `character.died` - Character removed from world

### Events Consumed

The module listens for:

- `world.beat.created` - React to story progression
- `location.destroyed` - Evacuate characters from destroyed locations
- `faction.collapsed` - Handle faction dissolution

### World Event Integration

Major character events generate `world.event.logged` entries:

- Protagonist/antagonist creation (moderate impact)
- Major character death (major impact)
- Significant memories (impact based on importance)

## AI Prompt System

### Character Generation

The AI generates:
- Physical description and appearance
- Detailed background and history
- 3-5 personality traits with strengths
- 2-4 core motivations
- Relevant tags for categorization

### Dialogue Generation

Context-aware dialogue considers:
- Character personality and current emotional state
- Relationship with conversation partner
- Recent events and memories
- World and situational context

### Personality Evolution

Characters evolve based on:
- Recent memories and their emotional impact
- World events affecting their environment
- Repeated patterns reinforcing behaviors
- Transformative experiences causing shifts

### Reaction Prediction

The AI predicts character reactions by analyzing:
- Personality trait strengths
- Current motivations
- Past experiences
- Severity of events

## Usage Examples

### Creating a Story Cast

```typescript
// Create protagonist
const hero = await trpc.character.create.mutate({
  world_id: worldId,
  name: 'Aldric Stormborn',
  role: 'protagonist',
  location_id: startingTownId,
  enrichAI: true
});

// Create antagonist
const villain = await trpc.character.create.mutate({
  world_id: worldId,
  name: 'Lord Shadowmere',
  role: 'antagonist',
  faction_id: darkFactionId,
  enrichAI: true
});

// Establish rivalry
await trpc.character.setRelationship.mutate({
  characterId: hero.id,
  targetId: villain.id,
  type: 'enemy',
  strength: -0.9,
  history: 'Shadowmere destroyed Aldric\'s village'
});
```

### Character Development Arc

```typescript
// Character experiences trauma
await trpc.character.addMemory.mutate({
  characterId: hero.id,
  memory: {
    event_description: 'Failed to save companion from death',
    emotional_impact: 'negative',
    importance: 0.95
  }
});

// Generate reaction dialogue
const reaction = await trpc.character.generateDialogue.mutate({
  character_id: hero.id,
  context: 'Standing over companion\'s grave',
  emotional_state: 'grief-stricken'
});

// Evolve personality based on experiences
const evolved = await trpc.character.evolvePersonality.mutate({
  characterId: hero.id
});
// Might develop new traits like 'guilt-ridden' or strengthen 'protective'
```

### Dynamic Character Movement

```typescript
// Characters flee from danger
const threatenedChars = await trpc.character.listByLocation.query({
  locationId: attackedCityId
});

for (const character of threatenedChars) {
  if (character.role === 'background') {
    await trpc.character.move.mutate({
      characterId: character.id,
      toLocationId: refugeeCampId,
      reason: 'Evacuating from siege'
    });
  }
}
```

## Best Practices

### Character Creation

1. **Use AI enrichment** for major characters to ensure depth
2. **Set clear motivations** that drive character actions
3. **Establish relationships** early to create dynamics
4. **Place characters thoughtfully** in locations and factions

### Memory Management

1. **Record significant events** as memories
2. **Set appropriate importance** levels (0.3 for minor, 0.7+ for major)
3. **Include emotional impact** for personality evolution
4. **Connect to story beats** when relevant

### Relationship Building

1. **Create diverse relationship types** beyond just ally/enemy
2. **Use relationship strength** to show nuance (-0.3 vs -0.9 enemies)
3. **Document history** to explain relationships
4. **Update relationships** as story progresses

### Dialogue Generation

1. **Provide rich context** for better dialogue
2. **Include emotional state** for appropriate tone
3. **Reference recent events** for continuity
4. **Specify conversation partner** for relationship-aware dialogue

## Technical Notes

### Database Schema

Characters are stored with:
- Full JSONB support for complex personality data
- Array fields for motivations and tags
- Indexed foreign keys for efficient queries
- Row-level security for multi-tenant isolation

### Performance Considerations

- Character lists are ordered by creation time
- Location/faction queries use indexed lookups
- Memory storage limited to 100 most recent
- Personality evolution processes last 10 memories

### Integration Points

- Depends on World module for world validation
- Integrates with Location module for placement
- Connects to Faction module for allegiances
- Uses standard AI adapter pattern for generation

## Future Enhancements

Planned improvements include:

- **Skill System** - Character abilities and progression
- **Inventory Management** - Items and possessions
- **Health/Status Tracking** - Physical and mental states
- **Character Templates** - Archetypal starting points
- **Relationship Webs** - Visualize character networks
- **Dialogue Trees** - Branching conversation systems