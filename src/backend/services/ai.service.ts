import OpenAI from "openpipe/openai";
import { createLogger } from '../../shared/utils/logger';
import { ANCHOR_SYSTEM_PROMPT, buildAnchorUserPrompt } from '../../ai/prompts/anchor.prompts';
import { DYNAMIC_BEAT_SYSTEM_PROMPT, buildDynamicBeatUserPrompt } from '../../ai/prompts/dynamicBeat.prompts';
import { ARC_SUMMARY_SYSTEM_PROMPT, buildArcSummaryUserPrompt } from '../../ai/prompts/arcSummary.prompts';

const logger = createLogger('ai.service');

// Initialize OpenAI client with OpenRouter through OpenPipe
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  openpipe: {
    apiKey: process.env.OPENPIPE_API_KEY || "",
  },
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5173',
    'X-Title': 'World Story Engine',
  },
});

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
}

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
        }
      },
      required: ["anchors"],
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

export class AIService {
  private static instance: AIService;
  
  private constructor() {
    logger.info('AI Service initialized');
  }
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateWorldArcAnchors(
    worldName: string,
    worldDescription: string,
    storyIdea?: string,
    previousArcs?: string[]
  ) {
    const systemPrompt = ANCHOR_SYSTEM_PROMPT;

    const userPrompt = buildAnchorUserPrompt(worldName, worldDescription, storyIdea, previousArcs);

    try {
      logger.info('Generating world arc anchors', {
        worldName,
        hasPreviousArcs: !!previousArcs?.length,
        hasStoryIdea: !!storyIdea
      });

      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-sonnet-4",
        messages: [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: userPrompt }
        ],
        tools: [WORLD_ARC_ANCHORS_SCHEMA],
        tool_choice: { type: "function", function: { name: "generate_world_arc_anchors" } },
        temperature: 0.9,
        max_tokens: 3000,
        metadata: {
          prompt_id: "world_arc_anchors",
          world_name: worldName
        },
        store: true,
      });

      const toolCall = completion.choices[0].message.tool_calls?.[0];
      if (!toolCall) {
        throw new Error('No tool call returned from AI');
      }

      const result = JSON.parse(toolCall.function.arguments);
      
      logger.logAICall(
        'generateWorldArcAnchors',
        'anthropic/claude-sonnet-4',
        { worldName, storyIdea },
        result
      );

      return result.anchors;
    } catch (error) {
      logger.logAICall(
        'generateWorldArcAnchors',
        'anthropic/claude-sonnet-4',
        { worldName, storyIdea },
        undefined,
        error
      );
      throw error;
    }
  }

  async generateDynamicWorldBeat(
    worldName: string,
    currentBeatIndex: number,
    previousBeats: any[],
    nextAnchor: any,
    recentEvents: string
  ) {
    const systemPrompt = DYNAMIC_BEAT_SYSTEM_PROMPT;

    // Build summaries for previous beats and next anchor to pass into prompt builder
    const previousBeatsSummary = previousBeats.map((b) => `Beat ${b.beat_index}: ${b.beatName || b.beat_name} - ${b.description.substring(0, 200)}...`).join('\n');
    const nextAnchorSummary = `${nextAnchor.beatName || nextAnchor.beat_name}: ${nextAnchor.description}`;

    const beatStructure = this.getWorldBeatStructure();
    const beatName = beatStructure[currentBeatIndex]?.beatName || 'World Event';

    const userPrompt = buildDynamicBeatUserPrompt(
      worldName,
      currentBeatIndex,
      previousBeatsSummary,
      nextAnchorSummary,
      recentEvents,
    );

    try {
      logger.info('Generating dynamic world beat', {
        worldName,
        currentBeatIndex,
        beatName,
        hasRecentEvents: !!recentEvents
      });

      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-sonnet-4",
        messages: [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: userPrompt }
        ],
        tools: [DYNAMIC_WORLD_BEAT_SCHEMA],
        tool_choice: { type: "function", function: { name: "generate_dynamic_world_beat" } },
        temperature: 0.85,
        max_tokens: 2000,
        metadata: {
          prompt_id: "dynamic_world_beat",
          world_name: worldName,
          beat_index: String(currentBeatIndex)
        },
        store: true,
      });

      const toolCall = completion.choices[0].message.tool_calls?.[0];
      if (!toolCall) {
        throw new Error('No tool call returned from AI');
      }

      const result = JSON.parse(toolCall.function.arguments);
      
      logger.logAICall(
        'generateDynamicWorldBeat',
        'anthropic/claude-sonnet-4',
        { worldName, currentBeatIndex },
        result
      );

      return {
        ...result,
        emergentStorylines: result.emergingConflicts, // Map to expected field name
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.logAICall(
        'generateDynamicWorldBeat',
        'anthropic/claude-sonnet-4',
        { worldName, currentBeatIndex },
        undefined,
        error
      );
      throw error;
    }
  }

  async generateArcSummary(arcName: string, arcIdea: string, beatDescriptions: string) {
    const systemPrompt = ARC_SUMMARY_SYSTEM_PROMPT;

    const userPrompt = buildArcSummaryUserPrompt(arcName, arcIdea, beatDescriptions);

    try {
      logger.info('Generating arc summary', { arcName });

      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-sonnet-4",
        messages: [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: userPrompt }
        ],
        tools: [ARC_SUMMARY_SCHEMA],
        tool_choice: { type: "function", function: { name: "generate_arc_summary" } },
        temperature: 0.7,
        max_tokens: 1000,
        metadata: {
          prompt_id: "arc_summary",
          arc_name: arcName
        },
        store: true,
      });

      const toolCall = completion.choices[0].message.tool_calls?.[0];
      if (!toolCall) {
        throw new Error('No tool call returned from AI');
      }

      const result = JSON.parse(toolCall.function.arguments);
      
      logger.logAICall(
        'generateArcSummary',
        'anthropic/claude-sonnet-4',
        { arcName },
        result
      );

      return result.summary;
    } catch (error) {
      logger.logAICall(
        'generateArcSummary',
        'anthropic/claude-sonnet-4',
        { arcName },
        undefined,
        error
      );
      throw error;
    }
  }

  private getWorldBeatStructure() {
    return [
      { stage: 'Equilibrium', beatName: 'Status Quo' },
      { stage: 'Equilibrium', beatName: 'Rising Tensions' },
      { stage: 'Equilibrium', beatName: 'First Tremors' },
      { stage: 'Disruption', beatName: 'The Catalyst' },
      { stage: 'Disruption', beatName: 'Shock Waves' },
      { stage: 'Chaos', beatName: 'Systems Fail' },
      { stage: 'Chaos', beatName: 'Power Vacuum' },
      { stage: 'Chaos', beatName: 'The Turning Point' },
      { stage: 'Adaptation', beatName: 'New Alliances' },
      { stage: 'Adaptation', beatName: 'Emerging Order' },
      { stage: 'Adaptation', beatName: 'The Struggle' },
      { stage: 'Resolution', beatName: 'Final Conflict' },
      { stage: 'Resolution', beatName: 'The Synthesis' },
      { stage: 'Resolution', beatName: 'New Dawn' },
      { stage: 'Resolution', beatName: 'Future Seeds' }
    ];
  }
}

export default AIService.getInstance();