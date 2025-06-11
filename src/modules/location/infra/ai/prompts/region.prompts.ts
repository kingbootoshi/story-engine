import type { RegionGenerationContext } from '../../../domain/ports';

export const REGION_GENERATION_SCHEMA = {
  name: 'generate_regions',
  description: 'Generate 2-5 major regions for a new world',
  parameters: {
    type: 'object',
    required: ['regions'],
    properties: {
      regions: {
        type: 'array',
        minItems: 2,
        maxItems: 5,
        items: {
          type: 'object',
          required: ['name', 'description', 'tags', 'relative_position'],
          properties: {
            name: { type: 'string', description: 'Unique region name' },
            description: { type: 'string', description: 'Region description (120-300 words)' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags describing region features'
            },
            relative_position: {
              type: 'object',
              required: ['x', 'y'],
              properties: {
                x: { type: 'number', minimum: 0, maximum: 100 },
                y: { type: 'number', minimum: 0, maximum: 100 }
              }
            }
          }
        }
      }
    }
  }
};

export function buildRegionPrompt(ctx: RegionGenerationContext) {
  return [
    {
      role: 'system' as const,
      content: `You are a cartographer AI tasked with defining the foundational regions of a new fantasy world.\n\nWorld Name: ${ctx.worldName}\nWorld Description: ${ctx.worldDescription}\n\nGuidelines:\n- Produce 2-5 distinct regions that define geography, climate, or culture.\n- Each region description should be 120-300 words and hint at history and story hooks.\n- Provide evocative, thematic names fitting the world.\n- Distribute regions across the 0-100 x/y map without overlap if possible.\n- Return results using the generate_regions function.`
    },
    {
      role: 'user' as const,
      content: 'Generate the list of regions.'
    }
  ];
}