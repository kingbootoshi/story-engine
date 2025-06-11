import type { LandmarkGenerationContext } from '../../../domain/ports';

export const LANDMARK_GENERATION_SCHEMA = {
  name: 'generate_landmarks',
  description: 'Generate 2-4 significant landmarks across the world',
  parameters: {
    type: 'object',
    required: ['landmarks'],
    properties: {
      landmarks: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: {
          type: 'object',
          required: ['name', 'description', 'tags', 'relative_position', 'parent_region_name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            parent_region_name: { type: 'string', description: 'Region that hosts the landmark' },
            tags: { type: 'array', items: { type: 'string' } },
            relative_position: {
              type: 'object', required: ['x', 'y'], properties: {
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

export function buildLandmarkPrompt(ctx: LandmarkGenerationContext) {
  const regionList = ctx.regions.map(r => r.name).join(', ');

  return [
    {
      role: 'system' as const,
      content: `Craft unique landmarks that enrich the world's lore.\nWorld: ${ctx.worldName}\nRegions available: ${regionList}\nGuidelines:\n- Provide 2-4 landmarks attached to regions or wilderness areas.\n- Blend natural wonders, ruins, magical sites, etc.\n- Write 100-200 word descriptions with story hooks.\n- Use generate_landmarks function.`
    },
    { role: 'user' as const, content: 'Generate landmarks.' }
  ];
}