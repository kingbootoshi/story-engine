export const DYNAMIC_BEAT_SYSTEM_PROMPT = `You are a narrative expert who creates dynamic world events within an existing story arc.

CRITICAL: You MUST generate beats with this EXACT JSON structure:

EXAMPLE OUTPUT:
{
  "beatName": "The Merchant Uprising",
  "description": "Fed up with increasing taxes and dwindling protection from bandits, the merchant guilds across three major cities simultaneously close their shops and blockade the trade routes. What began as peaceful protests erupts into violence when city guards attempt to force the warehouses open. The merchants reveal they've been secretly hiring mercenary companies, turning the commercial districts into fortified compounds. Food prices skyrocket as supply chains collapse, forcing nobles and commoners alike to choose sides in an escalating economic war.",
  "worldDirectives": [
    "All major trade routes are blocked by merchant-hired mercenaries",
    "Cities implement rationing as food supplies dwindle",
    "Noble houses must negotiate directly with guild leaders or face shortages",
    "Black markets emerge in every major settlement, controlled by criminal elements"
  ],
  "emergingConflicts": [
    "Starving citizens riot against both merchants and nobles",
    "Mercenary companies play both sides for maximum profit",
    "Rural communities consider declaring independence from the cities",
    "Religious leaders mediate but demand political concessions"
  ],
  "environmentalChanges": [
    "Abandoned warehouses become havens for refugees and criminals",
    "Trade roads deteriorate without merchant maintenance",
    "Urban gardens spring up as citizens attempt self-sufficiency"
  ]
}

BEAT CREATION RULES:
✓ beatName: Evocative title that captures the essence
✓ description: 3-5 sentences painting the full picture of what's happening
✓ worldDirectives: 3-5 systemic changes affecting everyone
✓ emergingConflicts: 3-5 new tensions or opportunities
✓ environmentalChanges: null OR 2-3 physical/magical world changes

IMPORTANT GUIDELINES:
1. Build naturally from previous beats
2. Incorporate recent player/world events
3. Progress toward the next anchor point
4. Create opportunities for player agency
5. Focus on SYSTEMIC changes, not individual stories`;

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
  currentLocations: string = 'No locations currently exist in this world.',
  currentFactions: string = 'No factions currently exist in this world.',
  currentCharacters: string = 'No characters currently exist in this world.'
): string {
  return `Generate Beat #${currentBeatIndex}: "${beatLabel}"

CURRENT WORLD STATE:
World: ${worldName} - ${worldDescription}
Arc Theme: ${arcDetailedDescription || 'Standard progression'}

Locations: ${currentLocations}
Factions: ${currentFactions}
Characters: ${currentCharacters}

RECENT EVENTS TO INCORPORATE:
${recentEvents || 'No specific events recorded.'}

STORY PROGRESSION:
Previous: ${previousBeatsSummary}
Next Target: ${nextAnchorSummary}

THIS BEAT'S PURPOSE:
${beatPurpose}

REQUIREMENTS:
1. The beat must serve the stated purpose above
2. It should feel like a natural consequence of previous events
3. Include specific references to actual locations/factions when relevant
4. Set up progression toward the next anchor
5. Create decision points and opportunities for inhabitants

Follow the EXACT JSON structure shown in the system prompt example.`;
}