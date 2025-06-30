import type { IndividualLocationMutationContext } from '../../../domain/ports';

/**
 * Schema for individual location mutation function
 */
export const INDIVIDUAL_LOCATION_MUTATION_SCHEMA = {
  name: 'mutate_individual_location',
  description: 'Determine how a specific location changes in response to story events',
  parameters: {
    type: 'object',
    required: [],
    properties: {
      newStatus: {
        type: 'string',
        enum: ['thriving', 'stable', 'declining', 'ruined', 'abandoned', 'lost'],
        description: 'New status for the location (only if status should change)'
      },
      descriptionAppend: {
        type: 'string',
        description: 'Text to append to location description (1-2 sentences max)'
      },
      historicalEvent: {
        type: 'string',
        description: 'Historical event to record for this location'
      }
    }
  }
};

/**
 * Build messages for individual location mutation
 */
export function buildIndividualLocationMutationPrompt(context: IndividualLocationMutationContext) {
  const recentEvents = context.location.historical_events
    .slice(-3)
    .map(e => `- ${e.event} (${e.timestamp})`)
    .join('\n');

  return [
    {
      role: 'system' as const,
      content: `You are determining how a specific location changes in response to story events.

Location Details:
- Name: ${context.location.name}
- Type: ${context.location.type}
- Current Status: ${context.location.status}
- Tags: ${context.location.tags.join(', ')}

Current Description:
${context.location.description}

${recentEvents ? `Recent Historical Events:\n${recentEvents}` : 'No recent historical events'}

Status Progression Rules:
- thriving → stable → declining → ruined → abandoned → lost
- Status can skip steps for dramatic events
- Status rarely improves without explicit positive events
- Consider the narrative weight of status changes

Update Guidelines:
- newStatus: Only change if the events warrant it
- descriptionAppend: Add 1-2 sentences of new detail (optional)
- historicalEvent: Record the key event affecting this location

Be specific and grounded in the narrative context.`
    },
    {
      role: 'user' as const,
      content: `This location is reacting because: ${context.reactionReason}

Story Beat:
${context.beatDirectives}

Emergent Storylines: ${context.emergentStorylines.join(', ')}

How should ${context.location.name} change in response to these events?`
    }
  ];
}