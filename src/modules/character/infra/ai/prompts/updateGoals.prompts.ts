export const UPDATE_CHARACTER_GOALS_SYSTEM_PROMPT = `You are a character psychology specialist analyzing how events impact character motivations.
Your task is to evolve character goals based on recent world events and their personality.

Guidelines:
- Goals should evolve naturally from character's personality and beliefs
- Major events should trigger significant goal changes
- Abandoned goals need clear reasoning
- New goals should create narrative opportunities
- Maintain character consistency while allowing growth
- Maximum 5 active goals at any time

prompt_id@v1`;

export function buildUpdateCharacterGoalsUserPrompt(
  characterName: string,
  currentGoals: string[],
  personality: string[],
  beliefs: string[],
  recentEvents: string[],
  worldContext: string
): string {
  return `Analyze how recent events impact this character's goals.

<character>
Name: ${characterName}
Personality: ${personality.join(', ')}
Core Beliefs: ${beliefs.join(', ')}
Current Goals: ${currentGoals.join(', ')}
</character>

<recent_events>
${recentEvents.join('\n')}
</recent_events>

<world_context>${worldContext}</world_context>

Based on the character's personality and recent events:
1. Which current goals would they abandon and why?
2. What new goals would emerge from recent events?
3. Provide reasoning for the character's evolution

Ensure the character maintains no more than 5 active goals.`;
}