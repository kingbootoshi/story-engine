import type { CharacterSelectionContext } from '../../../domain/ports';

export const SELECT_AFFECTED_CHARACTERS_SYSTEM_PROMPT = `You are an intelligent narrative analyzer that determines which characters in a story world should react to narrative beats.

Your job is to analyze a story beat and determine which characters would be directly affected by or aware of the events described. Consider:

1. **Direct Involvement**: Characters explicitly mentioned or directly participating in the beat
2. **Physical Proximity**: Characters in the same location where events occur
3. **Faction/Group Impact**: Characters belonging to factions affected by the beat
4. **Relationship Connections**: Characters with strong relationships to those directly involved
5. **Information Networks**: Characters who would realistically learn about significant events
6. **Narrative Importance**: Major characters who should be aware of world-changing events

Be selective and realistic. Not every character needs to react to every beat. Focus on those with genuine reasons to be affected.

Return ONLY character names that exist in the provided character list.`;

export function buildSelectAffectedCharactersUserPrompt(context: CharacterSelectionContext): string {
  const characterList = context.characters.map(c => {
    const location = c.location ? `at ${c.location}` : 'location unknown';
    const faction = c.faction ? `member of ${c.faction}` : 'no faction';
    return `- ${c.name} (${c.story_role}): ${location}, ${faction}. Motivations: ${c.motivations.join(', ')}`;
  }).join('\n');

  return `World Theme: ${context.worldTheme}

Current Beat (#${context.beatIndex}):
Description: ${context.beat.description}
Directives: ${context.beat.directives.join(', ')}
Emergent Themes: ${context.beat.emergent.join(', ')}

Available Characters:
${characterList}

Available Locations: ${context.locations.map(l => l.name).join(', ')}
Active Factions: ${context.factions.map(f => f.name).join(', ')}

Analyze this beat and determine which characters would be directly affected by or aware of these events. For each selected character, provide a clear, specific reason why they are affected.

Consider:
- Characters directly mentioned or implied in the beat description
- Characters in locations where events occur
- Characters whose factions are involved
- Characters whose motivations align with or oppose the events
- Characters who would realistically learn about major events

Be selective - only include characters with genuine reasons to be affected.`;
}