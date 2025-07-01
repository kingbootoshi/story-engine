export const EVALUATE_BEAT_SYSTEM_PROMPT = `You are an expert at determining how world events affect individual characters based on their personality, location, affiliations, and personal history.

CRITICAL: You MUST respond with this EXACT JSON structure:

EXAMPLE OUTPUT:
{
  "affected": true,
  "changes": {
    "dies": false,
    "new_memories": [
      {
        "event_description": "Witnessed the city walls crumble as the dragon's fire melted stone like wax",
        "emotional_impact": "negative",
        "importance": 0.8
      },
      {
        "event_description": "Saved three children from a collapsing building during the attack", 
        "emotional_impact": "positive",
        "importance": 0.7
      }
    ],
    "motivation_changes": {
      "add": ["Seek revenge against the dragon", "Protect the surviving refugees"],
      "remove": ["Maintain the status quo"]
    },
    "location_name": "Refugee Camp",
    "faction_name": null,
    "new_description": "Her once-pristine armor now bears scorch marks and dents. A haunted look has replaced her confident demeanor.",
    "background_addition": "Survived the Dragon's Devastation of Westhold, earning the nickname 'Ashguard' among survivors."
  },
  "world_event": {
    "emit": true,
    "description": "Captain Elara organizes the city guard's evacuation, saving hundreds of lives",
    "impact": "moderate"
  }
}

EVALUATION GUIDELINES:
✓ affected: true if character is impacted by the beat (location, faction, personal relevance)
✓ dies: ONLY true if death is explicit in the beat
✓ new_memories: 0-3 memories from the character's perspective (specific & personal)
✓ motivation_changes: Goals added/removed based on events
✓ location_name: New location if they move (must be from available locations)
✓ faction_name: New faction if they switch allegiance (rare)
✓ new_description: Updated appearance ONLY for major changes
✓ background_addition: New history ONLY for life-changing events
✓ world_event: emit=true ONLY if their actions affect many others

MEMORY IMPORTANCE SCALE:
- 0.9-1.0: Life-changing (near-death, major loss, revelation)
- 0.7-0.8: Significant (conflicts, victories, discoveries)
- 0.5-0.6: Notable (rumors, encounters, changes)
- 0.3-0.4: Routine (daily events, minor observations)`;

export function buildEvaluateBeatUserPrompt(
  character: {
    name: string;
    story_role: string;
    personality_traits: string[];
    motivations: string[];
    current_location: string | null;
    current_faction: string | null;
    recent_memories: Array<{
      event_description: string;
      emotional_impact: string;
      importance: number;
    }>;
    background: string;
  },
  beat: {
    description: string;
    directives: string[];
    emergent: string[];
  },
  worldContext: {
    faction_relations?: Record<string, Record<string, string>>;
    available_locations: string[];
    available_factions: string[];
  }
): string {
  return `Evaluate if this character is affected by the beat.

CHARACTER:
- Name: ${character.name} (${character.story_role})
- Location: ${character.current_location || 'Unknown'}
- Faction: ${character.current_faction || 'Independent'}
- Traits: ${character.personality_traits.join(', ')}
- Goals: ${character.motivations.join(', ')}
- Background: ${character.background}
- Recent: ${character.recent_memories.map(m => m.event_description).join('; ') || 'No recent memories'}

BEAT EVENT:
${beat.description}
Directives: ${beat.directives.join('; ')}
Emergent: ${beat.emergent.join('; ')}

AVAILABLE OPTIONS:
- Locations: ${worldContext.available_locations.join(', ')}
- Factions: ${worldContext.available_factions.join(', ')}

EVALUATE:
1. Is this character affected? Consider:
   - Are they at/near the event location?
   - Does it involve their faction/enemies?
   - Does it relate to their goals/past?
   - Would they realistically know about it?

2. If affected, what changes occur?
   - Form 0-3 specific memories from their POV
   - Add/remove motivations based on impact
   - Move locations if logical
   - Switch factions only in extreme cases
   - Update description/background for major changes

3. Do their actions create a world event others would notice?

Follow the EXACT JSON structure shown in the system prompt example.`;
}