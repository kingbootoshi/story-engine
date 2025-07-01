export const GENERATE_FACTION_SYSTEM_PROMPT = `You are an expert at creating compelling factions that drive narrative conflict and political intrigue in dynamic worlds.

CRITICAL: You MUST generate factions with this EXACT JSON structure:

EXAMPLE OUTPUT:
{
  "name": "The Ashen Brotherhood",
  "ideology": "The world's suffering can only end through controlled destruction and rebirth. They believe that by burning away the corrupt institutions and weak-willed masses, a stronger civilization will rise from the ashes. Only those who prove their worth through trials by fire deserve to shape the new world.",
  "status": "rising",
  "members_estimate": 1000,
  "tags": ["militaristic", "zealous", "secretive", "pyromaniac", "revolutionary"],
  "banner_color": "#8B0000"
}

FACTION CREATION RULES:
✓ Name: Evocative and memorable, reflecting their nature
✓ Ideology: 2-3 sentences explaining core beliefs and goals
✓ Status: 'rising', 'stable', or 'declining' based on world context
✓ Members: Use powers of 10 (100, 1000, 10000, etc.)
✓ Tags: 3-6 descriptive tags from this list (or similar):
  - Political: 'democratic', 'autocratic', 'oligarchic', 'anarchist'
  - Economic: 'mercantile', 'agrarian', 'industrial', 'socialist'
  - Military: 'militaristic', 'pacifist', 'defensive', 'expansionist'
  - Religious: 'theocratic', 'secular', 'zealous', 'tolerant'
  - Social: 'egalitarian', 'hierarchical', 'xenophobic', 'cosmopolitan'
  - Other: 'technological', 'magical', 'tribal', 'nomadic', 'secretive'
✓ Banner color: Hex color code (optional, but adds flavor)

COMMON MISTAKES TO AVOID:
✗ Don't create generic "evil cult" or "good kingdom" factions
✗ Don't make ideology too vague or too specific
✗ Ensure member count makes sense for the faction type
✗ Tags should reflect actual faction behavior, not aspirations`;

export function buildGenerateFactionUserPrompt(
  worldTheme: string,
  existingFactions: string[],
  locationContext?: string
): string {
  return `Generate a new faction for this world.

World Theme: ${worldTheme}

${existingFactions.length > 0 ? `
EXISTING FACTIONS:
${existingFactions.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Create a faction that:
- Complements OR conflicts with existing factions
- Fills a different niche or represents opposing values
- Creates interesting diplomatic dynamics
` : `
FIRST FACTION:
This will be the first faction in this world. Create a foundational power structure that:
- Reflects the world's current state
- Has clear territorial or ideological claims
- Sets the stage for future conflicts
`}

${locationContext ? `
LOCATION CONTEXT:
${locationContext}
Consider how this faction might control, influence, or relate to these locations.
` : ''}

REMEMBER:
- The faction should feel like a natural product of this world's conditions
- Their goals should create story potential and conflicts
- They need both strengths and vulnerabilities
- Member count should match their influence and reach

Follow the EXACT JSON structure shown in the system prompt example.`;
}