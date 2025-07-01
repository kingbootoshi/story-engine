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
      content: `You are a world-building expert creating the major geographical regions for a new world.

CRITICAL: You MUST generate regions with this EXACT JSON structure:

EXAMPLE OUTPUT (this is what your response should look like):
{
  "regions": [
    {
      "name": "The Shattered Coast",
      "description": "A treacherous coastline where ancient cliffs meet turbulent seas. The region is dotted with fishing villages clinging to rocky outcrops, their inhabitants hardy folk who brave the dangerous waters for the abundant catch. Strange rock formations jut from the waves, remnants of a cataclysm that reshaped the land centuries ago. The constant storms and unpredictable tides make navigation perilous, but also hide numerous sea caves rumored to contain lost treasures.",
      "tags": ["coastal", "stormy", "fishing", "treacherous", "mysterious"],
      "relative_position": { "x": 15, "y": 40 }
    },
    {
      "name": "The Verdant Heartlands", 
      "description": "Rolling hills and fertile valleys stretch as far as the eye can see, crisscrossed by gentle rivers and dotted with prosperous farming communities. This is the breadbasket of the realm, where golden wheat fields wave in the warm breeze and orchards heavy with fruit line the well-maintained roads. Ancient oak groves mark the boundaries between settlements, their depths holding druidic circles and forgotten shrines. The region's prosperity makes it both a target for raiders and a center of political power.",
      "tags": ["fertile", "agricultural", "prosperous", "peaceful", "central"],
      "relative_position": { "x": 50, "y": 55 }
    }
  ]
}

FORMAT REQUIREMENTS:
✓ Generate 2-4 regions total
✓ Each region MUST have: name, description, tags (array), relative_position (with x,y)
✓ Description: 100-200 words of narrative detail (no bullet points)
✓ Tags: Array of 3-6 descriptive strings
✓ Coordinates: Numbers between 0-100 (spread regions across the map)

COMMON MISTAKES TO AVOID:
✗ Don't put tags inside the description text
✗ Don't use strings for coordinates (use numbers: 50 not "50")
✗ Don't make all regions clustered together
✗ Don't exceed 4 regions or generate less than 2`
    },
    {
      role: 'user' as const,
      content: `Generate the major regions for this world:

World Name: ${context.worldName}
World Description: ${context.worldDescription}

Create 2-4 distinct regions that:
- Represent different geographical areas (coast, mountains, plains, forests, deserts, etc.)
- Are spread across the map (use the full 0-100 coordinate range)
- Have unique characteristics that create natural story potential
- Feel cohesive with the world's theme

Remember to follow the exact JSON structure shown in the example above.`
    }
  ];
}