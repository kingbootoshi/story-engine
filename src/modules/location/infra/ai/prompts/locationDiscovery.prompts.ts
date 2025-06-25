import type { LocationMutationContext } from '../../../domain/ports';

/**
 * Schema for location discovery function
 */
export const LOCATION_DISCOVERY_SCHEMA = {
  name: 'discover_locations',
  description: 'Generate new location discoveries based on story beat',
  parameters: {
    type: 'object',
    required: ['discoveries'],
    properties: {
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
 * Build messages for location discovery
 */
export function buildLocationDiscoveryPrompt(context: LocationMutationContext) {
  const regionNames = context.currentLocations
    .filter(loc => loc.status !== 'lost')
    .filter(loc => loc.name.includes('region') || loc.description.toLowerCase().includes('region'))
    .map(loc => loc.name)
    .slice(0, 5);

  return [
    {
      role: 'system' as const,
      content: `You are discovering new locations based on story events. Generate locations that are directly revealed or created by the narrative.

Available Regions: ${regionNames.join(', ')}

Discovery Guidelines:
- Generate 1-2 locations maximum
- Each discovery must be directly tied to the story beat
- Locations should feel like natural reveals, not random additions
- Include vivid descriptions that fit the world's tone
- Assign locations to appropriate parent regions
- Cannot create new regions (only cities, landmarks, wilderness)

Location Types:
- city: Settlements, towns, outposts
- landmark: Notable features, monuments, ruins
- wilderness: Natural areas, dangerous zones, mystical places

Make discoveries feel earned and significant to the narrative.`
    },
    {
      role: 'user' as const,
      content: `Based on these story events, what new locations are discovered?

Beat Directives: ${context.beatDirectives}

Emergent Storylines: ${context.emergentStorylines.join(', ')}

Generate new locations that are revealed or created by these events.`
    }
  ];
}