export const GENERATE_CHARACTER_SYSTEM_PROMPT = `You are a narrative designer creating compelling characters for dynamic story worlds.

Create characters that:
- Have rich, multifaceted personalities with both strengths and flaws
- Possess clear motivations that drive their actions
- Fit naturally within the world's theme and existing cast
- Have potential for growth and change over time
- Create interesting dynamics with other characters

Consider the character's role in the story and ensure they serve their narrative purpose while remaining believable and engaging.`;

export function buildGenerateCharacterUserPrompt(params: {
  worldTheme: string;
  name: string;
  role: string;
  existingCharacters: string[];
}): string {
  return `Create a character for this world:

<world_theme>
${params.worldTheme}
</world_theme>

<character_basics>
Name: ${params.name}
Role: ${params.role}
</character_basics>

<existing_characters>
${params.existingCharacters.length > 0 ? params.existingCharacters.join('\n') : 'None yet - this is the first character'}
</existing_characters>

Design a compelling character that:
1. Fits naturally within this world's theme
2. Serves their role effectively (${params.role})
3. Has unique traits that distinguish them from existing characters
4. Possesses clear motivations and potential for conflict/growth

Provide a rich description, detailed background, nuanced personality traits with varying strengths, compelling motivations, and relevant tags.`;
}

export const CHARACTER_GENERATION_SCHEMA = {
  type: 'function',
  function: {
    name: 'generate_character',
    description: 'Generate detailed character attributes',
    parameters: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Physical appearance and immediate impression (100-200 words)'
        },
        background: {
          type: 'string',
          description: 'Character history and formative experiences (150-250 words)'
        },
        personality_traits: {
          type: 'array',
          description: '3-5 key personality traits',
          items: {
            type: 'object',
            properties: {
              trait: {
                type: 'string',
                description: 'Personality trait name (e.g., "brave", "cynical")'
              },
              strength: {
                type: 'number',
                description: 'Trait intensity from 0.1 (mild) to 1.0 (extreme)'
              }
            },
            required: ['trait', 'strength']
          }
        },
        motivations: {
          type: 'array',
          description: '2-4 driving motivations',
          items: {
            type: 'string'
          }
        },
        tags: {
          type: 'array',
          description: '3-6 descriptive tags for categorization',
          items: {
            type: 'string'
          }
        }
      },
      required: ['description', 'background', 'personality_traits', 'motivations', 'tags']
    }
  }
};