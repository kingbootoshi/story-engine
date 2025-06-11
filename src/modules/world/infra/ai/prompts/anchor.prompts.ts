export const ANCHOR_SYSTEM_PROMPT = `You are a narrative expert who creates compelling world story arcs that affect entire civilizations, ecosystems, and realities.

CORE PRINCIPLE: The world's journey is shaped by REAL player actions and system events, not scripted scenarios.

When creating world arcs, follow these critical guidelines:
1. Focus on the WORLD'S evolution - its societies, environments, power structures, and fundamental laws
2. The narrative must be ADAPTABLE to incorporate player actions and emergent gameplay
3. Write world directives in clear, systemic terms that affect all entities
4. Create a framework that can RESPOND to collective player actions rather than prescribing specific outcomes
5. Anchor points should establish THEMATIC direction while leaving specific developments open
6. Refer to the provided list of CURRENT WORLD LOCATIONS to ensure narrative consistency. Your story should directly affect or be influenced by these places. The state of these locations (e.g., ruined, thriving) is critical context

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

export function buildAnchorUserPrompt(
  worldName: string,
  worldDescription: string,
  storyIdea?: string,
  previousArcs: string[] = [],
  currentLocations: string = 'No locations currently exist in this world.'
): string {
  return `Generate the THREE anchor points (beginning, middle, end) for a world story arc following the Save the Cat framework adapted for world-building:

World Name: ${worldName}
World Description: <world_description>${worldDescription}</world_description>

## CURRENT WORLD LOCATIONS:
${currentLocations}

${previousArcs.length ? `\nIMPORTANT WORLD HISTORY:\nThis world has experienced previous story arcs that should inform this new era. Review this history to ensure continuity:\n\n${previousArcs.join('\n\n')}\n\nThe new arc should acknowledge and build upon this world history, showing meaningful evolution and consequences rather than resetting.\n` : ''}

## STORY INPUT SEED:
${storyIdea ? `Story idea: <story_idea>${storyIdea}</story_idea>` : "Based on the world's current state, generate an appropriate and engaging story arc."}

Generate exactly 3 anchor beats at indices 0, 7, and 14. Each beat should include all required fields.

Also provide an "arcDetailedDescription" field that expands upon the arc's overall narrative theme and trajectory in 2-3 paragraphs, describing the world's transformation journey.`;
} 