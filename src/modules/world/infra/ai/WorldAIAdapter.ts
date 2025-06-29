import { injectable } from 'tsyringe';
import { z } from 'zod';
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

const log = createLogger('world.ai');

// Zod schemas for response validation
const WorldArcAnchorsResponseSchema = z.object({
  anchors: z.array(z.object({
    beatIndex: z.number().int().refine(val => [0, 7, 14].includes(val), {
      message: "beatIndex must be 0, 7, or 14"
    }),
    beatName: z.string(),
    description: z.string(),
    worldDirectives: z.array(z.string()),
    majorEvents: z.array(z.string()),
    emergentStorylines: z.array(z.string())
  })).length(3),
  arcDetailedDescription: z.string()
});

const DynamicWorldBeatResponseSchema = z.object({
  beatName: z.string(),
  description: z.string(),
  worldDirectives: z.array(z.string()),
  emergingConflicts: z.array(z.string()),
  environmentalChanges: z.array(z.string()).nullable()
});

const ArcSummaryResponseSchema = z.object({
  summary: z.string(),
  majorChanges: z.array(z.string()),
  affectedRegions: z.array(z.string()),
  thematicProgression: z.string(),
  futureImplications: z.array(z.string())
});

// Define structured output schemas for function calling
const WORLD_ARC_ANCHORS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_world_arc_anchors",
    description: "Generate three anchor points for a world story arc",
    parameters: {
      type: "object",
      properties: {
        anchors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              beatIndex: {
                type: "number",
                enum: [0, 7, 14],
                description: "The beat index (0, 7, or 14)"
              },
              beatName: {
                type: "string",
                description: "A descriptive name for this world event/era"
              },
              description: {
                type: "string",
                description: "Detailed description of the world state and ongoing changes"
              },
              worldDirectives: {
                type: "array",
                items: { type: "string" },
                description: "Clear directives on how different factions, regions, or systems should behave"
              },
              majorEvents: {
                type: "array",
                items: { type: "string" },
                description: "Major events or phenomena occurring during this period"
              },
              emergentStorylines: {
                type: "array",
                items: { type: "string" },
                description: "3-5 emergent storylines that players might engage with"
              }
            },
            required: ["beatIndex", "beatName", "description", "worldDirectives", "majorEvents", "emergentStorylines"],
            additionalProperties: false
          },
          minItems: 3,
          maxItems: 3
        },
        arcDetailedDescription: {
          type: "string",
          description: "A detailed 2-3 paragraph description of the arc's overall narrative theme and trajectory"
        }
      },
      required: ["anchors", "arcDetailedDescription"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

const DYNAMIC_WORLD_BEAT_SCHEMA = {
  type: "function",
  function: {
    name: "generate_dynamic_world_beat",
    description: "Generate a dynamic world beat within an existing story arc",
    parameters: {
      type: "object",
      properties: {
        beatName: {
          type: "string",
          description: "A descriptive name for this world event/period"
        },
        description: {
          type: "string",
          description: "Detailed description of world changes and their cascading effects"
        },
        worldDirectives: {
          type: "array",
          items: { type: "string" },
          description: "Directives for how different regions, factions, or systems respond"
        },
        emergingConflicts: {
          type: "array",
          items: { type: "string" },
          description: "3-5 emerging conflicts or opportunities"
        },
        environmentalChanges: {
          type: ["array", "null"],
          items: { type: "string" },
          description: "Environmental or metaphysical changes if applicable"
        }
      },
      required: ["beatName", "description", "worldDirectives", "emergingConflicts", "environmentalChanges"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

const ARC_SUMMARY_SCHEMA = {
  type: "function",
  function: {
    name: "generate_arc_summary",
    description: "Generate a comprehensive summary of a completed world arc",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "2-3 paragraph summary capturing the essential world transformation"
        },
        majorChanges: {
          type: "array",
          items: { type: "string" },
          description: "List of major world changes and their effects"
        },
        affectedRegions: {
          type: "array",
          items: { type: "string" },
          description: "How different regions/factions were affected"
        },
        thematicProgression: {
          type: "string",
          description: "Overall thematic progression and meaning"
        },
        futureImplications: {
          type: "array",
          items: { type: "string" },
          description: "Future possibilities and implications for the world"
        }
      },
      required: ["summary", "majorChanges", "affectedRegions", "thematicProgression", "futureImplications"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

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