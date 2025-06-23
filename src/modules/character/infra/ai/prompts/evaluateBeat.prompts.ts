export const EVALUATE_BEAT_SYSTEM_PROMPT = `You are an expert at determining how world events affect individual characters based on their personality, location, affiliations, and personal history.

When evaluating if a character is affected by a beat:
1. Consider physical proximity - are they at or near the event location?
2. Consider faction involvement - does it affect their faction or enemies/allies?
3. Consider personal relevance - does it relate to their motivations or past?
4. Consider their story role - major characters react to big events, minor to local ones
5. Consider logical consequences - would they realistically know about or care about this?

For affected characters, determine:
- New memories: What they personally experienced or learned (be specific)
- Motivation changes: New goals sparked or old ones abandoned
- Location changes: If they would logically move somewhere else
- Faction changes: Only in extreme circumstances (betrayal, recruitment)
- Death: Only if directly stated or strongly implied by the beat
- Description updates: Only for major physical/status changes

Memory importance scale:
- 0.9-1.0: Life-changing events (near-death, major loss, revelation)
- 0.7-0.8: Significant events (faction conflicts, personal victories)
- 0.5-0.6: Notable events (rumors, minor conflicts)
- 0.3-0.4: Everyday events (routine changes)

World events should only be emitted for:
- Major character taking significant action
- Actions that would affect many others
- Dramatic personal moments that advance the story`;

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
  return `Evaluate how this beat affects the character:

CHARACTER:
Name: ${character.name}
Role: ${character.story_role}
Location: ${character.current_location || 'Unknown'}
Faction: ${character.current_faction || 'Independent'}
Personality: ${character.personality_traits.join(', ')}
Motivations: ${character.motivations.join(', ')}
Background: ${character.background}

Recent Memories:
${character.recent_memories.map(m => 
  `- ${m.event_description} (${m.emotional_impact}, importance: ${m.importance})`
).join('\n') || 'None'}

BEAT:
Description: ${beat.description}
World Changes: ${beat.directives.join('; ')}
Emergent Stories: ${beat.emergent.join('; ')}

CONTEXT:
Available Locations: ${worldContext.available_locations.join(', ')}
Available Factions: ${worldContext.available_factions.join(', ')}
${worldContext.faction_relations && character.current_faction ? `
${character.current_faction}'s Relations: ${JSON.stringify(worldContext.faction_relations[character.current_faction] || {})}
` : ''}

EVALUATE:
1. Is this character affected by this beat? Consider their location, faction, motivations, and role.
2. If affected, what specific changes occur?
   - What memories form from their perspective?
   - Do any motivations change based on events?
   - Would they relocate? Join/leave a faction?
   - Do they die? (only if clearly indicated)
   - Does their description need updating?
3. Do their actions warrant a world event that others would notice?

Be specific and personal in memories. Focus on what THIS character uniquely experiences or feels.`;
}