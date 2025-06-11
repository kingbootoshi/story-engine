import type { CityGenerationContext } from '../../../domain/ports';

export const CITY_GENERATION_SCHEMA = {
  name: 'generate_cities',
  description: 'Generate 3-5 cities distributed across the regions',
  parameters: {
    type: 'object',
    required: ['cities'],
    properties: {
      cities: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'object',
          required: ['name', 'description', 'tags', 'relative_position', 'parent_region_name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            parent_region_name: { type: 'string' },
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

export function buildCityPrompt(ctx: CityGenerationContext) {
  const regionList = ctx.regions.map(r => r.name).join(', ');
  return [
    {
      role: 'system' as const,
      content: `Design the primary settlements of the world.\nWorld: ${ctx.worldName}\nRegions: ${regionList}\nGuidelines:\n- Produce 3-5 cities spread across the regions.\n- Ensure logical placement (trade hubs near resources, capitals near landmarks, etc.).\n- Descriptions 100-200 words.\n- Use generate_cities function.`
    },
    { role: 'user' as const, content: 'Generate the list of cities.' }
  ];
}