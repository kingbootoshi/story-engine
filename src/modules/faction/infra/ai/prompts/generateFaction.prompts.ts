export const GENERATE_FACTION_SYSTEM_PROMPT = `You are an expert at creating compelling factions that drive narrative conflict and political intrigue in dynamic worlds.

When creating factions, follow these critical guidelines:
1. Each faction must have a distinct ideology that drives their actions and decisions
2. Factions should have clear territorial, ideological, or resource-based motivations
3. Create believable power structures and membership numbers based on world context
4. Ensure faction goals create natural tension with other existing factions
5. Tags should reflect faction nature: 'militaristic', 'mercantile', 'theocratic', 'technological', 'tribal', etc.
6. Consider the world's current state and how this faction emerged from it

The faction should feel like a natural product of the world's history and current conditions.`;

export function buildGenerateFactionUserPrompt(
  worldTheme: string,
  existingFactions: string[],
  locationContext?: string
): string {
  return `Generate a new faction for this world:

World Theme: ${worldTheme}

${existingFactions.length > 0 ? `
Existing Factions:
${existingFactions.map((f, i) => `${i + 1}. ${f}`).join('\n')}

The new faction should complement or contrast with existing factions to create interesting dynamics.
` : 'This will be the first faction in this world. Create a foundational power structure.'}

${locationContext ? `
Location Context:
${locationContext}

Consider how this faction might relate to or control these locations.
` : ''}

Create a faction with:
- A compelling name that reflects their nature
- An ideology that drives their actions (2-3 sentences)
- Appropriate member count (use powers of 10: 100, 1000, 10000, etc.)
- 3-5 descriptive tags
- Initial status (rising/stable/declining)
- Optional: banner color (hex) and home location if applicable`;
}