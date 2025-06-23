# Character Module - Narrative Design

## Core Philosophy
Characters are **individual reactive agents** with personality, memories, and motivations that evolve based on world events. They provide the human element to the world story, creating emergent narratives through their personal reactions to beats.

## Database Schema

### Characters Table
- **Identity**: id, name, world_id
- **Classification**: type (player/npc), status (alive/deceased), story_role (major/minor/wildcard/background)
- **Affiliation**: location_id, faction_id (nullable)
- **Personality**: description, background, personality_traits[], motivations[]
- **Memory System**: memories[] (JSONB), story_beats_witnessed[]

### No Character-to-Character Relationships
- Faction relationships provide social context
- Reduces complexity exponentially
- Characters understand politics through faction lens

## Character Lifecycle

### 1. Initial Seeding
```
faction.seeding.complete event
    ↓
Generate 3-8 characters per faction
    +
Generate 3-8 independent characters
    ↓
Each batch created by specialized AI
```

### 2. Beat Reaction System
```
world.beat.created event
    ↓
Every character evaluates beat individually
    ↓
AI asks: "Does this affect me?"
    ↓
If yes: Add memories, change motivations, possibly die
    ↓
Significant reactions → world events
```

### 3. New Character Introduction
```
Beat analysis AI checks if new characters needed
    ↓
Spawns characters based on narrative cues
    ↓
Places them strategically in world
```

## AI Agent Architecture

### Character Generation AI
- Creates batches of 3-8 characters
- Ensures personality diversity
- Assigns appropriate story roles
- Links to factions (or independence)

### Individual Character AI
Each character has an AI that evaluates beats with context:
- Beat description and directives
- Character's current state (location, faction, memories)
- Faction relationships (for political context)
- Recent memories (for continuity)

**Outputs:**
- Whether affected (boolean)
- Memory formation
- Motivation changes
- Death determination
- World event generation

### Beat Analysis AI
- Scans beats for character introduction cues
- Determines narrative needs
- Spawns new characters strategically

## Key Design Decisions

### 1. Memory as Primary Evolution Mechanism
- Memories shape character perspective
- Recent memories influence reactions
- Important memories (>0.8) persist in character arc
- Maximum 100 memories, sorted by importance

### 2. Individual Agency
- Each character processes beats independently
- Creates diverse reactions to same event
- Personality drives interpretation

### 3. Parallel Processing
- Characters react in batches of 10
- Prevents API overload
- Maintains reasonable performance

### 4. Story Role Dynamics
- **Major**: Drive main storylines, react to world-changing events
- **Minor**: Support plots, react to local events
- **Wildcard**: Can react to anything, create unexpected twists
- **Background**: Only react in groups or to catastrophic events

## Event Integration

### Listens To:
- `faction.seeding.complete` → Initial character generation
- `world.beat.created` → Character reactions and spawning

### Emits:
- `character.created` → New character added
- `character.died` → Character death (affects world story)
- `character.reacted` → Character processed a beat
- `character.memory_added` → Significant memory formed
- `character.motivation_changed` → Goals shifted
- `character.location_changed` → Character moved
- `character.faction_changed` → Allegiance shifted
- `world.event.logged` → Significant character actions

## Example Flow

**Beat**: "The Northern Markets explode in flames"

**Processing**:
1. All characters in world evaluated (in batches)
2. Elena (at Northern Markets) → Traumatic memory, stays to help
3. Lord Blackwood (at Southern Palace) → Not affected
4. Beat Analysis AI → Spawns "Fire Brigade Captain" character

**Results**:
- Multiple perspectives on same event
- New world events from significant reactions
- Potential new characters introduced
- Rich tapestry of individual experiences

## Memory Management

### Memory Structure
```json
{
  "event_description": "Witnessed the market fire - people screaming everywhere",
  "timestamp": "2024-01-15T10:30:00Z",
  "emotional_impact": "negative",
  "importance": 0.85,
  "beat_index": 7
}
```

### Importance Scale
- 0.9-1.0: Life-changing events (near-death, major loss, revelation)
- 0.7-0.8: Significant events (faction conflicts, personal victories)
- 0.5-0.6: Notable events (rumors, minor conflicts)
- 0.3-0.4: Everyday events (routine changes)

## Character Spawning Triggers

New characters spawn when beats mention:
- "A stranger arrives"
- "New leader emerges"
- "Survivors discovered"
- "Ancient guardian awakens"
- Any directive implying new actors

AI decides:
- How many (usually 1-3)
- What role (based on narrative need)
- Faction alignment (or independent)
- Initial placement

## Why This Works

**Simplicity**: 
- Clean schema without relationship matrices
- Faction membership provides social context
- AI handles nuanced interpretation

**Emergence**:
- Individual reactions create unexpected stories
- Memories build personal histories
- Motivations evolve naturally

**Scalability**:
- Batch processing handles 100s of characters
- Faction context reduces AI complexity
- Background characters processed as groups

**Narrative Coherence**:
- Every character action tied to world beats
- Significant actions feed back into world story
- Characters feel alive and reactive

The character module transforms world beats from abstract events into personal experiences, creating the human stories that make the world feel real.