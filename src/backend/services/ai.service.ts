import OpenAI from "openpipe/openai";
import { createLogger } from '../utils/logger';

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
    const systemPrompt = `You are a narrative expert who creates compelling world story arcs that affect entire civilizations, ecosystems, and realities.

CORE PRINCIPLE: The world's journey is shaped by REAL player actions and system events, not scripted scenarios.

When creating world arcs, follow these critical guidelines:
1. Focus on the WORLD'S evolution - its societies, environments, power structures, and fundamental laws
2. The narrative must be ADAPTABLE to incorporate player actions and emergent gameplay
3. Write world directives in clear, systemic terms that affect all entities
4. Create a framework that can RESPOND to collective player actions rather than prescribing specific outcomes
5. Anchor points should establish THEMATIC direction while leaving specific developments open

The world will evolve based on ACTUAL:
- Collective player decisions and actions
- Economic and social system dynamics
- Environmental changes and disasters
- Technological or magical discoveries
- Political movements and conflicts

You are creating THREE anchor points that establish a thematic journey:
1. Opening State (beat 0): Initial world equilibrium and tensions
2. Catalyst Event (beat 7): A pivotal change that disrupts the status quo
3. New Equilibrium (beat 14): The transformed world state after adaptation`;

    const userPrompt = `Generate the THREE anchor points (beginning, middle, end) for a world story arc following the Save the Cat framework adapted for world-building:

World Name: ${worldName}
World Description: <world_description>${worldDescription}</world_description>

${previousArcs?.length ? `\nIMPORTANT WORLD HISTORY:\nThis world has experienced previous story arcs that should inform this new era. Review this history to ensure continuity:\n\n${previousArcs.join('\n\n')}\n\nThe new arc should acknowledge and build upon this world history, showing meaningful evolution and consequences rather than resetting.\n` : ''}

## STORY INPUT SEED:
${storyIdea ? `Story idea: <story_idea>${storyIdea}</story_idea>` : "Based on the world's current state, generate an appropriate and engaging story arc."}

Generate exactly 3 anchor beats at indices 0, 7, and 14. Each beat should include all required fields.`;

    try {
      logger.info('Generating world arc anchors', {
        worldName,
        hasPreviousArcs: !!previousArcs?.length,
        hasStoryIdea: !!storyIdea
      });

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
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
        'openai/gpt-4o-mini',
        { worldName, storyIdea },
        result
      );

      return result.anchors;
    } catch (error) {
      logger.logAICall(
        'generateWorldArcAnchors',
        'openai/gpt-4o-mini',
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
    const systemPrompt = `You are a narrative expert who creates dynamic world events within an existing story arc.

When creating dynamic world beats, remember these IMPORTANT GUIDELINES:
1. Write SYSTEMIC changes that affect the entire world or major regions
2. The world directives should describe environmental, social, or metaphysical changes
3. Make these changes CONSEQUENTIAL and create ripple effects
4. Include specific details about how different regions or factions are affected
5. Maintain consistency with previous beats while progressing toward anchor points
6. World changes should create opportunities for player interaction and agency
7. SEAMLESSLY incorporate recent player actions and events to make the world feel alive

Your job is to generate the NEXT BEAT in a dynamic world story where some beats have been established.
The new beat must:
1. Follow naturally from previous world states
2. Incorporate consequences of recent player actions
3. Progress toward the established anchor point
4. Create new opportunities and challenges for inhabitants`;

    const beatStructure = this.getWorldBeatStructure();
    const beatName = beatStructure[currentBeatIndex]?.beatName || "World Event";

    const userPrompt = `Generate the NEXT BEAT (Beat #${currentBeatIndex}: ${beatName}) for this world's ongoing story:

World Name: ${worldName}
Current Beat Index: ${currentBeatIndex}

## PREVIOUS WORLD STATES:
${previousBeats.map((b, i) => `Beat ${i}: ${b.beatName} - ${b.description.substring(0, 200)}...`).join('\n')}

## NEXT ANCHOR POINT:
${nextAnchor.beatName}: ${nextAnchor.description}

## RECENT WORLD EVENTS:
${recentEvents || 'No specific events recorded.'}

Generate a compelling world beat that naturally incorporates the recent events while maintaining the arc's direction.`;

    try {
      logger.info('Generating dynamic world beat', {
        worldName,
        currentBeatIndex,
        beatName,
        hasRecentEvents: !!recentEvents
      });

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
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
          beat_index: currentBeatIndex
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
        'openai/gpt-4o-mini',
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
        'openai/gpt-4o-mini',
        { worldName, currentBeatIndex },
        undefined,
        error
      );
      throw error;
    }
  }

  async generateArcSummary(arcName: string, arcIdea: string, beatDescriptions: string) {
    const systemPrompt = `You are a narrative expert who creates compelling summaries of world story arcs. 
Create a comprehensive but concise summary that captures the complete world transformation, focusing on:
1. Major world changes and their cascading effects
2. Key turning points and catalytic events
3. How different regions/factions were affected
4. Overall thematic progression and meaning
5. The new world state and future implications

This summary will be used as continuity context for future arcs, so focus on elements that would impact the world's ongoing evolution.`;

    const userPrompt = `Summarize this completed world arc:

Arc Name: ${arcName}
Arc Idea: ${arcIdea}

Story Beats:
${beatDescriptions}

Create a comprehensive summary with all required fields that captures the essential world transformation and sets up future possibilities.`;

    try {
      logger.info('Generating arc summary', { arcName });

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
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
        'openai/gpt-4o-mini',
        { arcName },
        result
      );

      return result.summary;
    } catch (error) {
      logger.logAICall(
        'generateArcSummary',
        'openai/gpt-4o-mini',
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