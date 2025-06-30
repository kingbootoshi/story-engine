import { injectable } from 'tsyringe';
import type { ICharacterAI, CharacterGenerationContext, CharacterReactionContext, SpawnAnalysisContext } from '../../domain/ports';
import type { CharacterBatch, CharacterReaction, SpawnDecision } from '../../domain/schema';
import type { TrpcCtx } from '../../../../core/trpc/context';
import { 
  chat, 
  buildMetadata, 
  safeParseJSON, 
  extractToolCall, 
  retryWithBackoff,
  AIValidationError 
} from '../../../../core/ai';
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
import { CharacterBatchSchema, CharacterReactionSchema, SpawnDecisionSchema } from './schemas';
import { GENERATE_CHARACTERS_SCHEMA, EVALUATE_REACTION_SCHEMA, ANALYZE_SPAWN_SCHEMA } from './toolSchemas';

const logger = createLogger('character.ai');


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
    const promptId = 'generate_character_batch@v1';
    const contextData = {
      worldId: context.worldId,
      factionId: context.factionId,
      targetCount: context.targetCount,
      correlation: trace.reqId
    };

    logger.info('Generating character batch', contextData);

    try {
      const userPrompt = buildGenerateCharactersUserPrompt(
        context.worldTheme,
        context.targetCount,
        context.factionName && context.factionIdeology ? {
          name: context.factionName,
          ideology: context.factionIdeology
        } : undefined,
        context.availableLocations.map(l => l.name)
      );

      const completion = await retryWithBackoff(
        () => chat({
          messages: [
            { role: 'system', content: GENERATE_CHARACTERS_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          tools: [GENERATE_CHARACTERS_SCHEMA],
          tool_choice: { type: 'function', function: { name: 'generate_characters' } },
          temperature: 0.8,
          metadata: buildMetadata(this.MODULE, promptId, trace.user?.id || 'anonymous', {
            correlation: trace.reqId,
            world_id: context.worldId,
            faction_id: context.factionId,
            target_count: context.targetCount
          })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(
        completion,
        'generate_characters',
        contextData
      );

      const parsedData = safeParseJSON(
        toolCall.function.arguments,
        contextData
      );

      const validationResult = CharacterBatchSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(
          validationResult.error,
          parsedData,
          contextData
        );
      }

      logger.info('Character batch generated successfully', {
        ...contextData,
        characterCount: validationResult.data.characters.length
      });

      return validationResult.data.characters.map(char => ({
        ...char,
        faction_id: context.factionId
      }));
    } catch (error) {
      logger.error('Failed to generate character batch', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }

  async evaluateCharacterReaction(
    context: CharacterReactionContext,
    trace: TrpcCtx
  ): Promise<CharacterReaction> {
    const promptId = 'evaluate_character_reaction@v1';
    const contextData = {
      characterId: context.character.id,
      beatId: context.beat.beatId,
      correlation: trace.reqId
    };

    logger.debug('Evaluating character reaction to beat', contextData);

    try {
      const userPrompt = buildEvaluateBeatUserPrompt(
        context.character,
        context.beat,
        {
          faction_relations: context.world_context.faction_relations,
          available_locations: context.world_context.available_locations.map(l => l.name),
          available_factions: context.world_context.available_factions.map(f => f.name)
        }
      );

      const completion = await retryWithBackoff(
        () => chat({
          messages: [
            { role: 'system', content: EVALUATE_BEAT_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          tools: [EVALUATE_REACTION_SCHEMA],
          tool_choice: { type: 'function', function: { name: 'evaluate_reaction' } },
          temperature: 0.7,
          metadata: buildMetadata(this.MODULE, promptId, trace.user?.id || 'anonymous', {
            correlation: trace.reqId,
            character_id: context.character.id,
            beat_id: context.beat.beatId,
            beat_index: context.beat.beatIndex
          })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(
        completion,
        'evaluate_reaction',
        contextData
      );

      const parsedData = safeParseJSON(
        toolCall.function.arguments,
        contextData
      );

      const validationResult = CharacterReactionSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(
          validationResult.error,
          parsedData,
          contextData
        );
      }

      const result = validationResult.data;
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

      logger.info('Character reaction evaluated successfully', {
        ...contextData,
        affected: reaction.affected,
        dies: reaction.changes.dies
      });

      return reaction;
    } catch (error) {
      logger.error('Failed to evaluate character reaction', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }

  async analyzeSpawnNeed(
    context: SpawnAnalysisContext,
    trace: TrpcCtx
  ): Promise<SpawnDecision> {
    const promptId = 'analyze_spawn_need@v1';
    const contextData = {
      worldTheme: context.world_theme,
      currentCount: context.current_character_count,
      correlation: trace.reqId
    };

    logger.info('Analyzing beat for character spawn needs', contextData);

    try {
      const userPrompt = buildSpawnCharactersUserPrompt(
        context.beat,
        context.world_theme,
        context.existing_factions,
        context.existing_locations,
        context.current_character_count
      );

      const completion = await retryWithBackoff(
        () => chat({
          messages: [
            { role: 'system', content: SPAWN_CHARACTERS_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          tools: [ANALYZE_SPAWN_SCHEMA],
          tool_choice: { type: 'function', function: { name: 'analyze_spawn' } },
          temperature: 0.7,
          metadata: buildMetadata(this.MODULE, promptId, trace.user?.id || 'anonymous', {
            correlation: trace.reqId,
            current_character_count: context.current_character_count
          })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(
        completion,
        'analyze_spawn',
        contextData
      );

      const parsedData = safeParseJSON(
        toolCall.function.arguments,
        contextData
      );

      const validationResult = SpawnDecisionSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(
          validationResult.error,
          parsedData,
          contextData
        );
      }

      const result = validationResult.data;
      const spawnDecision = {
        spawn_characters: result.spawn_characters,
        new_characters: result.new_characters.map(char => ({
          ...char,
          faction_id: char.faction_name ? 
            context.existing_factions.find(f => f.includes(char.faction_name!))?.split(':')[0] || null : 
            null
        }))
      };

      logger.info('Spawn analysis completed', {
        ...contextData,
        spawnCharacters: spawnDecision.spawn_characters,
        newCharacterCount: spawnDecision.new_characters.length
      });

      return spawnDecision;
    } catch (error) {
      logger.error('Failed to analyze spawn needs', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }
}