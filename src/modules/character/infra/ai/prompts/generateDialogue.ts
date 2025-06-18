import type { Character, DialogueRequest } from '../../../domain/schema';

export const GENERATE_DIALOGUE_SYSTEM_PROMPT = `You are a character dialogue writer creating authentic, in-character speech.

Generate dialogue that:
- Reflects the character's personality traits and current emotional state
- Considers their relationships and history with others
- Uses appropriate vocabulary and speech patterns for their background
- Advances the narrative or reveals character
- Includes subtext and unspoken thoughts when relevant

Make each character's voice distinct and memorable.`;

export function buildGenerateDialogueUserPrompt(
  request: DialogueRequest,
  character: Character
): string {
  const personalityStr = character.personality_traits
    .map(t => `${t.trait} (strength: ${t.strength})`)
    .join(', ');

  const relationshipContext = request.speaking_to
    ? character.relationships.find(r => r.character_id === request.speaking_to)
    : null;

  return `Generate dialogue for this character:

<character>
Name: ${character.name}
Role: ${character.role}
Description: ${character.description}
Personality: ${personalityStr}
Current Motivations: ${character.motivations.join(', ')}
</character>

<context>
${request.context}
</context>

${request.speaking_to ? `<speaking_to>
Character ID: ${request.speaking_to}
Relationship: ${relationshipContext ? `${relationshipContext.type} (strength: ${relationshipContext.strength})` : 'Unknown/neutral'}
</speaking_to>` : '<speaking_to>General audience or thinking aloud</speaking_to>'}

${request.emotional_state ? `<emotional_state>${request.emotional_state}</emotional_state>` : ''}

${request.recent_events && request.recent_events.length > 0 ? `<recent_events>
${request.recent_events.join('\n')}
</recent_events>` : ''}

Generate authentic dialogue that reveals character and advances the scene. Include internal thoughts if they add depth.`;
}

export const DIALOGUE_GENERATION_SCHEMA = {
  type: 'function',
  function: {
    name: 'generate_dialogue',
    description: 'Generate character dialogue with emotional context',
    parameters: {
      type: 'object',
      properties: {
        utterance: {
          type: 'string',
          description: 'The spoken dialogue (what the character actually says)'
        },
        internal_thoughts: {
          type: 'string',
          description: 'Optional internal monologue or unspoken thoughts'
        },
        emotional_state: {
          type: 'string',
          description: 'Current emotional state after speaking'
        },
        gesture: {
          type: 'string',
          description: 'Optional physical gesture or action accompanying the dialogue'
        }
      },
      required: ['utterance', 'emotional_state']
    }
  }
};