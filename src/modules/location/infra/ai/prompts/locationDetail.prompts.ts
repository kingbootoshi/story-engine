import type { LocationStub } from '../../../domain/schema';

interface DetailInput {
  stub: LocationStub;
  worldName: string;
  worldDescription: string;
}

export const LOCATION_DETAIL_SCHEMA = {
  name: 'detail_location',
  description: 'Enrich a location stub with a vivid description and tags.',
  parameters: {
    type: 'object',
    required: ['description', 'tags'],
    properties: {
      description: {
        type: 'string',
        description: 'Markdown description of 100-300 words.'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 8,
        description: 'kebab-case tags, max 8.'
      }
    }
  },
  returns: {
    type: 'object',
    required: ['description', 'tags'],
    properties: {
      description: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } }
    }
  }
} as const;

export function buildLocationDetailPrompt(input: DetailInput) {
  return [
    {
      role: 'system' as const,
      content: `You are a creative writer adding rich narrative detail to a world map. Expand the stub into a captivating location description but keep it under 300 words.

World: ${input.worldName}
World Theme: ${input.worldDescription}

Location Stub:
- Name: ${input.stub.name}
- Type: ${input.stub.type}
- Parent ID: ${input.stub.parent_location_id ?? 'None'}
- Coordinates: (${input.stub.relative_x}, ${input.stub.relative_y})`
    },
    {
      role: 'user' as const,
      content: 'Write the description and return up to 8 thematic tags.'
    }
  ];
}