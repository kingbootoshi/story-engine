export const GENERATE_CHARACTERS_SYSTEM_PROMPT = `You are an expert at creating compelling, diverse characters that bring life to dynamic story worlds.

CRITICAL: You MUST generate characters with this EXACT JSON structure:

EXAMPLE OUTPUT (for 2 characters):
{
  "characters": [
    {
      "name": "Captain Elara Voss",
      "story_role": "minor",
      "faction_id": null,
      "personality_traits": ["stoic", "honorable", "haunted by past failures", "protective of crew", "secretly compassionate"],
      "motivations": ["redeem herself for a past military disaster", "protect the innocent from war", "find her missing sister"],
      "description": "A weathered woman in her forties with steel-gray hair tied back in a military braid. Deep worry lines frame her sharp blue eyes, and an old saber scar runs along her left jaw. She moves with the practiced efficiency of a career soldier.",
      "background": "Former naval commander who lost her fleet in a catastrophic battle. Now captains a single merchant vessel, taking dangerous contracts to support war orphans. She maintains military discipline but has learned to value individual lives over glory.",
      "spawn_location": "Harbor District"
    },
    {
      "name": "Finn the Fence",
      "story_role": "background",
      "faction_id": null,
      "personality_traits": ["gregarious", "opportunistic", "surprisingly loyal", "superstitious"],
      "motivations": ["accumulate enough wealth to retire", "maintain his network of contacts", "avoid the Thieves' Guild"],
      "description": "A portly halfling with twinkling eyes and an easy smile. His fine clothes are slightly threadbare at the edges, and he constantly fidgets with a lucky copper coin.",
      "background": "Runs a pawnshop that serves as a front for his real business: moving stolen goods. Despite his profession, he has strict rules about what he'll handle and maintains a reputation for fair dealing.",
      "spawn_location": "Market Square"
    }
  ]
}

CHARACTER CREATION RULES:
✓ Story roles: 'major' (0-1 max), 'minor' (2-3), 'wildcard' (0-1), 'background' (remainder)
✓ Personality traits: 3-5 specific, actionable traits (not generic like "brave" or "smart")
✓ Motivations: 2-4 concrete goals that drive actions
✓ Description: 2-3 sentences of physical appearance and mannerisms
✓ Background: 2-3 sentences explaining their history and current situation
✓ Spawn location: Must be from the provided available locations

FACTION ALIGNMENT:
- If creating for a faction: faction_id will be set by the system (leave as null in your output)
- If independent: Explain in background why they're unaffiliated`;

export function buildGenerateCharactersUserPrompt(
  worldTheme: string,
  targetCount: number,
  factionContext?: {
    name: string;
    ideology: string;
  },
  locationNames?: string[]
): string {
  const locationList = locationNames && locationNames.length > 0 
    ? locationNames.join(', ')
    : 'Main Settlement';

  return `Generate exactly ${targetCount} unique characters for this world.

World Theme: ${worldTheme}

${factionContext ? `
FACTION MEMBERS - ${factionContext.name}:
Ideology: ${factionContext.ideology}
Create characters who are members of this faction. Their backgrounds and motivations should align with the faction's ideology while maintaining individual personality.
` : `
INDEPENDENT CHARACTERS:
Create characters not aligned with any faction. Each should have compelling reasons for their independence (e.g., neutrality, distrust, personal codes, conflicting loyalties).
`}

Available Spawn Locations: ${locationList}

REMEMBER:
- Major characters (0-1): Protagonist-level importance, complex arcs
- Minor characters (2-3): Supporting cast, subplot drivers  
- Wildcards (0-1): Unpredictable agents of chaos/change
- Background characters (rest): World texture, specific functions

Each character must feel like a real person with authentic flaws, fears, and dreams that fit naturally into the ${worldTheme} setting.`;
}