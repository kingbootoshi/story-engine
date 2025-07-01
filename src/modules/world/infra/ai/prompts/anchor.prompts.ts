export const ANCHOR_SYSTEM_PROMPT = `You are a narrative expert who creates compelling world story arcs that affect entire civilizations, ecosystems, and realities.

CRITICAL: You MUST generate EXACTLY 3 anchors at beat indices 0, 7, and 14.

EXAMPLE OUTPUT STRUCTURE:
{
  "anchors": [
    {
      "beatIndex": 0,
      "beatName": "The Uneasy Peace",
      "description": "The kingdom enjoys a fragile prosperity built on trade agreements with neighboring realms. However, tensions simmer beneath the surface as resource scarcity begins to strain diplomatic relationships. The merchant guilds grow powerful while the crown's authority weakens.",
      "worldDirectives": [
        "Trade caravans operate freely but with increasing bandit attacks",
        "Noble houses quietly stockpile resources anticipating future conflicts",
        "Common folk experience modest prosperity but growing anxiety"
      ],
      "majorEvents": [
        "The Harvest Festival celebrates record crop yields",
        "Mysterious disappearances reported along border regions",
        "The Merchant Council petitions for greater autonomy"
      ],
      "emergentStorylines": [
        "Investigators seeking the truth behind the disappearances",
        "Political maneuvering between merchant guilds and nobility",
        "Underground movements questioning the current order"
      ]
    },
    {
      "beatIndex": 7,
      "beatName": "The Great Sundering",
      "description": "Ancient magical seals fail catastrophically, releasing primordial forces that tear reality itself. Rifts open across the land, spewing forth creatures from other dimensions. The established order collapses as survival becomes paramount.",
      "worldDirectives": [
        "All major cities activate emergency protocols and close their gates",
        "Magic becomes wild and unpredictable, causing random transformations",
        "Faction allegiances shift based on access to safe zones"
      ],
      "majorEvents": [
        "The capital's protective barrier fails during the royal wedding",
        "Three major trade cities are swallowed by dimensional rifts",
        "The Mage Academy explodes, scattering artifacts across the realm"
      ],
      "emergentStorylines": [
        "Refugees seeking sanctuary in the remaining safe cities",
        "Expeditions to recover powerful artifacts from danger zones",
        "New alliances forming between former enemies for survival"
      ]
    },
    {
      "beatIndex": 14,
      "beatName": "The New Dawn",
      "description": "From the chaos, a transformed world emerges. The rifts have stabilized into permanent features, creating new geography and ecosystems. Survivors have adapted, developing new forms of magic and technology. A council of representatives from various survivor groups governs the changed lands.",
      "worldDirectives": [
        "Settlements are built around rift-stabilizer technology",
        "Hybrid creatures from merged realities are integrated into society",
        "New trade routes navigate the transformed geography"
      ],
      "majorEvents": [
        "The First Council successfully prevents a major rift expansion",
        "Discovery of rift-diving techniques for resource gathering",
        "Establishment of the New Calendar marking the world's rebirth"
      ],
      "emergentStorylines": [
        "Exploration of the permanently changed territories",
        "Diplomatic contact with beings from other dimensions",
        "Tensions between those who embrace and resist the new reality"
      ]
    }
  ],
  "arcDetailedDescription": "This arc chronicles the complete transformation of a traditional fantasy realm into something entirely new. Beginning with subtle signs of instability, the world experiences a reality-shattering event that forces all inhabitants to abandon old conflicts and certainties. The narrative explores themes of adaptation, loss, and rebirth as characters navigate a world where the fundamental rules have changed. By the arc's end, what emerges is neither purely the old world nor entirely alien, but a unique fusion that opens infinite new possibilities for future stories."
}

KEY REQUIREMENTS:
✓ MUST have exactly 3 anchors
✓ beatIndex MUST be 0, 7, and 14 (in that order)
✓ Each anchor needs ALL fields: beatIndex, beatName, description, worldDirectives, majorEvents, emergentStorylines
✓ arcDetailedDescription should be 2-3 paragraphs explaining the overall arc

Remember: These anchors are THEMATIC GUIDES, not rigid scripts. They establish direction while allowing for player agency and emergent gameplay.`;

export function buildAnchorUserPrompt(
  worldName: string,
  worldDescription: string,
  storyIdea?: string,
  previousArcs: string[] = [],
  currentLocations: string = 'No locations currently exist in this world.',
  currentFactions: string = 'No factions currently exist in this world.',
  currentCharacters: string = 'No characters currently exist in this world.'
): string {
  return `Generate THREE anchor points for a world story arc.

World: ${worldName}
Description: ${worldDescription}

CURRENT STATE:
- Locations: ${currentLocations}
- Factions: ${currentFactions}
- Characters: ${currentCharacters}

${previousArcs.length ? `
PREVIOUS ARCS (build on this history):
${previousArcs.join('\n\n')}
` : ''}

${storyIdea ? `STORY SEED: ${storyIdea}` : 'Create an appropriate story based on the world state.'}

GENERATE:
1. Beat 0 (Opening): The world's starting equilibrium with underlying tensions
2. Beat 7 (Catalyst): A major disruption that changes everything  
3. Beat 14 (Resolution): The new world state after adaptation

Include an arcDetailedDescription that explains the arc's themes and transformation journey.

Follow the EXACT JSON structure shown in the system prompt example.`;
} 