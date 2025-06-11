import type { MapGenerationContext } from '../../../domain/ports';

interface PlannerCtx extends MapGenerationContext {
  ids: string[];
  coords: Array<{ x: number; y: number }>;
}

/**
 * JSON schema for the `plan_world_map` tool-call.
 */
export const WORLD_MAP_PLAN_SCHEMA = {
  name: 'plan_world_map',
  description: 'Plan a high-level world map by returning lightweight stubs (no descriptions).',
  parameters: {
    type: 'object',
    required: ['stubs'],
    properties: {
      stubs: {
        type: 'array',
        minItems: 8,
        maxItems: 15,
        items: {
          type: 'object',
          required: ['id', 'name', 'type', 'parent_location_id', 'relative_x', 'relative_y'],
          properties: {
            id: {
              type: 'string',
              description: 'Backend-provided UUID – MUST echo exactly.'
            },
            name: {
              type: 'string',
              description: 'Unique location name.'
            },
            type: {
              type: 'string',
              enum: ['region', 'city', 'landmark', 'wilderness']
            },
            parent_location_id: {
              type: ['string', 'null'],
              description: 'UUID of parent region; null for regions.'
            },
            relative_x: { type: 'number', minimum: 0, maximum: 100 },
            relative_y: { type: 'number', minimum: 0, maximum: 100 }
          }
        }
      }
    }
  },
  // `returns` mirrors the parameters so that runtime type validation is easy via Zod.
  returns: {
    type: 'object',
    required: ['stubs'],
    properties: {
      stubs: {
        type: 'array',
        items: {
          $ref: '#/parameters/properties/stubs/items'
        }
      }
    }
  }
} as const;

/**
 * Build the conversation messages for the planner step.
 */
export function buildPlannerPrompt(ctx: PlannerCtx) {
  const idCoordPairs = ctx.ids.map((id, i) => `• ${id} → (${ctx.coords[i].x.toFixed(1)}, ${ctx.coords[i].y.toFixed(1)})`).join('\n');

  return [
    {
      role: 'system' as const,
      content: `You are a strategic world-building assistant. Your task is to sketch the high-level map structure for a new fantasy world. Do NOT write prose descriptions – that will be done later.\n\nWorld Name: ${ctx.worldName}\nWorld Description: ${ctx.worldDescription}\n\nYou have already been assigned UUIDs and coordinates for each location. Use them exactly as provided. Do not invent additional locations. At least two locations must be of type 'region'.\n\nProvided identifiers and coordinates:\n${idCoordPairs}`
    },
    {
      role: 'user' as const,
      content: `Return the stubs array with exactly ${ctx.ids.length} items.`
    }
  ];
}