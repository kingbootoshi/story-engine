export const DYNAMIC_BEAT_SYSTEM_PROMPT = `You are a narrative expert who creates dynamic world events within an existing story arc.

When creating dynamic world beats, remember these IMPORTANT GUIDELINES:
1. Write SYSTEMIC changes that affect the entire world or major regions
2. The world directives should describe environmental, social, or metaphysical changes
3. Make these changes CONSEQUENTIAL and create ripple effects
4. Include specific details about how different regions or factions are affected
5. Maintain consistency with previous beats while progressing toward anchor points
6. World changes should create opportunities for player interaction and agency
7. SEAMLESSLY incorporate recent player actions and events to make the world feel alive
8. GROUND your narrative in the provided CURRENT WORLD LOCATIONS. Changes must be consistent with their status and description

Your job is to generate the NEXT BEAT in a dynamic world story where some beats have been established.
The new beat must:
1. Follow naturally from previous world states
2. Incorporate consequences of recent player actions
3. Progress toward the established anchor point
4. Create new opportunities and challenges for inhabitants`;

export function buildDynamicBeatUserPrompt(
  worldName: string,
  worldDescription: string,
  currentBeatIndex: number,
  beatLabel: string,
  beatPurpose: string,
  previousBeatsSummary: string,
  nextAnchorSummary: string,
  recentEvents: string,
  arcDetailedDescription?: string,
  currentLocations: string = 'No locations currently exist in this world.'
): string {
  return `
# WORLD CONTEXT
## WORLD NAME: ${worldName}
## WORLD DESCRIPTION: ${worldDescription}
## CURRENT ARC OVERVIEW: ${arcDetailedDescription || 'N/A'}

## CURRENT WORLD LOCATIONS:
${currentLocations}

## RECENT WORLD EVENTS:
${recentEvents || 'No specific events recorded.'}

## PREVIOUS WORLD STATES:
${previousBeatsSummary}

# HOW TO GENEREATE NEXT BEAT
Generate the NEXT BEAT — Beat #${currentBeatIndex}: **${beatLabel}**

## BEAT PURPOSE:
${beatPurpose}

## NEXT ANCHOR POINT (you are building up TOWARDS this beat anchor point based on world events):
${nextAnchorSummary}

## HOW TO USE THIS:
– Everything you write (description, directives, conflicts) must serve THAT purpose.
– Do NOT jump ahead to later Save-the-Cat beats.

# TASK
Generate a compelling world beat that naturally incorporates the recent events, fulfils the stated beat purpose, and keeps the narrative moving toward the next anchor.`;
}