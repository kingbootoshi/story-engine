import type { LocationGenerationContext } from '../../../domain/ports';

/**
 * Schema for wilderness generation function
 */
export const WILDERNESS_GENERATION_SCHEMA = {
  name: 'generate_wilderness',
  description: 'Generate 1-2 wilderness areas within a specific region',
  parameters: {
    type: 'object',
    required: ['wilderness'],
    properties: {
      wilderness: {
        type: 'array',
        minItems: 1,
        maxItems: 2,
        items: {
          type: 'object',
          required: ['name', 'description', 'tags', 'relative_position'],
          properties: {
            name: {
              type: 'string',
              description: 'Unique name for the wilderness area'
            },
            description: {
              type: 'string',
              description: 'Rich description of the wilderness (100-200 words)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags describing wilderness features (e.g., "forest", "desert", "mountains", "dangerous")'
            },
            relative_position: {
              type: 'object',
              required: ['x', 'y'],
              properties: {
                x: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  description: 'X coordinate within the region (0-100 scale)'
                },
                y: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  description: 'Y coordinate within the region (0-100 scale)'
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
 * Build messages for wilderness generation
 */
export function buildWildernessGenerationPrompt(context: LocationGenerationContext) {
  const existingList = context.existingLocationsInRegion.length > 0
    ? `\nExisting locations in this region:\n${context.existingLocationsInRegion.map(
        loc => `- ${loc.name} (${loc.type}) at [${loc.relative_position.x}, ${loc.relative_position.y}]`
      ).join('\n')}`
    : '';

  return [
    {
      role: 'system' as const,
      content: `You are a world-building expert creating wilderness areas for a specific region. Your task is to generate 1-2 wilderness areas that provide natural barriers, resources, and adventure opportunities.

World Name: ${context.worldName}
World Description: ${context.worldDescription}

Region: ${context.regionName}
Region Description: ${context.regionDescription}
Region Tags: ${context.regionTags.join(', ')}${existingList}

Guidelines:
1. Generate 1-2 significant wilderness areas for this region
2. Wilderness types to consider:
   - Dense forests or jungles
   - Mountain ranges or peaks
   - Vast deserts or wastelands
   - Swamps or marshlands
   - Tundra or frozen wastes
3. Each wilderness should serve multiple purposes:
   - Natural barriers between settlements
   - Sources of resources or danger
   - Habitat for creatures or monsters
   - Settings for adventures
4. Create descriptive names that evoke the area's character
5. Write rich descriptions (100-200 words) that establish:
   - The terrain and climate
   - Natural hazards or challenges
   - Resources or treasures that might be found
   - Creatures or inhabitants (if any)
   - Atmosphere and feeling
6. Use descriptive tags for gameplay reference
7. Place wilderness areas logically:
   - Between or around settlements
   - In geographically appropriate locations
   - Consider how they shape travel and trade
8. Make them large enough to matter but not dominate the region

Remember:
- Each wilderness must have a unique name
- Wilderness areas should feel wild and untamed
- They should present both opportunities and challenges
- Balance danger with the possibility of reward`
    },
    {
      role: 'user' as const,
      content: 'Generate wilderness areas for this region.'
    }
  ];
}