import type { LocationGenerationContext } from '../../../domain/ports';

/**
 * Schema for city generation function
 */
export const CITY_GENERATION_SCHEMA = {
  name: 'generate_cities',
  description: 'Generate 1-5 cities within a specific region',
  parameters: {
    type: 'object',
    required: ['cities'],
    properties: {
      cities: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'object',
          required: ['name', 'description', 'tags', 'relative_position'],
          properties: {
            name: {
              type: 'string',
              description: 'Unique name for the city'
            },
            description: {
              type: 'string',
              description: 'Rich description of the city (100-200 words)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags describing city features (e.g., "trade-hub", "fortified", "coastal", "capital")'
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
 * Build messages for city generation
 */
export function buildCityGenerationPrompt(context: LocationGenerationContext) {
  const existingList = context.existingLocationsInRegion.length > 0
    ? `\nExisting locations in this region:\n${context.existingLocationsInRegion.map(
        loc => `- ${loc.name} (${loc.type}) at [${loc.relative_position.x}, ${loc.relative_position.y}]`
      ).join('\n')}`
    : '';

  return [
    {
      role: 'system' as const,
      content: `You are a world-building expert creating cities for a specific region. Your task is to generate 1-5 cities that fit naturally within the region's geography and characteristics.

World Name: ${context.worldName}
World Description: ${context.worldDescription}

Region: ${context.regionName}
Region Description: ${context.regionDescription}
Region Tags: ${context.regionTags.join(', ')}${existingList}

Guidelines:
1. Generate 1-5 cities that make sense for this region
2. Consider the region's geography when placing cities:
   - Cities near water sources or trade routes
   - Strategic positions for defense
   - Access to natural resources
3. Vary city sizes and purposes:
   - Major trade centers
   - Fortified strongholds
   - Cultural or religious centers
   - Mining or industrial towns
4. Create names that fit both the world theme and regional character
5. Write rich descriptions (100-200 words) that establish:
   - The city's primary purpose or industry
   - Notable features or landmarks
   - Population character and culture
   - Current state (thriving, struggling, etc.)
6. Use descriptive tags for gameplay reference
7. Spread cities across the region (0-100 coordinates are within the region)
8. Avoid placing cities too close to existing locations

Remember:
- Each city must have a unique name
- Cities should feel like they belong in this specific region
- Consider how cities might interact with each other
- Balance variety with regional coherence`
    },
    {
      role: 'user' as const,
      content: 'Generate cities for this region.'
    }
  ];
}