import { injectable } from 'tsyringe';
import { z } from 'zod';
import type { ICharacterAI, CharacterGenerationContext, CharacterReactionContext, SpawnAnalysisContext } from '../../domain/ports';
import type { CharacterBatch, CharacterReaction, SpawnDecision } from '../../domain/schema';
import type { TrpcCtx } from '../../../../core/trpc/context';
import { chat, buildMetadata } from '../../../../core/ai';
import { createLogger } from '../../../../core/infra/logger';
import {
  GENERATE_CHARACTERS_SYSTEM_PROMPT,
  buildGenerateCharactersUserPrompt
} from './prompts/generateCharacters.prompts';
import {
  EVALUATE_BEAT_SYSTEM_PROMPT,
  buildEvaluateBeatUserPrompt
} from './prompts/evaluateBeat.prompts';
import {
  SPAWN_CHARACTERS_SYSTEM_PROMPT,
  buildSpawnCharactersUserPrompt
} from './prompts/spawnCharacters.prompts';

const logger = createLogger('character.ai');

// ---------------------------------------------------------------------------
// 1) Zod schemas – used for runtime validation of the AI response
// ---------------------------------------------------------------------------
const CharacterBatchSchema = z.object({
  characters: z.array(z.object({
    name: z.string(),
    story_role: z.enum(['major', 'minor', 'wildcard', 'background']),
    faction_id: z.string().nullable(),
    personality_traits: z.array(z.string()),
    motivations: z.array(z.string()),
    description: z.string(),
    background: z.string(),
    spawn_location: z.string()
  }))
});

const CharacterReactionSchema = z.object({
  affected: z.boolean(),
  changes: z.object({
    dies: z.boolean(),
    new_memories: z.array(z.object({
      event_description: z.string(),
      emotional_impact: z.enum(['positive', 'negative', 'neutral']),
      importance: z.number().min(0).max(1),
    })),
    motivation_changes: z.object({
      add: z.array(z.string()),
      remove: z.array(z.string())
    }),
    location_name: z.string().nullable().optional(),
    faction_name: z.string().nullable().optional(),
    new_description: z.string().optional(),
    background_addition: z.string().nullable()
  }),
  world_event: z.object({
    emit: z.boolean(),
    description: z.string(),
    impact: z.enum(['minor', 'moderate', 'major'])
  }).nullable()
});

const SpawnDecisionSchema = z.object({
  spawn_characters: z.boolean(),
  new_characters: z.array(z.object({
    name: z.string(),
    story_role: z.enum(['major', 'minor', 'wildcard', 'background']),
    faction_name: z.string().nullable(),
    personality_traits: z.array(z.string()),
    motivations: z.array(z.string()),
    description: z.string(),
    background: z.string(),
    spawn_location: z.string()
  }))
});

// ---------------------------------------------------------------------------
// 2) JSON schemas – REQUIRED by OpenAI function-calling API (must be plain JSON
//    Schema objects, not Zod instances).  They mirror the Zod definitions above
//    but omit nullables for brevity where appropriate.
// ---------------------------------------------------------------------------

const GENERATE_CHARACTERS_SCHEMA = {
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

const EVALUATE_REACTION_SCHEMA = {
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

const ANALYZE_SPAWN_SCHEMA = {
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

@injectable()
export class CharacterAIAdapter implements ICharacterAI {
  /**
   * Name of the module – used in AI metadata for observability.
   * We no longer hard-code a model here; the `chat()` helper defaults to
   * whatever is configured in the global model registry.  Individual calls can
   * still override the model if needed.
   */
  private readonly MODULE = 'character';

  async generateCharacterBatch(
    context: CharacterGenerationContext,
    trace: TrpcCtx
  ): Promise<CharacterBatch[]> {
    logger.info('Generating character batch', {
      worldId: context.worldId,
      factionId: context.factionId,
      targetCount: context.targetCount,
      correlation: trace.reqId
    });

    const userPrompt = buildGenerateCharactersUserPrompt(
      context.worldTheme,
      context.targetCount,
      context.factionName && context.factionIdeology ? {
        name: context.factionName,
        ideology: context.factionIdeology
      } : undefined,
      context.availableLocations.map(l => l.name)
    );

    const completion = await chat({
      messages: [
        { role: 'system', content: GENERATE_CHARACTERS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      tools: [GENERATE_CHARACTERS_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'generate_characters' } },
      temperature: 0.8,
      metadata: buildMetadata(this.MODULE, 'generate_character_batch@v1', {
        correlation: trace.reqId,
        world_id: context.worldId,
        faction_id: context.factionId,
        target_count: context.targetCount
      })
    });

    const result = CharacterBatchSchema.parse(
      JSON.parse(completion.choices[0].message.tool_calls![0].function.arguments)
    );

    return result.characters.map(char => ({
      ...char,
      faction_id: context.factionId
    }));
  }

  async evaluateCharacterReaction(
    context: CharacterReactionContext,
    trace: TrpcCtx
  ): Promise<CharacterReaction> {
    logger.debug('Evaluating character reaction to beat', {
      characterId: context.character.id,
      beatId: context.beat.beatId,
      correlation: trace.reqId
    });

    const userPrompt = buildEvaluateBeatUserPrompt(
      context.character,
      context.beat,
      {
        faction_relations: context.world_context.faction_relations,
        available_locations: context.world_context.available_locations.map(l => l.name),
        available_factions: context.world_context.available_factions.map(f => f.name)
      }
    );

    const completion = await chat({
      messages: [
        { role: 'system', content: EVALUATE_BEAT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      tools: [EVALUATE_REACTION_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'evaluate_reaction' } },
      temperature: 0.7,
      metadata: buildMetadata(this.MODULE, 'evaluate_character_reaction@v1', {
        correlation: trace.reqId,
        character_id: context.character.id,
        beat_id: context.beat.beatId,
        beat_index: context.beat.beatIndex
      })
    });

    const result = CharacterReactionSchema.parse(
      JSON.parse(completion.choices[0].message.tool_calls![0].function.arguments)
    );

    const reaction: CharacterReaction = {
      affected: result.affected,
      changes: {
        dies: result.changes.dies,
        new_memories: result.changes.new_memories.map(m => ({
          ...m,
          timestamp: new Date().toISOString(),
          beat_index: context.beat.beatIndex
        })),
        motivation_changes: result.changes.motivation_changes,
        location_id: result.changes.location_name ? 
          context.world_context.available_locations.find(l => l.name === result.changes.location_name)?.id || null : 
          undefined,
        faction_id: result.changes.faction_name ? 
          context.world_context.available_factions.find(f => f.name === result.changes.faction_name)?.id || null : 
          undefined,
        new_description: result.changes.new_description,
        background_addition: result.changes.background_addition
      },
      world_event: result.world_event
    };

    return reaction;
  }

  async analyzeSpawnNeed(
    context: SpawnAnalysisContext,
    trace: TrpcCtx
  ): Promise<SpawnDecision> {
    logger.info('Analyzing beat for character spawn needs', {
      worldTheme: context.world_theme,
      currentCount: context.current_character_count,
      correlation: trace.reqId
    });

    const userPrompt = buildSpawnCharactersUserPrompt(
      context.beat,
      context.world_theme,
      context.existing_factions,
      context.existing_locations,
      context.current_character_count
    );

    const completion = await chat({
      messages: [
        { role: 'system', content: SPAWN_CHARACTERS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      tools: [ANALYZE_SPAWN_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'analyze_spawn' } },
      temperature: 0.7,
      metadata: buildMetadata(this.MODULE, 'analyze_spawn_need@v1', {
        correlation: trace.reqId,
        current_character_count: context.current_character_count
      })
    });

    const result = SpawnDecisionSchema.parse(
      JSON.parse(completion.choices[0].message.tool_calls![0].function.arguments)
    );

    return {
      spawn_characters: result.spawn_characters,
      new_characters: result.new_characters.map(char => ({
        ...char,
        faction_id: char.faction_name ? 
          context.existing_factions.find(f => f.includes(char.faction_name!))?.split(':')[0] || null : 
          null
      }))
    };
  }
}