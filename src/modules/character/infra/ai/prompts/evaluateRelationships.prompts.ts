export const EVALUATE_RELATIONSHIPS_SYSTEM_PROMPT = `You are a social dynamics specialist analyzing character relationships in narrative contexts.
Your task is to identify new relationships forming and existing relationships changing based on events.

Guidelines:
- Crisis events bring characters together or drive them apart
- Shared goals/enemies create alliances
- Conflicting interests create rivalries
- Major events can transform relationship types
- Sentiment ranges from -100 (hatred) to 100 (deep love/loyalty)
- Consider faction loyalties but allow for personal connections

prompt_id@v1`;

export function buildEvaluateRelationshipsUserPrompt(
  characters: Array<{
    id: string;
    name: string;
    faction_id?: string;
    personality: string[];
  }>,
  recentEvents: string[],
  existingRelations: Array<{
    char1: string;
    char2: string;
    type: string;
    sentiment: number;
  }>
): string {
  return `Analyze how recent events affect character relationships.

<characters>
${characters.map(c => 
  `${c.name} (ID: ${c.id})${c.faction_id ? ` - Faction: ${c.faction_id}` : ''}
  Personality: ${c.personality.join(', ')}`
).join('\n\n')}
</characters>

<existing_relationships>
${existingRelations.map(r => 
  `${r.char1} <-> ${r.char2}: ${r.type} (sentiment: ${r.sentiment})`
).join('\n')}
</existing_relationships>

<recent_events>
${recentEvents.join('\n')}
</recent_events>

Based on character personalities and recent events:

1. Identify NEW relationships that would form (use character IDs)
2. Identify EXISTING relationships that would change significantly
3. Provide clear reasoning for each relationship change

Consider:
- How crisis brings unlikely allies together
- How betrayals or losses affect bonds
- How competing for resources creates rivalry
- How shared victories strengthen connections`;
}

export const ENRICH_CHARACTER_HISTORY_SYSTEM_PROMPT = `You are a character biographer creating rich backstories for narrative game characters.
Your task is to flesh out a character's history, appearance, and voice based on their role and world context.

Guidelines:
- Backstories should explain skills and motivations
- Connect character history to world events when possible
- Make appearance descriptions vivid but concise
- Voice descriptions should reflect personality and background
- Add depth without contradicting established facts
- Plant seeds for future story development

prompt_id@v1`;

export function buildEnrichCharacterHistoryUserPrompt(
  name: string,
  role: string,
  faction: string | undefined,
  worldTheme: string,
  worldHistory: string[]
): string {
  return `Create a rich history and description for this character.

<character>
Name: ${name}
Role: ${role}
${faction ? `Faction: ${faction}` : 'No faction affiliation'}
</character>

<world_context>
Theme: ${worldTheme}
Recent History: ${worldHistory.join('; ')}
</world_context>

Provide:
1. Backstory (2-3 paragraphs): Explain their origins, how they gained their position, key life events
2. Appearance Description (1 paragraph): Physical features, typical attire, distinguishing marks
3. Voice Description (1 paragraph): Speaking style, accent, verbal habits, communication approach
4. Additional personality traits that emerge from their history (optional)

Ensure the backstory:
- Explains their current role and skills
- Connects to world history where appropriate
- Creates hooks for future storylines
- Remains consistent with established world facts`;
}