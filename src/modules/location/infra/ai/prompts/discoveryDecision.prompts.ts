import type { DiscoveryDecisionContext } from '../../../domain/ports';

/**
 * Schema for discovery decision function
 */
export const DISCOVERY_DECISION_SCHEMA = {
  name: 'decide_discovery',
  description: 'Analyze story beat and decide if new locations should be discovered',
  parameters: {
    type: 'object',
    required: ['think', 'shouldDiscover'],
    properties: {
      think: {
        type: 'string',
        description: 'Reasoning about whether the story beat reveals new locations'
      },
      shouldDiscover: {
        type: 'boolean',
        description: 'Whether new locations should be discovered based on this beat'
      }
    }
  }
};

/**
 * Build messages for discovery decision
 */
export function buildDiscoveryDecisionPrompt(context: DiscoveryDecisionContext) {
  return [
    {
      role: 'system' as const,
      content: `You are analyzing a story beat to determine if it should reveal any new locations.

New locations should be discovered when:
- Characters explicitly discover or mention a previously unknown place
- The narrative reveals hidden or secret locations
- Exploration or travel leads to new areas
- Events create new locations (e.g., a crater from a meteor)

New locations should NOT be discovered when:
- The beat only references existing known locations
- Locations are mentioned in passing without significance
- The focus is on character development or dialogue
- The beat is about past events or memories

Be conservative - only recommend discoveries for clearly revealed new locations that are important to the narrative.`
    },
    {
      role: 'user' as const,
      content: `Analyze this story beat:

Beat Directives: ${context.beatDirectives}

Emergent Storylines: ${context.emergentStorylines.join(', ')}

Should any new locations be discovered based on these events?`
    }
  ];
}