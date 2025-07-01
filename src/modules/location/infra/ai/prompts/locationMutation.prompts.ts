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
    .map(loc => `- [${loc.id}] ${loc.name} (${loc.status}): ${loc.description}`)
    .join('\n');

  return [
    {
      role: 'system' as const,
      content: `You are mutating locations based on story events. Only update locations DIRECTLY affected by the narrative.

EXAMPLE OUTPUT:
{
  "updates": [
    {
      "locationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "newStatus": "ruined",
      "descriptionAppend": "The once-proud towers now lie in smoking rubble, victims of the dragon's wrath.",
      "reason": "Dragon attack destroyed the city's defenses"
    },
    {
      "locationId": "x9y8z7w6-v5u4-3210-zyxw-vu9876543210",
      "newStatus": "declining",
      "reason": "Trade routes disrupted by the conflict, causing economic hardship"
    }
  ]
}

STATUS PROGRESSION RULES:
✓ thriving → stable → declining → ruined → abandoned → lost
✓ Status can skip steps for dramatic events (thriving → ruined)
✓ Status rarely improves without explicit positive events
✓ "lost" locations cannot be updated (they're forgotten by the world)

UPDATE GUIDELINES:
✓ Use the exact UUID from the location list (in square brackets)
✓ Only update locations mentioned in or affected by the beat
✓ newStatus is optional - only include if status changes
✓ descriptionAppend is optional - only for significant new details (1-2 sentences max)
✓ reason is REQUIRED - explain the narrative cause

Current Locations (format: [UUID] Name (status): description):
${locationsList}`
    },
    {
      role: 'user' as const,
      content: `Based on these story events, which locations need updates?

Beat Directives: ${context.beatDirectives}
Emergent Storylines: ${context.emergentStorylines.join(', ')}

Analyze the beat and identify ONLY locations that are directly affected. For each affected location:
1. Copy the exact UUID from the square brackets above
2. Determine if the status should change
3. Add description details only if something significant happened
4. Provide a clear narrative reason

Return an empty updates array if no locations are affected.`
    }
  ];
}