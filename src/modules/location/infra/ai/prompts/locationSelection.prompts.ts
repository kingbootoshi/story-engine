import type { LocationSelectionContext } from '../../../domain/ports';

/**
 * Schema for location selection function
 */
export const LOCATION_SELECTION_SCHEMA = {
  name: 'select_reacting_locations',
  description: 'Identify which locations should react to the story beat and why',
  parameters: {
    type: 'object',
    required: ['reactions'],
    properties: {
      reactions: {
        type: 'array',
        description: 'List of locations that should react to this beat',
        items: {
          type: 'object',
          required: ['locationId', 'locationName', 'reason'],
          properties: {
            locationId: {
              type: 'string',
              description: 'UUID of the location that should react'
            },
            locationName: {
              type: 'string',
              description: 'Name of the location for clarity'
            },
            reason: {
              type: 'string',
              description: 'Specific reason why this location is reacting to the beat'
            }
          }
        }
      }
    }
  }
};

/**
 * Build messages for location selection
 */
export function buildLocationSelectionPrompt(context: LocationSelectionContext) {
  const locationsList = context.currentLocations
    .map(loc => `- [${loc.id}] ${loc.name} (${loc.type}, ${loc.status}): ${loc.description}`)
    .join('\n');

  return [
    {
      role: 'system' as const,
      content: `You are analyzing a story beat to identify which locations should react to the events.

Consider how locations might react when:
- They are directly mentioned or involved in the beat
- Events would logically affect them (e.g., nearby battles, trade disruptions)
- Characters take actions that would impact the location
- Natural or magical phenomena would affect the area
- Political or economic changes would ripple to the location

Be thoughtful but not overly conservative. Locations are living parts of the world that respond to change.

Current Locations:
${locationsList}`
    },
    {
      role: 'user' as const,
      content: `Analyze this story beat and identify which locations should react:

Beat Directives: ${context.beatDirectives}

Emergent Storylines: ${context.emergentStorylines.join(', ')}

For each location that should react, provide:
1. The location's UUID (from the list above)
2. The location's name (for clarity)
3. A specific reason why this location is reacting to these events

Return an empty array if truly no locations would be affected.`
    }
  ];
}