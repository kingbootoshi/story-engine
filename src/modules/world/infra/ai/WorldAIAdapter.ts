import { injectable } from 'tsyringe';
import { chat, buildMetadata } from '../../../../core/ai';
import { createLogger } from '../../../../core/infra/logger';
import type { WorldAI, AnchorContext, BeatContext, SummaryContext, AnchorDTO, BeatDTO } from '../../domain/ports';
import { ANCHOR_SYSTEM_PROMPT, buildAnchorUserPrompt } from './prompts/anchor.prompts';
import { DYNAMIC_BEAT_SYSTEM_PROMPT, buildDynamicBeatUserPrompt } from './prompts/dynamicBeat.prompts';
import { ARC_SUMMARY_SYSTEM_PROMPT, buildArcSummaryUserPrompt } from './prompts/arcSummary.prompts';

const log = createLogger('world.ai');

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
  /** 
   * Primary AI model for world generation and narrative progression.
   * Using OpenAI GPT-4.1 Nano for efficient world state management and beat generation.
   */
  private readonly MODEL = 'openai/gpt-4.1-nano';
  private readonly MODULE = 'world';

  async generateAnchors(ctx: AnchorContext): Promise<{ anchors: AnchorDTO[]; arcDetailedDescription: string }> {
    log.debug('AI call', { promptId: 'generate_world_arc_anchors', model: this.MODEL });
    
    const completion = await chat({
      model: this.MODEL,
      messages: [
        { role: 'system', content: ANCHOR_SYSTEM_PROMPT },
        { role: 'user', content: buildAnchorUserPrompt(ctx.worldName, ctx.worldDescription, ctx.storyIdea, ctx.previousArcs, ctx.currentLocations) }
      ],
      tools: [WORLD_ARC_ANCHORS_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'generate_world_arc_anchors' } },
      temperature: 0.9,
      max_tokens: 3000,
      metadata: buildMetadata(this.MODULE, 'generate_world_arc_anchors', { world_name: ctx.worldName })
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const args = JSON.parse(toolCall.function.arguments);
    log.info('AI success', { 
      ai: { 
        model: this.MODEL, 
        prompt_id: 'generate_world_arc_anchors', 
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
  }

  async generateBeat(ctx: BeatContext): Promise<BeatDTO> {
    log.debug('AI call', { promptId: 'generate_dynamic_world_beat', model: this.MODEL });
    
    // Build summaries for previous beats and next anchor
    const previousBeatsSummary = ctx.previousBeats
      .map(b => `Beat ${b.beat_index}: ${b.beat_name} - ${b.description.substring(0, 200)}...`)
      .join('\n');
    const nextAnchorSummary = `${ctx.nextAnchor.beat_name}: ${ctx.nextAnchor.description}`;
    
    const completion = await chat({
      model: this.MODEL,
      messages: [
        { role: 'system', content: DYNAMIC_BEAT_SYSTEM_PROMPT },
        { role: 'user', content: buildDynamicBeatUserPrompt(
          ctx.worldName,
          ctx.worldDescription,
          ctx.currentBeatIndex,
          previousBeatsSummary,
          nextAnchorSummary,
          ctx.recentEvents,
          ctx.arcDetailedDescription,
          ctx.currentLocations
        )}
      ],
      tools: [DYNAMIC_WORLD_BEAT_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'generate_dynamic_world_beat' } },
      temperature: 0.85,
      max_tokens: 2000,
      metadata: buildMetadata(this.MODULE, 'generate_dynamic_world_beat', {
        world_name: ctx.worldName,
        beat_index: ctx.currentBeatIndex
      })
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const args = JSON.parse(toolCall.function.arguments);
    log.info('AI success', { 
      ai: { 
        model: this.MODEL, 
        prompt_id: 'generate_dynamic_world_beat', 
        usage: completion.usage 
      } 
    });
    log.info('Generated beat', { worldName: ctx.worldName, beatIndex: ctx.currentBeatIndex });
    
    return args;
  }

  async summarizeArc(ctx: SummaryContext): Promise<string> {
    log.debug('AI call', { promptId: 'generate_arc_summary', model: this.MODEL });
    
    const completion = await chat({
      model: this.MODEL,
      messages: [
        { role: 'system', content: ARC_SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: buildArcSummaryUserPrompt(ctx.arcName, ctx.arcIdea, ctx.beatDescriptions) }
      ],
      tools: [ARC_SUMMARY_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'generate_arc_summary' } },
      temperature: 0.7,
      max_tokens: 1000,
      metadata: buildMetadata(this.MODULE, 'generate_arc_summary', { arc_name: ctx.arcName })
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const args = JSON.parse(toolCall.function.arguments);
    log.info('AI success', { 
      ai: { 
        model: this.MODEL, 
        prompt_id: 'generate_arc_summary', 
        usage: completion.usage 
      } 
    });
    log.info('Generated arc summary', { arcName: ctx.arcName });
    
    return args.summary;
  }
}