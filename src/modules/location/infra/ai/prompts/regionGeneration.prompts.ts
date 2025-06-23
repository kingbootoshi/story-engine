import type { RegionGenerationContext } from '../../../domain/ports';

/**
 * Schema for region generation function
 */
export const REGION_GENERATION_SCHEMA = {
  name: 'generate_regions',
  description: 'Generate 2-4 major regions that define the world geography',
  parameters: {
    type: 'object',
    required: ['regions'],
    properties: {
      regions: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: {
          type: 'object',
          required: ['name', 'description', 'tags', 'relative_position'],
          properties: {
            name: {
              type: 'string',
              description: 'Unique name for the region'
            },
            description: {
              type: 'string',
              description: 'Rich description of the region (100-200 words)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags describing region features (e.g., "coastal", "mountainous", "fertile")'
            },
            relative_position: {
              type: 'object',
              required: ['x', 'y'],
              properties: {
                x: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  description: 'X coordinate on world map (0-100 scale)'
                },
                y: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  description: 'Y coordinate on world map (0-100 scale)'
                }
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Build messages for region generation
 */
export function buildRegionGenerationPrompt(context: RegionGenerationContext) {
  return [
    {
      role: 'system' as const,
      content: `You are a world-building expert creating the major geographical regions for a new world. Your task is to generate 2-4 regions that define the world's geography and set the stage for diverse locations and stories.

World Name: ${context.worldName}
World Description: ${context.worldDescription}

Guidelines:
1. Create 2-4 major regions that represent distinct geographical areas
2. Each region should have unique characteristics that differentiate it from others
3. Consider natural boundaries (mountains, rivers, seas) between regions
4. Ensure regions are spread across the world map (use full 0-100 coordinate range)
5. Create evocative names that fit the world's theme
6. Write rich descriptions (100-200 words) that establish:
   - Physical geography and climate
   - Natural resources or notable features
   - General atmosphere and character
   - Hints at potential stories or conflicts
7. Use descriptive tags for future reference
8. Consider how regions might interact (trade, conflict, isolation)

Remember:
- Each region must have a unique name
- Regions should cover different parts of the map
- Balance variety with coherence to the world theme
- These regions will contain cities, landmarks, and wilderness areas`
    },
    {
      role: 'user' as const,
      content: 'Generate the major regions for this world.'
    }
  ];
}