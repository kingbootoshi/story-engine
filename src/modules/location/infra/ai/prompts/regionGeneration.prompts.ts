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

IMPORTANT: You must return a JSON object with the following exact structure for each region:

{
  "name": "Region Name",
  "description": "A rich description of 100-200 words (NO tags in the description text)",
  "tags": ["tag1", "tag2", "tag3"],  // Array of descriptive string tags
  "relative_position": {
    "x": 50,  // Number between 0-100
    "y": 50   // Number between 0-100
  }
}

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
7. For the 'tags' field: Create an ARRAY of descriptive strings (e.g., ["coastal", "mountainous", "fertile"])
   - DO NOT include tags in the description text
   - Each region needs 3-6 relevant tags
8. For the 'relative_position' field: Provide x,y coordinates (0-100 scale)
   - x=0 is far west, x=100 is far east
   - y=0 is far north, y=100 is far south
   - Spread regions across the map
9. Consider how regions might interact (trade, conflict, isolation)

CRITICAL Requirements:
- Every region MUST have ALL four fields: name, description, tags (as array), relative_position (with x,y)
- Tags must be a separate array field, NOT text within the description
- Description should focus on narrative details, not list tags
- All coordinates must be numbers between 0 and 100`
    },
    {
      role: 'user' as const,
      content: 'Generate the major regions for this world. Remember to include all required fields (name, description, tags array, and relative_position with x,y coordinates) for each region.'
    }
  ];
}