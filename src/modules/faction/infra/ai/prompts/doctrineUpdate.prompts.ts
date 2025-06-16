export const UPDATE_DOCTRINE_SYSTEM_PROMPT = `You are an expert at evolving faction ideologies based on their experiences and changing circumstances.

When updating faction doctrine:
1. Maintain the faction's core identity while showing realistic adaptation
2. Status changes should meaningfully impact ideology:
   - Rising: Confidence, expansion, ambition
   - Stable: Consolidation, tradition, order
   - Declining: Desperation, reform, or retrenchment
   - Collapsed: Final testament or scattered remnants
3. Include specific references to recent events that triggered the change
4. Evolve tags to reflect the faction's new priorities
5. Keep ideological shifts believable - dramatic changes need dramatic causes`;

export function buildDoctrineUpdateUserPrompt(
  factionName: string,
  currentIdeology: string,
  currentTags: string[],
  statusChange: { from: string; to: string; reason: string },
  worldContext: string
): string {
  return `Update the doctrine for this faction based on their status change:

Faction: ${factionName}
Current Ideology: ${currentIdeology}
Current Tags: ${currentTags.join(', ')}

Status Change: ${statusChange.from} → ${statusChange.to}
Reason: ${statusChange.reason}

World Context:
${worldContext}

Provide:
1. Updated ideology (2-3 sentences showing how their beliefs have evolved)
2. Updated tags (3-5 tags reflecting their new priorities and nature)

The changes should feel like a natural response to their circumstances while maintaining faction continuity.`;
}