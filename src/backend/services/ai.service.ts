import OpenAI from "openpipe/openai";

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

export class AIService {
  private static instance: AIService;
  
  private constructor() {}
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: GenerationOptions = {}
  ) {
    try {
      const completion = await openai.chat.completions.create({
        messages,
        model: options.model || "openai/gpt-4o-mini",
        temperature: options.temperature || 0.8,
        max_tokens: options.maxTokens || 2000,
        metadata: {
          ...options.metadata,
          prompt_id: options.metadata?.prompt_id || "world_story_generation",
        },
        store: true,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error("Failed to generate completion");
    }
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

For EACH of the THREE anchor beats, provide:
1. A descriptive name for this world event/era
2. A detailed description of the world state and ongoing changes
3. Clear directives on how different factions, regions, or systems should behave
4. Major events or phenomena occurring during this period
5. 3-5 emergent storylines that players might engage with

Ensure the arc creates opportunities for player agency while maintaining narrative coherence.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt }
    ];

    const response = await this.generateCompletion(messages, {
      metadata: { prompt_id: "world_arc_anchors" },
      temperature: 0.9,
      maxTokens: 3000
    });

    return this.parseAnchorPoints(response || "");
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

For this beat (Beat #${currentBeatIndex}: ${beatName}), provide:
1. A descriptive name for this world event/period
2. A detailed description of world changes and their cascading effects
3. Directives for how different regions, factions, or systems respond
4. 3-5 emerging conflicts or opportunities
5. Environmental or metaphysical changes if applicable

IMPORTANT: This beat should reflect the consequences of recent events while maintaining the arc's direction.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt }
    ];

    const response = await this.generateCompletion(messages, {
      metadata: { prompt_id: "dynamic_world_beat" },
      temperature: 0.85
    });

    return this.parseDynamicBeat(response || "");
  }

  private parseAnchorPoints(response: string): any {
    // Parse the AI response into structured anchor points
    // This is a simplified parser - you'd want more robust parsing in production
    const anchors = [];
    const sections = response.split(/(?=Beat \d+:|Opening State:|Catalyst Event:|New Equilibrium:)/i);
    
    for (const section of sections) {
      if (section.trim()) {
        const lines = section.trim().split('\n');
        const beatName = lines[0].replace(/^(Beat \d+:|Opening State:|Catalyst Event:|New Equilibrium:)\s*/i, '').trim();
        
        anchors.push({
          beatName,
          description: section,
          worldDirectives: this.extractDirectives(section),
          emergentStorylines: this.extractStorylines(section)
        });
      }
    }

    return anchors;
  }

  private parseDynamicBeat(response: string): any {
    return {
      beatName: this.extractBeatName(response),
      description: response,
      worldDirectives: this.extractDirectives(response),
      emergentStorylines: this.extractStorylines(response),
      timestamp: new Date().toISOString()
    };
  }

  private extractBeatName(text: string): string {
    const match = text.match(/(?:name|title|event):\s*(.+?)(?:\n|$)/i);
    return match ? match[1].trim() : "Unnamed World Event";
  }

  private extractDirectives(text: string): string[] {
    const directives = [];
    const matches = text.matchAll(/(?:directive|instruction|change)s?:\s*(.+?)(?=\n\n|\n(?:directive|instruction|change)|$)/gis);
    
    for (const match of matches) {
      directives.push(match[1].trim());
    }
    
    return directives;
  }

  private extractStorylines(text: string): string[] {
    const storylines = [];
    const matches = text.matchAll(/(?:storyline|conflict|opportunity|emerging)s?:\s*(.+?)(?=\n\n|\n(?:storyline|conflict|opportunity)|$)/gis);
    
    for (const match of matches) {
      const lines = match[1].split(/\n|;/).map(l => l.trim()).filter(l => l);
      storylines.push(...lines);
    }
    
    return storylines.slice(0, 5);
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