# System Overview

The World Story Engine is a sophisticated narrative generation system designed to create dynamic, evolving stories for game worlds that respond to player actions in real-time.

## Core Philosophy

Unlike traditional linear narratives or branching storylines, the World Story Engine creates **living narratives** that:

1. **Adapt to Player Actions**: The story evolves based on collective player decisions
2. **Maintain Coherence**: Despite being dynamic, narratives maintain thematic consistency
3. **Create Emergence**: Unexpected story developments arise from player-world interactions
4. **Build History**: Each arc contributes to a growing world history

## Key Components

### 1. World Arcs
- 15-beat narrative structures based on the Save the Cat framework
- Define major world transformations (wars, discoveries, cataclysms, etc.)
- Last weeks to months in real-time

### 2. Story Beats
- Individual narrative moments within an arc
- Two types:
  - **Anchor Beats**: Pre-generated at arc creation (beats 0, 7, 14)
  - **Dynamic Beats**: Generated in response to world events

### 3. World Events
- Player actions, system events, or environmental changes
- Classified by impact level: minor, moderate, major, catastrophic
- Influence the generation of future story beats

### 4. AI Integration
- Uses OpenAI models via OpenRouter for narrative generation
- Function calling ensures structured, consistent output
- Context-aware generation incorporates recent events

## System Flow

```
1. World Creation
   ↓
2. Arc Initialization → Generate 3 Anchor Points
   ↓
3. Players Interact with World
   ↓
4. Events Recorded → Impact Assessment
   ↓
5. Beat Progression → AI generates next beat incorporating events
   ↓
6. World State Updates
   ↓
7. Players React to Changes
   ↓
8. Loop continues until arc completion
   ↓
9. Arc Summary → Feeds into next arc
```

## Data Architecture

### Worlds
- Represent distinct game universes
- Contain description and current state
- Track active story arc

### Arcs
- 15-beat story structures
- Include story name and core idea
- Can be active, completed, or archived

### Beats
- Individual story moments
- Include world directives and emergent storylines
- Reference their position in the arc (0-14)

### Events
- Tracked player actions and world changes
- Include impact level and affected regions
- Influence narrative generation

## Integration Points

The system provides several integration points for game developers:

1. **Event Recording API**: Log player actions and world changes
2. **Beat Progression API**: Advance the narrative
3. **World State API**: Query current narrative state
4. **WebSocket Support**: Real-time narrative updates (planned)

## Scalability Considerations

- Sparse generation minimizes upfront computation
- Caching of generated content
- Asynchronous beat generation
- Database indexing for performance
- Horizontal scaling support

## Security & Privacy

- API key authentication
- Rate limiting on generation endpoints
- No storage of sensitive player data
- Configurable data retention policies