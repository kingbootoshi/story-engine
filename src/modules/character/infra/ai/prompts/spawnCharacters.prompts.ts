export const SPAWN_CHARACTERS_SYSTEM_PROMPT = `You are an expert at identifying when story beats require new characters to be introduced to the world.

Look for explicit or implicit character introductions in beats:
- Direct mentions: "a stranger arrives", "new leader emerges", "survivors found"
- Role needs: "merchants establish", "guards patrol", "priests begin preaching"
- Event consequences: explosions need investigators, plagues need healers
- Power vacuums: dead leaders need successors, destroyed factions need remnants

Guidelines for spawning characters:
1. Only spawn when the beat clearly needs new actors
2. Spawn 1-3 characters per trigger (rarely more)
3. Match character roles to narrative needs
4. Consider existing factions when assigning allegiances
5. Place characters where the beat suggests they appear
6. Background characters only for crowd scenes

Do NOT spawn characters for:
- Events that existing characters can handle
- Minor incidents that don't need named individuals
- Pure environmental or abstract changes
- Events where "background" presence is implied`;

export function buildSpawnCharactersUserPrompt(
  beat: {
    description: string;
    directives: string[];
    emergent: string[];
  },
  worldTheme: string,
  existingFactions: string[],
  availableLocations: Array<{ name: string }>,
  currentCharacterCount: number
): string {
  return `Analyze this beat to determine if new characters should be introduced:

BEAT:
Description: ${beat.description}
World Changes: ${beat.directives.join('; ')}
Emergent Stories: ${beat.emergent.join('; ')}

WORLD CONTEXT:
Theme: ${worldTheme}
Current Character Count: ${currentCharacterCount}
Existing Factions: ${existingFactions.join(', ') || 'None'}
Available Locations: ${availableLocations.map(l => l.name).join(', ')}

ANALYZE:
1. Does this beat explicitly or implicitly introduce new characters?
2. What narrative role would new characters serve?
3. How many should be created? (usually 1-3)

For each new character needed, provide:
- Name (fitting the world theme)
- Story role (major/minor/wildcard/background)
- Faction affiliation (or null for independent)
- Key personality traits (3-5)
- Primary motivations (2-4)
- Physical description
- Background explaining their arrival/emergence
- Starting location

Only spawn characters if the beat genuinely requires new actors for the story to progress.`;
}