import type { LocationGenerationContext } from '../../../domain/ports';

/**
 * Schema for landmark generation function
 */
export const LANDMARK_GENERATION_SCHEMA = {
  name: 'generate_landmarks',
  description: 'Generate 1-3 significant landmarks within a specific region',
  parameters: {
    type: 'object',
    required: ['landmarks'],
    properties: {
      landmarks: {
        type: 'array',
        minItems: 1,
        maxItems: 3,
        items: {
          type: 'object',
          required: ['name', 'description', 'tags', 'relative_position'],
          properties: {
            name: {
              type: 'string',
              description: 'Unique name for the landmark'
            },
            description: {
              type: 'string',
              description: 'Rich description of the landmark (100-200 words)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags describing landmark features (e.g., "ancient", "magical", "ruins", "natural-wonder")'
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
 * Build messages for landmark generation
 */
export function buildLandmarkGenerationPrompt(context: LocationGenerationContext) {
  const existingList = context.existingLocationsInRegion.length > 0
    ? `\nExisting locations in this region:\n${context.existingLocationsInRegion.map(
        loc => `- ${loc.name} (${loc.type}) at [${loc.relative_position.x}, ${loc.relative_position.y}]`
      ).join('\n')}`
    : '';

  return [
    {
      role: 'system' as const,
      content: `You are a world-building expert creating significant landmarks for a specific region. Your task is to generate 1-3 landmarks that add mystery, history, and adventure potential to the region.

World Name: ${context.worldName}
World Description: ${context.worldDescription}

Region: ${context.regionName}
Region Description: ${context.regionDescription}
Region Tags: ${context.regionTags.join(', ')}${existingList}

Guidelines:
1. Generate 1-3 significant landmarks that enhance the region's character
2. Landmark types to consider:
   - Ancient ruins or abandoned structures
   - Natural wonders (unique geological features, mystical groves)
   - Magical sites or anomalies
   - Historical battlegrounds or monuments
   - Mysterious dungeons or caves
3. Each landmark should hint at larger stories:
   - Lost civilizations
   - Historical events
   - Magical phenomena
   - Hidden treasures or dangers
4. Create evocative names that suggest history or mystery
5. Write rich descriptions (100-200 words) that establish:
   - The landmark's appearance and scale
   - Its historical or mystical significance
   - Current state and any dangers
   - Rumors or legends associated with it
6. Use descriptive tags for gameplay reference
7. Place landmarks in interesting but logical locations:
   - Away from major population centers
   - In geographically significant spots
   - Consider accessibility vs. remoteness
8. Avoid placing landmarks too close to existing locations

Remember:
- Each landmark must have a unique name
- Landmarks should feel ancient, mysterious, or significant
- They should invite exploration and adventure
- Balance accessibility with the sense of discovery`
    },
    {
      role: 'user' as const,
      content: 'Generate landmarks for this region.'
    }
  ];
}