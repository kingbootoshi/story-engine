export const GENERATE_CHARACTERS_SCHEMA = {
  type: 'function',
  function: {
    name: 'generate_characters',
    description: 'Generate a batch of characters',
    parameters: {
      type: 'object',
      properties: {
        characters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              story_role: { type: 'string', enum: ['major', 'minor', 'wildcard', 'background'] },
              faction_id: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              personality_traits: { type: 'array', items: { type: 'string' } },
              motivations: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              background: { type: 'string' },
              spawn_location: { type: 'string' }
            },
            required: ['name', 'story_role', 'faction_id', 'personality_traits', 'motivations', 'description', 'background', 'spawn_location'],
            additionalProperties: false
          }
        }
      },
      required: ['characters'],
      additionalProperties: false
    },
    strict: true
  }
} as const;

export const EVALUATE_REACTION_SCHEMA = {
  type: 'function',
  function: {
    name: 'evaluate_reaction',
    description: 'Evaluate how a character reacts to a beat',
    parameters: {
      type: 'object',
      properties: {
        affected: { type: 'boolean' },
        changes: {
          type: 'object',
          properties: {
            dies: { type: 'boolean' },
            new_memories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  event_description: { type: 'string' },
                  emotional_impact: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                  importance: { type: 'number', minimum: 0, maximum: 1 }
                },
                required: ['event_description', 'emotional_impact', 'importance'],
                additionalProperties: false
              }
            },
            motivation_changes: {
              type: 'object',
              properties: {
                add: { type: 'array', items: { type: 'string' } },
                remove: { type: 'array', items: { type: 'string' } }
              },
              required: ['add', 'remove'],
              additionalProperties: false
            },
            location_name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            faction_name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            new_description: { type: 'string' },
            background_addition: { anyOf: [{ type: 'string' }, { type: 'null' }] }
          },
          required: ['dies', 'new_memories', 'motivation_changes', 'location_name', 'faction_name', 'new_description', 'background_addition'],
          additionalProperties: false
        },
        world_event: {
          anyOf: [
            { type: 'null' },
            {
              type: 'object',
              properties: {
                emit: { type: 'boolean' },
                description: { type: 'string' },
                impact: { type: 'string', enum: ['minor', 'moderate', 'major'] }
              },
              required: ['emit', 'description', 'impact'],
              additionalProperties: false
            }
          ]
        }
      },
      required: ['affected', 'changes', 'world_event'],
      additionalProperties: false
    },
    strict: true
  }
} as const;

export const ANALYZE_SPAWN_SCHEMA = {
  type: 'function',
  function: {
    name: 'analyze_spawn',
    description: 'Analyze if new characters should be spawned',
    parameters: {
      type: 'object',
      properties: {
        spawn_characters: { type: 'boolean' },
        new_characters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              story_role: { type: 'string', enum: ['major', 'minor', 'wildcard', 'background'] },
              faction_name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              personality_traits: { type: 'array', items: { type: 'string' } },
              motivations: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              background: { type: 'string' },
              spawn_location: { type: 'string' }
            },
            required: ['name', 'story_role', 'faction_name', 'personality_traits', 'motivations', 'description', 'background', 'spawn_location'],
            additionalProperties: false
          }
        }
      },
      required: ['spawn_characters', 'new_characters'],
      additionalProperties: false
    },
    strict: true
  }
} as const;

export const SELECT_AFFECTED_CHARACTERS_SCHEMA = {
  type: 'function',
  function: {
    name: 'select_affected_characters',
    description: 'Select which characters are affected by a story beat',
    parameters: {
      type: 'object',
      properties: {
        affected_characters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              character_name: { type: 'string' },
              reason: { type: 'string' }
            },
            required: ['character_name', 'reason'],
            additionalProperties: false
          }
        }
      },
      required: ['affected_characters'],
      additionalProperties: false
    },
    strict: true
  }
} as const;