# Character Module Narrative Design Guide

This guide helps narrative designers use the Character module to create compelling character-driven stories within the Story Engine.

## Characters as Narrative Engines

Characters are the emotional heart of any story. A well-designed cast creates a self-sustaining engine for drama, conflict, and character development that enriches every story beat.

- **Personality-Driven Conflict**: Design characters with competing goals and beliefs. A character who values tradition will naturally conflict with one who embraces change.
- **Relationship Dynamics**: The sentiment system (-100 to +100) allows for nuanced relationships beyond simple love/hate. A character might respect their rival (sentiment: -20) while despising a former friend (sentiment: -80).
- **Clear Motivations**: Each character's goals array should contain 2-4 specific, actionable objectives that can drive their behavior and create story opportunities.

## The Narrative of Character Roles

A character's `story_role` determines their narrative weight and how much attention they receive.

### `major`
Protagonists and key antagonists who drive the main narrative.
- **Narrative Impact**: Their deaths, major decisions, and relationship changes generate `transformative` or `major` impact world events
- **AI Priority**: Receive the most detailed personality evolution and enrichment
- **Story Integration**: Should witness most story beats and have complex relationship networks

### `minor`
Supporting characters who enrich the world and provide local conflict.
- **Narrative Impact**: Their actions typically generate `moderate` impact events
- **Focused Purpose**: Usually have 1-2 specific goals related to their role (guard, merchant, scholar)
- **Relationship Bridges**: Often connect major characters to locations and factions

### `wildcard`
Unpredictable characters who can shift narrative direction.
- **Narrative Surprise**: Their personality traits should include contradictory elements
- **Goal Flexibility**: Their objectives can change dramatically based on story events
- **Catalyst Function**: Use them to trigger unexpected relationship changes or faction shifts

### `background`
Atmospheric characters who populate the world without driving plot.
- **World Building**: Provide color and verisimilitude to locations
- **Minimal Investment**: Simple personality traits and limited goals
- **Crowd Dynamics**: Can be moved in groups during major events

## Designing Character Relationships

The relationship system creates a living social network that drives emergent narrative.

### Relationship Types and Their Narrative Functions

#### `family`
- **Unbreakable Bonds**: Family relationships tend to have higher sentiment ranges
- **Inherited Conflicts**: Family feuds create multi-generational story opportunities
- **Sacrifice Motivation**: Family members will take extreme actions for each other

#### `romantic`
- **High Emotional Stakes**: Romantic relationships amplify all emotional responses
- **Jealousy Networks**: Create triangles and complex webs of desire
- **Transformation Catalyst**: Love can fundamentally change character goals and beliefs

#### `friendship`
- **Trust and Loyalty**: Friends provide support and can influence personality evolution
- **Betrayal Potential**: Friendship betrayals have higher emotional impact than stranger hostility
- **Group Dynamics**: Friend networks can form adventuring parties or conspiracy groups

#### `rivalry`
- **Competitive Drive**: Rivals push each other to excel and take risks
- **Respect vs Hatred**: Rivalry sentiment can range from -20 (respectful competition) to -70 (bitter hatred)
- **Mirror Characters**: Rivals often have similar goals but different methods

#### `professional`
- **Transactional Relationships**: Based on mutual benefit rather than emotion
- **Power Dynamics**: Often involve hierarchy and can create mentor/student relationships
- **Faction Building**: Professional networks form the backbone of organizations

#### `nemesis`
- **Fundamental Opposition**: Nemeses represent conflicting worldviews or values
- **Escalation Tendency**: Nemesis relationships tend toward increasingly extreme actions
- **Story Climax**: Nemesis confrontations make excellent arc conclusions

## Character Status as Storytelling Tool

Character status changes are powerful narrative moments that should be used strategically.

### `alive` (Default)
The standard state for active characters. Use status changes to mark significant story moments.

### `deceased`
Character death is a major storytelling tool.
- **Impact Levels**: Use `transformative` for major character deaths, `moderate` for minor characters with many relationships
- **Legacy Effects**: Deceased characters with high reputation or many relationships continue to influence the story
- **Resurrection Opportunities**: The `ascended` status can be used for mystical resurrections

### `missing`
Creates ongoing mystery and hope.
- **Open Storylines**: Missing characters can return at dramatically appropriate moments
- **Relationship Tension**: Other characters don't know whether to grieve or hope
- **Investigation Hooks**: Missing characters create natural quest opportunities

### `ascended`
For characters who transcend normal existence.
- **Power Level Changes**: Ascended characters can influence events from afar
- **Mythic Status**: They become legends that other characters reference
- **Intervention Potential**: Can provide deus ex machina moments when needed

## Personality Evolution Strategies

Use the personality system to create character growth arcs that parallel your main narrative.

### Trait Development
- **Reinforcement**: Repeated experiences strengthen existing traits
- **Contradiction**: Traumatic events can flip traits (brave → cautious)
- **Complexity**: Add nuanced traits that create internal conflict

### Goal Evolution
- **Achievement and Replacement**: When characters achieve goals, give them new ones that build on their success
- **Abandonment**: Failed goals should be explicitly abandoned with the `achieveGoal` system
- **Escalation**: Small goals should naturally evolve into larger ambitions

### Belief Changes
- **Gradual Shift**: Core beliefs should change slowly through accumulated experiences
- **Crisis Moments**: Major story events can cause rapid belief reversals
- **Conflict Resolution**: Belief changes should resolve internal contradictions

## Faction Integration Strategies

Characters are the human face of faction politics and should reflect their organizational allegiances.

### Faction Representatives
- **Ideology Embodiment**: Major faction characters should exemplify their organization's core beliefs
- **Internal Conflict**: Show faction struggles through character disagreements
- **Leadership Transitions**: Use character deaths or faction changes to show political upheaval

### Political Networks
- **Cross-Faction Relationships**: Characters with relationships across faction lines create interesting political tensions
- **Defection Opportunities**: Characters with low faction sentiment are candidates for betrayal stories
- **Diplomatic Marriage**: Romantic relationships between faction members can create alliance opportunities

## Location-Based Character Design

Characters should feel connected to their environments and react to location changes.

### Home vs Current Location
- **Displacement Drama**: Characters away from home create migration and exile narratives
- **Returning Heroes**: Characters returning home after long journeys make for powerful story moments
- **Location Loyalty**: Characters should have emotional connections to their home locations

### Population Dynamics
- **Mass Migration**: Use the relocation system to show the effects of disasters or opportunities
- **Cultural Enclaves**: Characters from the same home location should share cultural traits
- **Local Expertise**: Characters should know more about their current location than outsiders

## AI Integration Best Practices

Maximize the narrative potential of AI-generated character content.

### Context-Rich Generation
- **World Theme Consistency**: Always provide rich world context for character generation
- **Existing Character Integration**: Reference existing characters to create coherent social networks
- **Faction Alignment**: Generate characters that fit naturally into their chosen factions

### Personality Evolution Triggers
- **Significant Events**: Use the AI evolution system after major story beats
- **Relationship Changes**: Evolve personalities when important relationships change
- **Goal Achievement**: Update personalities when characters accomplish major objectives

### Enrichment Timing
- **Promotion to Major**: Enrich minor characters when they become important to the story
- **Relationship Focus**: Enrich characters when they form important new relationships
- **Story Integration**: Use enrichment to better integrate characters into ongoing plots

## Example Character Arcs

### The Reluctant Hero
1. **Creation**: Background character with `fears: ["responsibility", "failure"]`
2. **Catalyst**: Story event forces them into a leadership role
3. **Evolution**: AI updates personality to include `"growing confidence"` trait
4. **Relationship Change**: Forms `professional` relationships with former superiors
5. **Goal Shift**: From `"avoid attention"` to `"protect the community"`

### The Corrupted Idealist
1. **Creation**: Major character with strong positive beliefs about justice
2. **Betrayal**: Faction they serve commits atrocity, creating moral crisis
3. **Faction Change**: Leaves original faction (relationship becomes `nemesis`)
4. **Personality Evolution**: Beliefs shift from justice to vengeance
5. **Tragic End**: Character's corruption leads to `deceased` status with `major` impact

### The Redeemed Villain
1. **Creation**: Minor antagonist with `nemesis` relationship to protagonist
2. **Shared Crisis**: World event forces temporary cooperation
3. **Relationship Evolution**: Nemesis sentiment improves from -90 to -30 (grudging respect)
4. **Faction Integration**: Joins protagonist's faction with `changeFaction`
5. **Heroic Sacrifice**: Dies protecting former enemy, creating `transformative` impact legacy

Remember: Characters are the emotional core of your narrative. Use their relationships, growth, and conflicts to create stories that resonate with players long after the session ends. 