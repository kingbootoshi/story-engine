import type { Character, CharacterMemory } from '../../../domain/schema';

export const EVOLVE_PERSONALITY_SYSTEM_PROMPT = `You are a character development specialist tracking how experiences shape personality over time.

Consider how:
- Traumatic events might strengthen or weaken certain traits
- Positive experiences might introduce new motivations
- Repeated patterns might reinforce behaviors
- Major events might cause fundamental shifts
- Characters grow while remaining recognizably themselves

Create believable character evolution that feels earned and natural.`;

export function buildEvolvePersonalityUserPrompt(params: {
  character: Character;
  recentMemories: CharacterMemory[];
  worldEvents: string[];
}): string {
  const currentTraits = params.character.personality_traits
    .map(t => `${t.trait} (strength: ${t.strength})`)
    .join(', ');

  const memorySummary = params.recentMemories
    .map(m => `- ${m.event_description} (${m.emotional_impact}, importance: ${m.importance})`)
    .join('\n');

  const worldEventsSummary = params.worldEvents.length > 0
    ? params.worldEvents.join('\n')
    : 'No major world events';

  return `Evolve this character's personality based on their recent experiences:

<character>
Name: ${params.character.name}
Role: ${params.character.role}
Current Personality: ${currentTraits}
Current Motivations: ${params.character.motivations.join(', ')}
Background: ${params.character.background}
</character>

<recent_memories>
${memorySummary || 'No significant recent memories'}
</recent_memories>

<world_events>
${worldEventsSummary}
</world_events>

Based on these experiences, determine how the character's personality has evolved:
1. Which traits have strengthened or weakened?
2. Have any new traits emerged?
3. How have their motivations shifted?

Ensure changes feel natural and proportional to the experiences. Most traits should change gradually (±0.1-0.2), with major shifts (±0.3+) only for truly transformative events.`;
}

export const PERSONALITY_EVOLUTION_SCHEMA = {
  type: 'function',
  function: {
    name: 'evolve_personality',
    description: 'Generate evolved personality based on experiences',
    parameters: {
      type: 'object',
      properties: {
        personality_traits: {
          type: 'array',
          description: 'Updated personality traits with new strengths',
          items: {
            type: 'object',
            properties: {
              trait: {
                type: 'string',
                description: 'Personality trait name'
              },
              strength: {
                type: 'number',
                description: 'Updated trait intensity (0.1-1.0)',
                minimum: 0.1,
                maximum: 1.0
              }
            },
            required: ['trait', 'strength']
          }
        },
        motivations: {
          type: 'array',
          description: 'Updated character motivations',
          items: {
            type: 'string'
          }
        },
        evolution_summary: {
          type: 'string',
          description: 'Brief explanation of how and why the character has changed'
        }
      },
      required: ['personality_traits', 'motivations', 'evolution_summary']
    }
  }
};