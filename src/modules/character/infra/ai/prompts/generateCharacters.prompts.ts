export const GENERATE_FACTION_CHARACTERS_SYSTEM_PROMPT = `You are a character generation specialist for narrative games. 
Your task is to create compelling NPCs that serve specific roles within factions while maintaining narrative coherence.

Guidelines:
- Create 3-5 characters for new factions (leader + key members)
- Ensure diversity in personality types and roles
- Align character beliefs with faction ideology while adding nuance
- Create pre-existing relationships between faction members
- Generate realistic goals that drive narrative forward
- Make characters memorable with distinct traits

prompt_id@v1`;

export function buildGenerateFactionCharactersUserPrompt(
  worldTheme: string,
  factionName: string,
  factionIdeology: string,
  existingCharacters: string[]
): string {
  return `Create initial characters for a new faction.

<world_theme>${worldTheme}</world_theme>

<faction>
Name: ${factionName}
Ideology: ${factionIdeology}
</faction>

<existing_characters>
${existingCharacters.length > 0 ? existingCharacters.join('\n') : 'None yet'}
</existing_characters>

Generate 3-5 characters including:
- A faction leader
- 2-4 key members (advisors, generals, spies, etc.)

For each character provide:
- Unique name (avoid duplicates with existing characters)
- Role within faction
- 3-5 personality traits
- 2-3 core beliefs (aligned with but adding nuance to faction ideology)
- 2-3 initial goals
- Brief backstory (2-3 sentences)
- Relationships with other generated characters`;
}

export const GENERATE_BEAT_CHARACTERS_SYSTEM_PROMPT = `You are a narrative specialist creating NPCs in response to story events.
Your characters should emerge naturally from the narrative context and serve specific story purposes.

Guidelines:
- Only create characters explicitly needed by the beat directive
- Ensure new characters have clear motivations tied to current events
- Create connections to existing factions/locations when appropriate
- Balance character roles (don't create too many major characters)
- Make characters that will drive conflict or resolution

prompt_id@v1`;

export function buildGenerateBeatCharactersUserPrompt(
  worldTheme: string,
  beatDirective: string,
  beatContext: string,
  existingCharacters: Array<{ name: string; role: string }>,
  factionContext?: Array<{ id: string; name: string; ideology: string }>
): string {
  return `Analyze the story beat and create any NPCs needed to fulfill the directive.

<world_theme>${worldTheme}</world_theme>

<beat_directive>${beatDirective}</beat_directive>

<beat_context>${beatContext}</beat_context>

<existing_characters>
${existingCharacters.map(c => `${c.name} (${c.role})`).join('\n')}
</existing_characters>

${factionContext ? `<factions>
${factionContext.map(f => `${f.name}: ${f.ideology} (ID: ${f.id})`).join('\n')}
</factions>` : ''}

Create ONLY characters explicitly needed by the beat directive. For each character provide:
- Name (unique)
- Story role (major/minor/wildcard/background)
- Faction affiliation if applicable (use faction ID)
- 3-5 personality traits
- 2-3 core beliefs
- 2-3 initial goals related to current events
- Brief backstory explaining their emergence`;
}