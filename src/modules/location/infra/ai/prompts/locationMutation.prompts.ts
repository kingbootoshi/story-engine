import type { LocationMutationContext } from '../../../domain/ports';

/**
 * Schema for location mutation function
 */
export const LOCATION_MUTATION_SCHEMA = {
  name: 'mutate_locations',
  description: 'Determine location status changes and updates based on story beat',
  parameters: {
    type: 'object',
    required: ['updates'],
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
      content: `You are mutating locations based on story events. Focus only on updating existing locations that are directly affected by the narrative.

Current Locations:
${locationsList}

Status Progression Rules:
- thriving → stable → declining → ruined → abandoned → lost
- Status can skip steps for dramatic events
- Status rarely improves without explicit positive events
- "lost" locations cannot be updated (they're forgotten)

Update Guidelines:
- Only update locations directly affected by the beat
- Provide clear narrative reasons for changes
- Status changes should feel earned by the story
- Description appends should be 1-2 sentences max
- Be specific about which locations are affected and why`
    },
    {
      role: 'user' as const,
      content: `Based on these story events, which locations need to be updated?

Beat Directives: ${context.beatDirectives}

Emergent Storylines: ${context.emergentStorylines.join(', ')}

Identify specific locations from the list above that are affected and how they should change.`
    }
  ];
}