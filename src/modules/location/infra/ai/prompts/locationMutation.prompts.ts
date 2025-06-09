import type { LocationMutationContext } from '../../../domain/ports';

/**
 * Schema for location mutation function
 */
export const LOCATION_MUTATION_SCHEMA = {
  name: 'mutate_locations',
  description: 'Analyze story beat and determine location status changes and new discoveries',
  parameters: {
    type: 'object',
    required: ['updates', 'discoveries'],
    properties: {
      updates: {
        type: 'array',
        items: {
          type: 'object',
          required: ['locationId', 'reason'],
          properties: {
            locationId: {
              type: 'string',
              description: 'ID of the location to update'
            },
            newStatus: {
              type: 'string',
              enum: ['thriving', 'stable', 'declining', 'ruined', 'abandoned', 'lost'],
              description: 'New status for the location (if changing)'
            },
            descriptionAppend: {
              type: 'string',
              description: 'Text to append to location description (if adding detail)'
            },
            reason: {
              type: 'string',
              description: 'Narrative reason for the change'
            }
          }
        }
      },
      discoveries: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'type', 'description', 'tags'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of newly discovered location'
            },
            type: {
              type: 'string',
              enum: ['city', 'landmark', 'wilderness'],
              description: 'Type of location (not region)'
            },
            description: {
              type: 'string',
              description: 'Description of the discovered location'
            },
            parentRegionName: {
              type: 'string',
              description: 'Name of the parent region'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags describing location features'
            }
          }
        }
      }
    }
  }
};

/**
 * Build messages for location mutation analysis
 */
export function buildLocationMutationPrompt(context: LocationMutationContext) {
  const locationsList = context.currentLocations
    .map(loc => `- ${loc.name} (${loc.status}): ${loc.description}`)
    .join('\n');

  return [
    {
      role: 'system' as const,
      content: `You are analyzing a story beat to determine its impact on world locations. Based on the narrative events, you will suggest location status changes and potentially discover new locations.

Current Locations:
${locationsList}

Status Progression Rules:
- thriving → stable → declining → ruined → abandoned → lost
- Status can skip steps for dramatic events
- Status rarely improves without explicit positive events
- "lost" locations cannot be updated (they're forgotten)

Discovery Guidelines:
- Only discover locations directly mentioned or strongly implied
- New discoveries should feel organic to the narrative
- Maximum 2 discoveries per beat
- Cannot discover new regions (only cities, landmarks, wilderness)

Update Guidelines:
- Only update locations directly affected by the beat
- Provide clear narrative reasons for changes
- Status changes should feel earned by the story
- Description appends should be 1-2 sentences max`
    },
    {
      role: 'user' as const,
      content: `Analyze this story beat and determine location impacts:

Beat Directives: ${context.beatDirectives}

Emergent Storylines: ${context.emergentStorylines.join(', ')}

What locations should be updated or discovered based on these events?`
    }
  ];
}