import { injectable } from 'tsyringe';
import { chat, buildMetadata } from '../../../../core/ai';
import { createLogger } from '../../../../core/infra/logger';
import type { ICharacterAI } from '../../domain/ports';
import type { RelationshipType } from '../../domain/schema';
import { 
  GENERATE_FACTION_CHARACTERS_SYSTEM_PROMPT, 
  buildGenerateFactionCharactersUserPrompt,
  GENERATE_BEAT_CHARACTERS_SYSTEM_PROMPT,
  buildGenerateBeatCharactersUserPrompt
} from './prompts/generateCharacters.prompts';
import { 
  UPDATE_CHARACTER_GOALS_SYSTEM_PROMPT, 
  buildUpdateCharacterGoalsUserPrompt 
} from './prompts/updateGoals.prompts';
import { 
  EVALUATE_RELATIONSHIPS_SYSTEM_PROMPT, 
  buildEvaluateRelationshipsUserPrompt,
  ENRICH_CHARACTER_HISTORY_SYSTEM_PROMPT,
  buildEnrichCharacterHistoryUserPrompt
} from './prompts/evaluateRelationships.prompts';

const log = createLogger('character.ai');

// AI Function Schemas
const GENERATE_FACTION_CHARACTERS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_faction_characters",
    description: "Generate initial characters for a faction",
    parameters: {
      type: "object",
      properties: {
        characters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              role: { type: "string" },
              personality_traits: {
                type: "array",
                items: { type: "string" },
                minItems: 3,
                maxItems: 5
              },
              core_beliefs: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 3
              },
              initial_goals: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 3
              },
              backstory: { type: "string" },
              relationships: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    target_role: { type: "string" },
                    type: {
                      type: "string",
                      enum: ["family", "romantic", "friendship", "rivalry", "professional", "nemesis"]
                    },
                    description: { type: "string" }
                  },
                  required: ["target_role", "type", "description"],
                  additionalProperties: false
                }
              }
            },
            required: ["name", "role", "personality_traits", "core_beliefs", "initial_goals", "backstory", "relationships"],
            additionalProperties: false
          },
          minItems: 3,
          maxItems: 5
        }
      },
      required: ["characters"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

const GENERATE_BEAT_CHARACTERS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_beat_characters",
    description: "Generate characters needed for a story beat",
    parameters: {
      type: "object",
      properties: {
        characters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["npc"] },
              story_role: {
                type: "string",
                enum: ["major", "minor", "wildcard", "background"]
              },
              faction_id: { type: ["string", "null"] },
              personality_traits: {
                type: "array",
                items: { type: "string" },
                minItems: 3,
                maxItems: 5
              },
              core_beliefs: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 3
              },
              initial_goals: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 3
              },
              backstory: { type: "string" }
            },
            required: ["name", "type", "story_role", "personality_traits", "core_beliefs", "initial_goals", "backstory"],
            additionalProperties: false
          }
        }
      },
      required: ["characters"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

const UPDATE_GOALS_SCHEMA = {
  type: "function",
  function: {
    name: "update_character_goals",
    description: "Update character goals based on events",
    parameters: {
      type: "object",
      properties: {
        new_goals: {
          type: "array",
          items: { type: "string" }
        },
        abandoned_goals: {
          type: "array",
          items: { type: "string" }
        },
        reason: { type: "string" }
      },
      required: ["new_goals", "abandoned_goals", "reason"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

const EVALUATE_RELATIONSHIPS_SCHEMA = {
  type: "function",
  function: {
    name: "evaluate_relationships",
    description: "Evaluate character relationship changes",
    parameters: {
      type: "object",
      properties: {
        new_relationships: {
          type: "array",
          items: {
            type: "object",
            properties: {
              character_id: { type: "string" },
              target_id: { type: "string" },
              type: {
                type: "string",
                enum: ["family", "romantic", "friendship", "rivalry", "professional", "nemesis"]
              },
              sentiment: {
                type: "number",
                minimum: -100,
                maximum: 100
              },
              reason: { type: "string" }
            },
            required: ["character_id", "target_id", "type", "sentiment", "reason"],
            additionalProperties: false
          }
        },
        changed_relationships: {
          type: "array",
          items: {
            type: "object",
            properties: {
              relation_id: { type: "string" },
              sentiment_change: { type: "number" },
              reason: { type: "string" }
            },
            required: ["relation_id", "sentiment_change", "reason"],
            additionalProperties: false
          }
        }
      },
      required: ["new_relationships", "changed_relationships"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

const ENRICH_HISTORY_SCHEMA = {
  type: "function",
  function: {
    name: "enrich_character_history",
    description: "Create rich backstory and descriptions",
    parameters: {
      type: "object",
      properties: {
        backstory: { type: "string" },
        appearance_description: { type: "string" },
        voice_description: { type: "string" },
        additional_traits: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["backstory", "appearance_description", "voice_description"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

@injectable()
export class CharacterAIAdapter implements ICharacterAI {
  async generateFactionCharacters(context: {
    worldId: string;
    worldTheme: string;
    factionId: string;
    factionName: string;
    factionIdeology: string;
    existingCharacters: string[];
  }): Promise<{
    characters: Array<{
      name: string;
      role: string;
      personality_traits: string[];
      core_beliefs: string[];
      initial_goals: string[];
      backstory: string;
      relationships: Array<{
        target_role: string;
        type: RelationshipType;
        description: string;
      }>;
    }>;
  }> {
    log.info('Generating faction characters', { 
      worldId: context.worldId,
      factionId: context.factionId,
      factionName: context.factionName 
    });

    const result = await chat({
      model: 'openai/gpt-4o-2024-11-20',
      messages: [
        { role: 'system', content: GENERATE_FACTION_CHARACTERS_SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: buildGenerateFactionCharactersUserPrompt(
            context.worldTheme,
            context.factionName,
            context.factionIdeology,
            context.existingCharacters
          )
        }
      ],
      tools: [GENERATE_FACTION_CHARACTERS_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'generate_faction_characters' } },
      ...buildMetadata({
        feature: 'character.generateFaction',
        context: {
          worldId: context.worldId,
          factionId: context.factionId
        }
      })
    });

    const toolCall = result.choices[0].message.tool_calls?.[0];
    if (!toolCall?.function.arguments) {
      throw new Error('No characters generated');
    }

    return JSON.parse(toolCall.function.arguments);
  }

  async generateBeatCharacters(context: {
    worldId: string;
    worldTheme: string;
    beatDirective: string;
    beatContext: string;
    existingCharacters: Array<{ name: string; role: string }>;
    factionContext?: Array<{ id: string; name: string; ideology: string }>;
  }): Promise<{
    characters: Array<{
      name: string;
      type: 'npc';
      story_role: string;
      faction_id?: string;
      personality_traits: string[];
      core_beliefs: string[];
      initial_goals: string[];
      backstory: string;
    }>;
  }> {
    log.info('Generating beat characters', { worldId: context.worldId });

    const result = await chat({
      model: 'openai/gpt-4o-2024-11-20',
      messages: [
        { role: 'system', content: GENERATE_BEAT_CHARACTERS_SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: buildGenerateBeatCharactersUserPrompt(
            context.worldTheme,
            context.beatDirective,
            context.beatContext,
            context.existingCharacters,
            context.factionContext
          )
        }
      ],
      tools: [GENERATE_BEAT_CHARACTERS_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'generate_beat_characters' } },
      ...buildMetadata({
        feature: 'character.generateBeat',
        context: { worldId: context.worldId }
      })
    });

    const toolCall = result.choices[0].message.tool_calls?.[0];
    if (!toolCall?.function.arguments) {
      throw new Error('No characters generated');
    }

    return JSON.parse(toolCall.function.arguments);
  }

  async updateCharacterGoals(context: {
    characterId: string;
    characterName: string;
    currentGoals: string[];
    personality: string[];
    beliefs: string[];
    recentEvents: string[];
    worldContext: string;
  }): Promise<{
    new_goals: string[];
    abandoned_goals: string[];
    reason: string;
  }> {
    log.info('Updating character goals', { 
      characterId: context.characterId,
      characterName: context.characterName 
    });

    const result = await chat({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: UPDATE_CHARACTER_GOALS_SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: buildUpdateCharacterGoalsUserPrompt(
            context.characterName,
            context.currentGoals,
            context.personality,
            context.beliefs,
            context.recentEvents,
            context.worldContext
          )
        }
      ],
      tools: [UPDATE_GOALS_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'update_character_goals' } },
      ...buildMetadata({
        feature: 'character.updateGoals',
        context: { characterId: context.characterId }
      })
    });

    const toolCall = result.choices[0].message.tool_calls?.[0];
    if (!toolCall?.function.arguments) {
      throw new Error('No goal updates generated');
    }

    return JSON.parse(toolCall.function.arguments);
  }

  async evaluateRelationships(context: {
    worldId: string;
    characters: Array<{
      id: string;
      name: string;
      faction_id?: string;
      personality: string[];
    }>;
    recentEvents: string[];
    existingRelations: Array<{
      char1: string;
      char2: string;
      type: string;
      sentiment: number;
    }>;
  }): Promise<{
    new_relationships: Array<{
      character_id: string;
      target_id: string;
      type: RelationshipType;
      sentiment: number;
      reason: string;
    }>;
    changed_relationships: Array<{
      relation_id: string;
      sentiment_change: number;
      reason: string;
    }>;
  }> {
    log.info('Evaluating character relationships', { worldId: context.worldId });

    const result = await chat({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: EVALUATE_RELATIONSHIPS_SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: buildEvaluateRelationshipsUserPrompt(
            context.characters,
            context.recentEvents,
            context.existingRelations
          )
        }
      ],
      tools: [EVALUATE_RELATIONSHIPS_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'evaluate_relationships' } },
      ...buildMetadata({
        feature: 'character.evaluateRelationships',
        context: { worldId: context.worldId }
      })
    });

    const toolCall = result.choices[0].message.tool_calls?.[0];
    if (!toolCall?.function.arguments) {
      throw new Error('No relationship evaluations generated');
    }

    return JSON.parse(toolCall.function.arguments);
  }

  async enrichCharacterHistory(context: {
    characterId: string;
    name: string;
    role: string;
    faction?: string;
    worldTheme: string;
    worldHistory: string[];
  }): Promise<{
    backstory: string;
    appearance_description: string;
    voice_description: string;
    additional_traits?: string[];
  }> {
    log.info('Enriching character history', { 
      characterId: context.characterId,
      name: context.name 
    });

    const result = await chat({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: ENRICH_CHARACTER_HISTORY_SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: buildEnrichCharacterHistoryUserPrompt(
            context.name,
            context.role,
            context.faction,
            context.worldTheme,
            context.worldHistory
          )
        }
      ],
      tools: [ENRICH_HISTORY_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'enrich_character_history' } },
      ...buildMetadata({
        feature: 'character.enrichHistory',
        context: { characterId: context.characterId }
      })
    });

    const toolCall = result.choices[0].message.tool_calls?.[0];
    if (!toolCall?.function.arguments) {
      throw new Error('No character history generated');
    }

    return JSON.parse(toolCall.function.arguments);
  }
}