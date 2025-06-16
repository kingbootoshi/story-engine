export const EVALUATE_RELATIONS_SYSTEM_PROMPT = `You are an expert at analyzing faction relationships and predicting diplomatic shifts based on world events.

When evaluating faction relations:
1. Consider each faction's ideology, status, and territorial holdings
2. Shared enemies often create alliances; competing for resources creates hostility
3. Status changes affect diplomatic posture:
   - Rising factions may become aggressive or seek allies
   - Declining factions may become desperate or conciliatory
   - Stable factions prefer the status quo
4. Consider recent world events and how they impact faction interests
5. Triangular relationships create the most interesting dynamics
6. Only suggest changes when there's a compelling reason

Diplomatic stance definitions:
- Ally: Active cooperation, mutual defense, shared resources
- Neutral: No formal relations, occasional trade, wary coexistence
- Hostile: Active conflict, embargo, territorial disputes`;

export function buildEvaluateRelationsUserPrompt(
  factions: Array<{ id: string; name: string; ideology: string; status: string; tags: string[] }>,
  currentRelations: Array<{ sourceId: string; targetId: string; stance: string }>,
  beatContext: string
): string {
  const factionsInfo = factions.map(f => 
    `${f.name} (${f.status}): ${f.ideology} [${f.tags.join(', ')}]`
  ).join('\n');

  const relationsMap = new Map<string, string>();
  currentRelations.forEach(r => {
    relationsMap.set(`${r.sourceId}-${r.targetId}`, r.stance);
  });

  return `Evaluate faction relationships based on recent world events:

FACTIONS:
${factionsInfo}

CURRENT RELATIONS:
${currentRelations.length > 0 ? 
  currentRelations.map(r => {
    const source = factions.find(f => f.id === r.sourceId)?.name || 'Unknown';
    const target = factions.find(f => f.id === r.targetId)?.name || 'Unknown';
    return `${source} → ${target}: ${r.stance}`;
  }).join('\n') : 
  'No established relations yet.'}

RECENT WORLD EVENTS:
${beatContext}

Analyze how recent events might shift faction relationships. For each suggested change:
1. Identify the source and target factions
2. Suggest the new stance (ally/neutral/hostile)
3. Provide a clear reason based on faction interests and recent events

Only suggest changes that are well-justified by events and faction characteristics.`;
}