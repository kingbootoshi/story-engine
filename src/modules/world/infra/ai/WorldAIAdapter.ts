import { injectable } from 'tsyringe';
import { 
  chat, 
  buildMetadata, 
  modelRegistry,
  safeParseJSON, 
  extractToolCall, 
  retryWithBackoff,
  AIValidationError 
} from '../../../../core/ai';
import { createLogger } from '../../../../core/infra/logger';
import type { WorldAI, AnchorContext, BeatContext, SummaryContext, AnchorDTO, BeatDTO } from '../../domain/ports';
import { ANCHOR_SYSTEM_PROMPT, buildAnchorUserPrompt } from './prompts/anchor.prompts';
import { DYNAMIC_BEAT_SYSTEM_PROMPT, buildDynamicBeatUserPrompt } from './prompts/dynamicBeat.prompts';
import { ARC_SUMMARY_SYSTEM_PROMPT, buildArcSummaryUserPrompt } from './prompts/arcSummary.prompts';
import { SAVE_THE_CAT_BEATS } from '../../../../shared/story/saveTheCat';
import { WorldArcAnchorsResponseSchema, DynamicWorldBeatResponseSchema, ArcSummaryResponseSchema } from './schemas';
import { WORLD_ARC_ANCHORS_SCHEMA, DYNAMIC_WORLD_BEAT_SCHEMA, ARC_SUMMARY_SCHEMA } from './toolSchemas';

const log = createLogger('world.ai');


@injectable()
export class WorldAIAdapter implements WorldAI {
  private readonly MODULE = 'world';

  async generateAnchors(ctx: AnchorContext): Promise<{ anchors: AnchorDTO[]; arcDetailedDescription: string }> {
    const promptId = 'generate_world_arc_anchors';
    const contextData = { worldName: ctx.worldName };
    
    log.debug('AI call', { promptId, model: modelRegistry.getDefault() });
    
    try {
      const completion = await retryWithBackoff(
        () => chat({
          model: modelRegistry.getDefault(),
          messages: [
            { role: 'system', content: ANCHOR_SYSTEM_PROMPT },
            { role: 'user', content: buildAnchorUserPrompt(
              ctx.worldName,
              ctx.worldDescription,
              ctx.storyIdea,
              ctx.previousArcs,
              ctx.currentLocations,
              ctx.currentFactions,
              ctx.currentCharacters
            ) }
          ],
          tools: [WORLD_ARC_ANCHORS_SCHEMA],
          tool_choice: { type: 'function', function: { name: 'generate_world_arc_anchors' } },
          temperature: 0.9,
          max_tokens: 3000,
          metadata: buildMetadata(this.MODULE, promptId, ctx.userId, { world_name: ctx.worldName })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(
        completion,
        'generate_world_arc_anchors',
        contextData
      );

      const parsedData = safeParseJSON(
        toolCall.function.arguments,
        contextData
      );

      const validationResult = WorldArcAnchorsResponseSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(
          validationResult.error,
          parsedData,
          contextData
        );
      }

      const args = validationResult.data;
      log.info('AI success', { 
        ai: { 
          model: modelRegistry.getDefault(), 
          prompt_id: promptId, 
          usage: completion.usage 
        } 
      });
      log.info('Generated anchors', { 
        worldName: ctx.worldName, 
        anchorCount: args.anchors.length,
        descriptionLength: args.arcDetailedDescription?.length || 0 
      });
      
      return {
        anchors: args.anchors,
        arcDetailedDescription: args.arcDetailedDescription || ''
      };
    } catch (error) {
      log.error('Failed to generate anchors', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }

  async generateBeat(ctx: BeatContext): Promise<BeatDTO> {
    const promptId = 'generate_dynamic_world_beat';
    const contextData = { worldName: ctx.worldName, beatIndex: ctx.currentBeatIndex };
    
    log.debug('AI call', { promptId, model: modelRegistry.getDefault() });
    
    try {
      // Build summaries for previous beats and next anchor
      const previousBeatsSummary = ctx.previousBeats
        .map(b => `Beat ${b.beat_index}: ${b.beat_name} - ${b.description.substring(0, 200)}...`)
        .join('\n');
      const nextAnchorSummary = `Beat #${ctx.nextAnchor.beat_index} (${ctx.nextAnchor.beat_name}): ${ctx.nextAnchor.description}`;
      
      // Look up structural metadata for this beat
      const beatInfo = SAVE_THE_CAT_BEATS.find(b => b.index === ctx.currentBeatIndex);

      const completion = await retryWithBackoff(
        () => chat({
          model: modelRegistry.getDefault(),
          messages: [
            { role: 'system', content: DYNAMIC_BEAT_SYSTEM_PROMPT },
            { role: 'user', content: buildDynamicBeatUserPrompt(
              ctx.worldName,
              ctx.worldDescription,
              ctx.currentBeatIndex,
              beatInfo?.label ?? 'Unknown Beat',
              beatInfo?.purpose ?? 'Advance the story coherently.',
              previousBeatsSummary,
              nextAnchorSummary,
              ctx.recentEvents,
              ctx.arcDetailedDescription,
              ctx.currentLocations,
              ctx.currentFactions,
              ctx.currentCharacters
            )}
          ],
          tools: [DYNAMIC_WORLD_BEAT_SCHEMA],
          tool_choice: { type: 'function', function: { name: 'generate_dynamic_world_beat' } },
          temperature: 0.85,
          max_tokens: 2000,
          metadata: buildMetadata(this.MODULE, promptId, ctx.userId, {
            world_name: ctx.worldName,
            beat_index: ctx.currentBeatIndex
          })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(
        completion,
        'generate_dynamic_world_beat',
        contextData
      );

      const parsedData = safeParseJSON(
        toolCall.function.arguments,
        contextData
      );

      const validationResult = DynamicWorldBeatResponseSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(
          validationResult.error,
          parsedData,
          contextData
        );
      }

      const args = validationResult.data;
      log.info('AI success', { 
        ai: { 
          model: modelRegistry.getDefault(), 
          prompt_id: promptId, 
          usage: completion.usage 
        } 
      });
      log.info('Generated beat', { worldName: ctx.worldName, beatIndex: ctx.currentBeatIndex });
      
      return args;
    } catch (error) {
      log.error('Failed to generate beat', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }

  async summarizeArc(ctx: SummaryContext): Promise<string> {
    const promptId = 'generate_arc_summary';
    const contextData = { arcName: ctx.arcName };
    
    log.debug('AI call', { promptId, model: modelRegistry.getDefault() });
    
    try {
      const completion = await retryWithBackoff(
        () => chat({
          model: modelRegistry.getDefault(),
          messages: [
            { role: 'system', content: ARC_SUMMARY_SYSTEM_PROMPT },
            { role: 'user', content: buildArcSummaryUserPrompt(ctx.arcName, ctx.arcIdea, ctx.beatDescriptions) }
          ],
          tools: [ARC_SUMMARY_SCHEMA],
          tool_choice: { type: 'function', function: { name: 'generate_arc_summary' } },
          temperature: 0.7,
          max_tokens: 1000,
          metadata: buildMetadata(this.MODULE, promptId, ctx.userId, { arc_name: ctx.arcName })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(
        completion,
        'generate_arc_summary',
        contextData
      );

      const parsedData = safeParseJSON(
        toolCall.function.arguments,
        contextData
      );

      const validationResult = ArcSummaryResponseSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(
          validationResult.error,
          parsedData,
          contextData
        );
      }

      const args = validationResult.data;
      log.info('AI success', { 
        ai: { 
          model: modelRegistry.getDefault(), 
          prompt_id: promptId, 
          usage: completion.usage 
        } 
      });
      log.info('Generated arc summary', { arcName: ctx.arcName });
      
      return args.summary;
    } catch (error) {
      log.error('Failed to summarize arc', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }
}