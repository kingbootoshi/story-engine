export const WORLD_ARC_ANCHORS_SCHEMA = {
  type: "function",
  function: {
    name: "generate_world_arc_anchors",
    description: "Generate three anchor points for a world story arc",
    parameters: {
      type: "object",
      properties: {
        anchors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              beatIndex: {
                type: "number",
                enum: [0, 7, 14],
                description: "The beat index (0, 7, or 14)"
              },
              beatName: {
                type: "string",
                description: "A descriptive name for this world event/era"
              },
              description: {
                type: "string",
                description: "Detailed description of the world state and ongoing changes"
              },
              worldDirectives: {
                type: "array",
                items: { type: "string" },
                description: "Clear directives on how different factions, regions, or systems should behave"
              },
              majorEvents: {
                type: "array",
                items: { type: "string" },
                description: "Major events or phenomena occurring during this period"
              },
              emergentStorylines: {
                type: "array",
                items: { type: "string" },
                description: "3-5 emergent storylines that players might engage with"
              }
            },
            required: ["beatIndex", "beatName", "description", "worldDirectives", "majorEvents", "emergentStorylines"],
            additionalProperties: false
          },
          minItems: 3,
          maxItems: 3
        },
        arcDetailedDescription: {
          type: "string",
          description: "A detailed 2-3 paragraph description of the arc's overall narrative theme and trajectory"
        }
      },
      required: ["anchors", "arcDetailedDescription"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

export const DYNAMIC_WORLD_BEAT_SCHEMA = {
  type: "function",
  function: {
    name: "generate_dynamic_world_beat",
    description: "Generate a dynamic world beat within an existing story arc",
    parameters: {
      type: "object",
      properties: {
        beatName: {
          type: "string",
          description: "A descriptive name for this world event/period"
        },
        description: {
          type: "string",
          description: "Detailed description of world changes and their cascading effects"
        },
        worldDirectives: {
          type: "array",
          items: { type: "string" },
          description: "Directives for how different regions, factions, or systems respond"
        },
        emergingConflicts: {
          type: "array",
          items: { type: "string" },
          description: "3-5 emerging conflicts or opportunities"
        },
        environmentalChanges: {
          type: ["array", "null"],
          items: { type: "string" },
          description: "Environmental or metaphysical changes if applicable"
        }
      },
      required: ["beatName", "description", "worldDirectives", "emergingConflicts", "environmentalChanges"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

export const ARC_SUMMARY_SCHEMA = {
  type: "function",
  function: {
    name: "generate_arc_summary",
    description: "Generate a comprehensive summary of a completed world arc",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "2-3 paragraph summary capturing the essential world transformation"
        },
        majorChanges: {
          type: "array",
          items: { type: "string" },
          description: "List of major world changes and their effects"
        },
        affectedRegions: {
          type: "array",
          items: { type: "string" },
          description: "How different regions/factions were affected"
        },
        thematicProgression: {
          type: "string",
          description: "Overall thematic progression and meaning"
        },
        futureImplications: {
          type: "array",
          items: { type: "string" },
          description: "Future possibilities and implications for the world"
        }
      },
      required: ["summary", "majorChanges", "affectedRegions", "thematicProgression", "futureImplications"],
      additionalProperties: false
    },
    strict: true
  }
} as const;