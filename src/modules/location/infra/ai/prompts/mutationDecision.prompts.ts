import type { MutationDecisionContext } from '../../../domain/ports';

/**
 * Schema for mutation decision function
 */
export const MUTATION_DECISION_SCHEMA = {
  name: 'decide_mutation',
  description: 'Analyze story beat and decide if any locations need to be mutated',
  parameters: {
    type: 'object',
    required: ['think', 'shouldMutate'],
    properties: {
      think: {
        type: 'string',
        description: 'Reasoning about whether the story beat affects any locations'
      },
      shouldMutate: {
        type: 'boolean',
        description: 'Whether locations should be mutated based on this beat'
      }
    }
  }
};

/**
 * Build messages for mutation decision
 */
export function buildMutationDecisionPrompt(context: MutationDecisionContext) {
  return [
    {
      role: 'system' as const,
      content: `You are analyzing a story beat to determine if it should cause any location mutations (status changes or description updates).

Location mutations should happen when:
- A location is directly affected by events (battles, disasters, prosperity)
- The status of a location would logically change (thriving → stable → declining → ruined)
- New details about a location emerge from the story

Location mutations should NOT happen when:
- The beat is purely character-focused with no location impact
- Events happen in unspecified or abstract locations
- The beat is about planning or intentions, not actual events

Be conservative - only recommend mutations for clear, direct impacts on specific locations.`
    },
    {
      role: 'user' as const,
      content: `Analyze this story beat:

Beat Directives: ${context.beatDirectives}

Emergent Storylines: ${context.emergentStorylines.join(', ')}

Should any locations be mutated based on these events?`
    }
  ];
}