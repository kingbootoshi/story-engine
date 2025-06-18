# Character Module API Examples

## Quick Start

### Basic Character Creation

```typescript
// Simple character
const character = await trpc.character.create.mutate({
  world_id: 'world-123',
  name: 'John Smith',
  role: 'supporting',
  description: 'A humble blacksmith',
  background: 'Learned the trade from his father',
  location_id: 'village-456'
});

// AI-enhanced character
const richCharacter = await trpc.character.create.mutate({
  world_id: 'world-123',
  name: 'Elena the Wise',
  role: 'protagonist',
  description: '', // AI will generate
  background: '',  // AI will generate
  enrichAI: true
});
```

### Character Queries

```typescript
// List all characters in a world
const allCharacters = await trpc.character.list.query({ 
  worldId: 'world-123' 
});

// Find characters in a specific location
const tavernPatrons = await trpc.character.listByLocation.query({ 
  locationId: 'tavern-789' 
});

// Find faction members
const guildMembers = await trpc.character.listByFaction.query({ 
  factionId: 'guild-321' 
});

// Get specific character with all details
const character = await trpc.character.get.query({ 
  id: 'char-999' 
});
```

## Movement and Actions

### Moving Characters

```typescript
// Simple movement
await trpc.character.move.mutate({
  characterId: 'char-123',
  toLocationId: 'castle-456',
  reason: 'Summoned by the king'
});

// Evacuation scenario
const villagers = await trpc.character.listByLocation.query({
  locationId: 'burning-village'
});

for (const villager of villagers) {
  await trpc.character.move.mutate({
    characterId: villager.id,
    toLocationId: 'safe-haven',
    reason: 'Fleeing from dragon attack'
  });
}
```

### Faction Changes

```typescript
// Join a faction
await trpc.character.changeFaction.mutate({
  characterId: 'char-123',
  toFactionId: 'rebels-789',
  reason: 'Inspired by their cause'
});

// Leave faction (become independent)
await trpc.character.changeFaction.mutate({
  characterId: 'char-123',
  toFactionId: null,
  reason: 'Disillusioned with politics'
});

// Faction switching
await trpc.character.changeFaction.mutate({
  characterId: 'char-123',
  toFactionId: 'empire-456',
  reason: 'Offered better position'
});
```

## Memory System

### Adding Memories

```typescript
// Combat memory
await trpc.character.addMemory.mutate({
  characterId: 'char-123',
  memory: {
    event_description: 'Fought bandits on the northern road',
    emotional_impact: 'negative',
    importance: 0.6,
    beat_index: 3
  }
});

// Positive memory
await trpc.character.addMemory.mutate({
  characterId: 'char-123',
  memory: {
    event_description: 'Celebrated victory at the harvest festival',
    emotional_impact: 'positive',
    importance: 0.4
  }
});

// Traumatic memory
await trpc.character.addMemory.mutate({
  characterId: 'char-123',
  memory: {
    event_description: 'Witnessed the destruction of hometown',
    emotional_impact: 'negative',
    importance: 0.95,
    beat_index: 7
  }
});
```

### Retrieving Memories

```typescript
// Get all memories
const allMemories = await trpc.character.getMemories.query({
  characterId: 'char-123'
});

// Get recent memories
const recentMemories = await trpc.character.getMemories.query({
  characterId: 'char-123',
  limit: 5
});

// Process memories for story
const traumaticMemories = allMemories.filter(
  m => m.emotional_impact === 'negative' && m.importance > 0.8
);
```

## Relationships

### Building Relationships

```typescript
// Friendship
await trpc.character.setRelationship.mutate({
  characterId: 'char-123',
  targetId: 'char-456',
  type: 'friend',
  strength: 0.7,
  history: 'Met during academy training'
});

// Romance
await trpc.character.setRelationship.mutate({
  characterId: 'char-123',
  targetId: 'char-789',
  type: 'romantic',
  strength: 0.9,
  history: 'Love at first sight at the royal ball'
});

// Rivalry
await trpc.character.setRelationship.mutate({
  characterId: 'char-123',
  targetId: 'char-321',
  type: 'rival',
  strength: -0.6,
  history: 'Competing for the same position'
});
```

### Querying Relationships

```typescript
// Get all relationships
const relationships = await trpc.character.getRelationships.query({
  characterId: 'char-123'
});

// Find allies
const allies = relationships.filter(
  r => r.type === 'ally' || (r.type === 'friend' && r.strength > 0.5)
);

// Find enemies
const enemies = relationships.filter(
  r => r.type === 'enemy' || r.strength < -0.5
);
```

## AI-Powered Features

### Dialogue Generation

```typescript
// Simple dialogue
const dialogue = await trpc.character.generateDialogue.mutate({
  character_id: 'char-123',
  context: 'Greeting a stranger at the inn'
});
console.log(dialogue.utterance); // "Welcome, traveler..."

// Dialogue with specific target
const conversation = await trpc.character.generateDialogue.mutate({
  character_id: 'char-123',
  context: 'Confronting the traitor',
  speaking_to: 'char-456',
  emotional_state: 'angry'
});

// Dialogue influenced by recent events
const reaction = await trpc.character.generateDialogue.mutate({
  character_id: 'char-123',
  context: 'Discussing the war',
  recent_events: [
    'Village was burned',
    'Brother went missing',
    'Joined the resistance'
  ]
});
```

### Personality Evolution

```typescript
// Evolve after significant events
await trpc.character.addMemory.mutate({
  characterId: 'char-123',
  memory: {
    event_description: 'Betrayed by trusted friend',
    emotional_impact: 'negative',
    importance: 0.9
  }
});

const evolved = await trpc.character.evolvePersonality.mutate({
  characterId: 'char-123'
});

// Check personality changes
console.log('New traits:', evolved.personality_traits);
console.log('New motivations:', evolved.motivations);
```

## Complex Scenarios

### Party Formation

```typescript
async function formAdventuringParty(worldId: string, questId: string) {
  // Create diverse party
  const party = await Promise.all([
    trpc.character.create.mutate({
      world_id: worldId,
      name: 'Aldric',
      role: 'protagonist',
      enrichAI: true
    }),
    trpc.character.create.mutate({
      world_id: worldId,
      name: 'Mira',
      role: 'supporting',
      enrichAI: true
    }),
    trpc.character.create.mutate({
      world_id: worldId,
      name: 'Thorne',
      role: 'supporting',
      enrichAI: true
    })
  ]);

  // Establish party relationships
  for (let i = 0; i < party.length; i++) {
    for (let j = i + 1; j < party.length; j++) {
      await trpc.character.setRelationship.mutate({
        characterId: party[i].id,
        targetId: party[j].id,
        type: 'ally',
        strength: 0.6,
        history: `Joined together for quest ${questId}`
      });
    }
  }

  return party;
}
```

### Character Death Handling

```typescript
async function handleCharacterDeath(
  characterId: string, 
  cause: string,
  affectedCharacterIds: string[]
) {
  // Remove the character
  await trpc.character.remove.mutate({
    characterId,
    cause
  });

  // Add traumatic memories to witnesses
  for (const witnessId of affectedCharacterIds) {
    await trpc.character.addMemory.mutate({
      characterId: witnessId,
      memory: {
        event_description: `Witnessed death: ${cause}`,
        emotional_impact: 'negative',
        importance: 0.8
      }
    });

    // Generate grief dialogue
    const grief = await trpc.character.generateDialogue.mutate({
      character_id: witnessId,
      context: 'Mourning fallen companion',
      emotional_state: 'grief-stricken'
    });
    
    console.log(`${witnessId}: ${grief.utterance}`);
  }
}
```

### Dynamic Story Reactions

```typescript
async function reactToWorldEvent(
  eventDescription: string,
  affectedLocation: string
) {
  // Get all characters in affected area
  const characters = await trpc.character.listByLocation.query({
    locationId: affectedLocation
  });

  // Generate reactions based on role
  for (const character of characters) {
    let reaction;
    
    switch (character.role) {
      case 'protagonist':
      case 'antagonist':
        // Major characters get detailed reactions
        reaction = await trpc.character.generateDialogue.mutate({
          character_id: character.id,
          context: `Reacting to: ${eventDescription}`,
          emotional_state: 'shocked'
        });
        
        // Add as memory
        await trpc.character.addMemory.mutate({
          characterId: character.id,
          memory: {
            event_description: eventDescription,
            emotional_impact: 'negative',
            importance: 0.7
          }
        });
        break;
        
      case 'supporting':
        // Supporting characters might flee
        if (eventDescription.includes('attack') || 
            eventDescription.includes('destroy')) {
          await trpc.character.move.mutate({
            characterId: character.id,
            toLocationId: 'safe-location-id',
            reason: `Fleeing from: ${eventDescription}`
          });
        }
        break;
        
      case 'background':
        // Background characters just get memories
        await trpc.character.addMemory.mutate({
          characterId: character.id,
          memory: {
            event_description: `Witnessed: ${eventDescription}`,
            emotional_impact: 'negative',
            importance: 0.3
          }
        });
        break;
    }
  }
}
```

## Error Handling

```typescript
// Safe character operations
async function safeCharacterUpdate(characterId: string, updates: any) {
  try {
    const character = await trpc.character.get.query({ id: characterId });
    if (!character) {
      console.error('Character not found');
      return null;
    }

    return await trpc.character.update.mutate({
      id: characterId,
      updates
    });
  } catch (error) {
    console.error('Failed to update character:', error);
    return null;
  }
}

// Batch operations with error handling
async function evacuateLocation(locationId: string, safeLocationId: string) {
  const characters = await trpc.character.listByLocation.query({ locationId });
  const results = { success: 0, failed: 0 };

  for (const character of characters) {
    try {
      await trpc.character.move.mutate({
        characterId: character.id,
        toLocationId: safeLocationId,
        reason: 'Emergency evacuation'
      });
      results.success++;
    } catch (error) {
      console.error(`Failed to move ${character.name}:`, error);
      results.failed++;
    }
  }

  return results;
}
```