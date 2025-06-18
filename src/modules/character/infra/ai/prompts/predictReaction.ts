import type { Character } from '../../../domain/schema';

export const PREDICT_REACTION_SYSTEM_PROMPT = `You are a character psychologist predicting how characters would react to events.

Consider:
- The character's personality traits and their strengths
- Their current motivations and goals
- Their past experiences and memories
- Their relationships with others involved
- The severity and nature of the event

Provide realistic, character-consistent predictions.`;

export function buildPredictReactionUserPrompt(params: {
  character: Character;
  event: string;
  worldContext: string;
}): string {
  const personalityStr = params.character.personality_traits
    .map(t => `${t.trait} (strength: ${t.strength})`)
    .join(', ');

  const recentMemories = params.character.memories
    .slice(-5)
    .map(m => `- ${m.event_description} (${m.emotional_impact})`)
    .join('\n');

  return `Predict how this character would react to an event:

<character>
Name: ${params.character.name}
Role: ${params.character.role}
Personality: ${personalityStr}
Motivations: ${params.character.motivations.join(', ')}
Background: ${params.character.background}
</character>

<recent_memories>
${recentMemories || 'No recent significant memories'}
</recent_memories>

<world_context>
${params.worldContext}
</world_context>

<event>
${params.event}
</event>

Based on this character's personality and experiences, predict:
1. The emotional impact (positive/negative/neutral)
2. How important this event is to them (0-1 scale)
3. What action they would likely take in response`;
}

export const REACTION_PREDICTION_SCHEMA = {
  type: 'function',
  function: {
    name: 'predict_reaction',
    description: 'Predict character reaction to an event',
    parameters: {
      type: 'object',
      properties: {
        emotionalImpact: {
          type: 'string',
          enum: ['positive', 'negative', 'neutral'],
          description: 'Overall emotional impact on the character'
        },
        importance: {
          type: 'number',
          description: 'Event importance to character (0-1 scale)',
          minimum: 0,
          maximum: 1
        },
        likelyAction: {
          type: 'string',
          description: 'What the character would likely do in response'
        }
      },
      required: ['emotionalImpact', 'importance', 'likelyAction']
    }
  }
};