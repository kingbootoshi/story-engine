export const GENERATE_FACTION_SCHEMA = {
  type: "function",
  function: {
    name: "generate_faction",
    description: "Generate a new faction for the world",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The faction's name"
        },
        ideology: {
          type: "string",
          description: "The faction's core beliefs and motivations (2-3 sentences)"
        },
        status: {
          type: "string",
          enum: ["rising", "stable", "declining"],
          description: "The faction's current status"
        },
        members_estimate: {
          type: "number",
          description: "Estimated member count (use powers of 10)"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "3-5 descriptive tags"
        },
        banner_color: {
          type: ["string", "null"],
          description: "Optional hex color for faction banner"
        }
      },
      required: ["name", "ideology", "status", "members_estimate", "tags", "banner_color"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

export const UPDATE_DOCTRINE_SCHEMA = {
  type: "function",
  function: {
    name: "update_doctrine",
    description: "Update faction ideology and tags based on status change",
    parameters: {
      type: "object",
      properties: {
        ideology: {
          type: "string",
          description: "Updated ideology reflecting the faction's evolution"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "3-5 updated tags"
        }
      },
      required: ["ideology", "tags"],
      additionalProperties: false
    },
    strict: true
  }
} as const;

export const EVALUATE_RELATIONS_SCHEMA = {
  type: "function",
  function: {
    name: "evaluate_relations",
    description: "Suggest faction relationship changes based on world events",
    parameters: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sourceId: {
                type: "string",
                description: "Source faction ID"
              },
              targetId: {
                type: "string",
                description: "Target faction ID"
              },
              suggestedStance: {
                type: "string",
                enum: ["ally", "neutral", "hostile"],
                description: "Suggested diplomatic stance"
              },
              reason: {
                type: "string",
                description: "Clear reason for the suggested change"
              }
            },
            required: ["sourceId", "targetId", "suggestedStance", "reason"],
            additionalProperties: false
          }
        }
      },
      required: ["suggestions"],
      additionalProperties: false
    },
    strict: true
  }
} as const;