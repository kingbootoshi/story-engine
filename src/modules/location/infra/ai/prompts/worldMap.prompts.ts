import type { MapGenerationContext } from '../../../domain/ports';

/**
 * Schema for world map generation function
 */
export const WORLD_MAP_GENERATION_SCHEMA = {
  name: 'generate_world_map',
  description: 'Generate a complete world map with 8-15 locations including regions, cities, landmarks, and wilderness areas',
  parameters: {
    type: 'object',
    required: ['locations'],
    properties: {
      locations: {
        type: 'array',
        minItems: 8,
        maxItems: 15,
        items: {
          type: 'object',
          required: ['name', 'type', 'description', 'tags', 'relative_position'],
          properties: {
            name: {
              type: 'string',
              description: 'Unique name for the location'
            },
            type: {
              type: 'string',
              enum: ['region', 'city', 'landmark', 'wilderness'],
              description: 'Type of location'
            },
            description: {
              type: 'string',
              description: 'Rich description of the location (100-300 words)'
            },
            parent_region_name: {
              type: 'string',
              description: 'Name of parent region (required for non-region locations)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags describing location features (e.g., "coastal", "fortified", "magical")'
            },
            relative_position: {
              type: 'object',
              required: ['x', 'y'],
              properties: {
                x: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  description: 'X coordinate on 0-100 scale'
                },
                y: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  description: 'Y coordinate on 0-100 scale'
                }
              }
            }
          }
        }
      },
      mapSvg: {
        type: 'string',
        description: 'Optional SVG markup for visual map representation'
      }
    }
  }
};

/**
 * Build messages for world map generation
 */
export function buildWorldMapPrompt(context: MapGenerationContext) {
  return [
    {
      role: 'system' as const,
      content: `You are a world-building expert creating the initial geographical layout for a new world. Your task is to generate a complete world map with 8-15 locations that form a cohesive and interesting setting.

World Name: ${context.worldName}
World Description: ${context.worldDescription}

Guidelines:
1. Create 2-3 major regions that define the world's geography
2. Place 3-5 cities distributed across regions
3. Add 2-4 significant landmarks (ruins, magical sites, natural wonders)
4. Include 1-3 wilderness areas (forests, deserts, mountains)
5. Ensure logical geographical relationships (cities near water/resources, etc.)
6. Create evocative names that fit the world's theme
7. Write rich descriptions (100-300 words) that hint at history and potential stories
8. Use tags to indicate location features for future reference
9. Distribute locations across the map (0-100 x/y coordinates)
10. Regions should not have parent_region_name (they are top-level)

Remember:
- Each location must have a unique name within the world
- Non-region locations must specify their parent_region_name
- Balance different location types for variety
- Consider how locations might interact in future stories`
    },
    {
      role: 'user' as const,
      content: 'Generate the initial world map with locations.'
    }
  ];
}