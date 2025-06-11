import type { WildernessGenerationContext } from '../../../domain/ports';

export const WILDERNESS_GENERATION_SCHEMA = {
  name: 'generate_wilderness',
  description: 'Generate wilderness areas for each region (max 1 per region)',
  parameters: {
    type: 'object',
    required: ['wilderness'],
    properties: {
      wilderness: {
        type: 'array',
        minItems: 0,
        maxItems: 5,
        items: {
          type: 'object',
          required: ['name', 'description', 'tags', 'relative_position', 'parent_region_name'],
          properties: {
            name: { type: 'string', description: 'Name of wilderness area' },
            description: { type: 'string', description: 'Description (100-250 words)' },
            parent_region_name: { type: 'string', description: 'Name of parent region' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Feature tags' },
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

export function buildWildernessPrompt(ctx: WildernessGenerationContext) {
  const regionList = ctx.regions.map(r => `- ${r.name}`).join('\n');

  return [
    {
      role: 'system' as const,
      content: `You are designing untamed wilderness areas for the world.\nWorld: ${ctx.worldName}\nExisting Regions:\n${regionList}\nGuidelines:\n- Each region may have at most ONE wilderness (some may have none).\n- Wilderness types: forest, desert, jungle, swamp, mountains, etc.\n- Provide evocative descriptions (100-250 words).\n- Use generate_wilderness function.`
    },
    { role: 'user' as const, content: 'Generate wilderness areas now.' }
  ];
}