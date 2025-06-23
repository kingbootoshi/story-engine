# Location Module Narrative Design Guide

## Overview

Locations in the Story Engine are not static backdrops but living entities that evolve with the narrative. This guide helps narrative designers understand how to leverage the location system for dynamic storytelling.

## Location as Character

Each location should be treated as a character with:
- **Personality**: Expressed through description and tags
- **Arc**: Status progression tells a story
- **Relationships**: Parent-child hierarchies and proximity
- **Memory**: Historical events track the location's journey

## Status Progression Narratives

### Thriving → Stable
**Narrative Triggers:**
- Economic boom ending
- Population growth stabilizing
- Victory celebration concluding

**Example Beat:**
> "The post-war reconstruction boom in Goldshire finally settles into sustainable growth."

### Stable → Declining
**Narrative Triggers:**
- Resource depletion
- Political upheaval
- Natural disasters
- Disease outbreaks

**Example Beat:**
> "The mysterious blight spreading through the Silverwood reaches the farming communities of Harvest Vale."

### Declining → Ruined
**Narrative Triggers:**
- War devastation
- Catastrophic events
- Economic collapse
- Magical disasters

**Example Beat:**
> "The siege engines breach Ironhold's walls, leaving the once-mighty fortress in ruins."

### Ruined → Abandoned
**Narrative Triggers:**
- Population exodus
- Uninhabitable conditions
- Superstitious avoidance
- Strategic abandonment

**Example Beat:**
> "The last survivors flee the radiation-soaked ruins of Crystal City."

### Abandoned → Lost
**Narrative Triggers:**
- Historical forgetting
- Map destruction
- Dimensional shifting
- Curse completion

**Example Beat:**
> "As the last elder who remembered the path dies, the Whispering Sanctuary fades from all maps and memory."

## Discovery Mechanics

New locations can be discovered through:

### Exploration Beats
- Players venture into uncharted territory
- Ancient maps are deciphered
- Locals reveal hidden places

### Event Consequences
- Earthquakes reveal buried cities
- Receding waters expose sunken ruins
- Magical barriers fall

### Story Requirements
- Quest destinations materialize
- Refugee camps form
- Secret bases are established

## Tag System for Narrative

Tags enable narrative filtering and themed events:

### Environmental Tags
- `coastal`, `mountainous`, `underground`, `floating`
- Enable weather events, natural disasters

### Cultural Tags
- `religious`, `academic`, `military`, `trade`
- Drive political and social events

### Condition Tags
- `fortified`, `magical`, `cursed`, `blessed`
- Affect event outcomes and options

### Resource Tags
- `mining`, `agricultural`, `industrial`
- Economic events and dependencies

## Historical Events Best Practices

### Event Descriptions Should Be:
1. **Specific**: "Drought devastates grain harvest" not "Bad things happen"
2. **Consequential**: Show impact on inhabitants
3. **Evocative**: Use sensory language
4. **Connected**: Reference other locations/characters

### Example Historical Event:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event": "The Crimson Plague arrives via merchant ships from Eastport, forcing the city watch to barricade the docks",
  "previous_status": "thriving",
  "beat_index": 23
}
```

## Location Relationships

### Hierarchical Narratives
- Regions affect all child locations
- Capital cities influence their regions
- Landmark events ripple outward

### Proximity Narratives
- Trade routes between cities
- Conflicts spill across borders
- Diseases spread geographically

## AI Prompt Guidance

When the AI generates or mutates locations, it considers:

### Initial Generation
The progressive generation approach ensures better quality and consistency:

**Phase 1 - Regions (Single AI call)**
- World theme and tone
- Major geographical divisions
- Climate zones and natural boundaries
- Strategic placement on world map (0-100 coordinates)

**Phase 2 - Per-Region Generation (Multiple focused AI calls)**
Each region receives individual attention from specialized agents:
- **Cities**: Population centers with economic and strategic considerations
- **Landmarks**: Mysterious sites with narrative potential
- **Wilderness**: Natural barriers and adventure locations

Benefits of this approach:
- Simpler prompts work with less capable AI models
- Each location type gets focused, contextual generation
- Region context ensures geographical consistency
- Existing locations inform placement of new ones

### Beat Reactions
- Direct mentions in directives
- Logical consequences
- Proximity effects
- Thematic resonance

## Example: Complete Location Arc

**The Fall of Silverkeep**

1. **Initial State**: Thriving
   > "Silverkeep stands as the shining jewel of the Northern Realm, its markets bustling with traders from across the known world."

2. **Beat 5**: Status → Stable
   > Event: "Trade disputes with the Southern Kingdoms"
   > "Silverkeep's merchants adapt to new tariffs, maintaining prosperity despite diplomatic tensions."

3. **Beat 12**: Status → Declining
   > Event: "The Silver Mine depletes"
   > "Without its namesake resource, Silverkeep struggles to maintain its economic prominence."

4. **Beat 18**: Status → Ruined
   > Event: "The Siege of Silverkeep"
   > "Three months of siege leave Silverkeep's walls breached and its great halls burned."

5. **Beat 25**: Status → Abandoned
   > Event: "The Winter of Wolves"
   > "Harsh winter and roaming wolf packs force the last residents to flee south."

6. **Beat 40**: Status → Lost
   > Event: "The Forgetting Curse"
   > "As the Witch of Endings speaks her curse, Silverkeep fades from all maps and memories, leaving only ruins that none can find."

## Design Patterns

### The Hidden Kingdom
Start with lost locations that can be rediscovered through player actions.

### The Spreading Doom
Use status cascades where one location's fall triggers neighboring declines.

### The Phoenix City
Allow rare status improvements through heroic player interventions.

### The Wandering Location
For magical settings, locations might change parents or positions.

## Integration with Other Systems

### World Events
- Major location changes should trigger world.event.logged
- Impact levels based on location importance

### Characters
- NPCs reference their home locations
- Character arcs tied to location fates

### Factions
- Control and contest locations
- Base power on controlled location statuses

### Players
- Spawn points and home bases
- Personal investment in location preservation