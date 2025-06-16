# Faction Module System Overview

The Faction module provides the political and social layer of the Story Engine. Factions are organized groups with their own ideologies, goals, and resources that act within the world, creating conflict, and driving the narrative forward.

## Core Concepts

### Faction Entity
Each faction is defined by:
- **Ideology**: Core beliefs and motivations. This is not static and can evolve.
- **Status**: The faction's current lifecycle stage (`rising`, `stable`, `declining`, `collapsed`).
- **Territory**: A list of `location_id`s that the faction controls.
- **Relationships**: Diplomatic stances (`ally`, `neutral`, `hostile`) with other factions.

## The Faction <> World Story Interaction

Factions have a deep, bidirectional relationship with the world story, mirroring how the Location module interacts with the world.

### 1. How Factions Provide Context to the World Story

Factions shape the narrative by providing a rich political and social context for the AI to draw upon.

- **Initial Seeding**: On `world.created`, the `FactionService` listens for the event and uses the AI to **seed the world with 2-3 initial factions**. This immediately establishes a political landscape, complete with inherent tensions and potential alliances that the first story arc can build upon.
- **Generating World Events**: The actions of a faction are a primary source of `world.event.logged` events. When a faction claims a location, declares war, or undergoes a major internal shift, it emits an event. These events accumulate and become the direct input for the `StoryAIService` when it generates the next story beat.
- **Influencing Location Context**: Factions can control locations via the `controlling_faction_id` field. Since the list of current locations is provided to the world story AI, a location's description is implicitly contextualized by its ruler. "The city of Ironhold" becomes "The city of Ironhold, a key fortress of the Dominion Empire," providing much richer context for narrative generation.

### 2. How Factions React to the World Story

Factions are not static; they are designed to react dynamically to the evolving narrative presented in story beats.

- **Beat Reactions (Diplomacy)**: The `FactionService` subscribes to the `world.beat.created` event. When a new beat is generated, it triggers the `evaluateRelations` AI process. The AI analyzes the new beat's narrative, considers each faction's ideology, and suggests changes to diplomatic stances. For example, a beat about an "external invasion" might cause two rival factions to become allies.
- **Doctrine Evolution (Ideology)**: A faction's ideology is not fixed. If a faction's status changes (e.g., from `stable` to `declining` due to story events), the `FactionService` triggers the `updateDoctrine` AI process. The AI rewrites the faction's core ideology and tags to reflect its new circumstances. A once-proud, expansionist empire might become xenophobic and isolationist after a major defeat. This creates a powerful, emergent narrative feedback loop.
- **Reacting to Location Changes**: Since factions are tied to territory, they also react to events from the Location module. The `FactionService` subscribes to `location.status_changed`. If a city controlled by a faction is `ruined`, the service can automatically trigger the faction to release control of the location and potentially downgrade its own status, creating a cascade of narrative consequences.

## AI Integration

The Faction AI adapter is responsible for:
- **Generating Factions**: Creating new, unique factions that fit the world's theme and existing political landscape.
- **Evaluating Relations**: Analyzing story beats to suggest logical shifts in diplomacy.
- **Updating Doctrine**: Evolving a faction's core beliefs and tags in response to its changing fortunes.

This ensures that the political landscape of the world feels alive, intelligent, and responsive to the overarching story.
```