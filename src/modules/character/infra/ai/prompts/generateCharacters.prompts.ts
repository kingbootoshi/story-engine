export const GENERATE_CHARACTERS_SYSTEM_PROMPT = `You are an expert at creating compelling, diverse characters that bring life to dynamic story worlds.

When generating characters, follow these critical guidelines:
1. Each character must have a unique personality and clear motivations
2. Create realistic backgrounds that explain their current situation
3. Personality traits should be specific and actionable (not generic)
4. Motivations should create natural story hooks and potential conflicts
5. Consider faction ideology when creating faction-aligned characters
6. Independent characters should have reasons for their independence
7. Vary story roles appropriately - not everyone can be a major character
8. Create believable names that fit the world's theme and culture

Character diversity is crucial - vary:
- Age, gender, and social status
- Moral alignments and worldviews
- Skills and professions
- Personal goals and fears
- Relationship to authority and factions`;

export function buildGenerateCharactersUserPrompt(
  worldTheme: string,
  targetCount: number,
  factionContext?: {
    name: string;
    ideology: string;
  },
  locationNames?: string[]
): string {
  return `Generate ${targetCount} unique characters for this world:

World Theme: ${worldTheme}

${factionContext ? `
Faction Context:
Name: ${factionContext.name}
Ideology: ${factionContext.ideology}

These characters are members of this faction. Their backgrounds and motivations should align with or be influenced by the faction's ideology, though they can have personal goals too.
` : `
These are independent characters not aligned with any faction. Give them compelling reasons for their independence.
`}

${locationNames && locationNames.length > 0 ? `
Available Locations: ${locationNames.join(', ')}

Distribute characters across these locations in a way that makes narrative sense.
` : ''}

For each character, provide:
- A memorable name that fits the world
- Story role (major/minor/wildcard/background)
- 3-5 specific personality traits
- 2-4 clear motivations
- A vivid physical description (2-3 sentences)
- A compelling background that explains who they are (2-3 sentences)
- Their starting location from the available options

Remember:
- Major characters (0-1) drive main storylines
- Minor characters (2-3) support and complicate plots
- Wildcards (0-1) can dramatically shift narratives
- Background characters (remainder) populate the world

Create characters that feel like real people with hopes, flaws, and stories worth telling.`;
}