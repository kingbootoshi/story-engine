import { injectable } from 'tsyringe';
import { chat, buildMetadata } from '../../../../core/ai';
import { createLogger } from '../../../../core/infra/logger';
import type { IFactionAI } from '../../domain/ports';
import type { CreateFaction, Faction, FactionRelation, DiplomaticStance } from '../../domain/schema';
import { GENERATE_FACTION_SYSTEM_PROMPT, buildGenerateFactionUserPrompt } from './prompts/generateFaction.prompts';
import { UPDATE_DOCTRINE_SYSTEM_PROMPT, buildDoctrineUpdateUserPrompt } from './prompts/doctrineUpdate.prompts';
import { EVALUATE_RELATIONS_SYSTEM_PROMPT, buildEvaluateRelationsUserPrompt } from './prompts/relations.prompts';

const log = createLogger('faction.ai');

const GENERATE_FACTION_SCHEMA = {
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

const UPDATE_DOCTRINE_SCHEMA = {
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

const EVALUATE_RELATIONS_SCHEMA = {
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

@injectable()
export class FactionAIAdapter implements IFactionAI {
  private readonly MODULE = 'faction';

  async generateFaction(params: {
    worldId: string;
    worldTheme: string;
    existingFactions: string[];
    locationContext?: string;
    userId?: string;
  }): Promise<CreateFaction> {
    log.debug('AI call', { promptId: 'generate_faction@v1' });
    
    const completion = await chat({
      messages: [
        { role: 'system', content: GENERATE_FACTION_SYSTEM_PROMPT },
        { role: 'user', content: buildGenerateFactionUserPrompt(
          params.worldTheme,
          params.existingFactions,
          params.locationContext
        )}
      ],
      tools: [GENERATE_FACTION_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'generate_faction' } },
      temperature: 0.9,
      max_tokens: 1500,
      metadata: buildMetadata(this.MODULE, 'generate_faction@v1', params.userId || 'anonymous', { world_id: params.worldId })
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const args = JSON.parse(toolCall.function.arguments);
    log.info('AI success', { 
      ai: { 
        prompt_id: 'generate_faction@v1', 
        usage: completion.usage 
      } 
    });
    
    return {
      world_id: params.worldId,
      name: args.name,
      ideology: args.ideology,
      status: args.status,
      members_estimate: args.members_estimate,
      tags: args.tags,
      banner_color: args.banner_color,
      emblem_svg: null,
      home_location_id: null,
      controlled_locations: []
    };
  }

  async updateDoctrine(params: {
    faction: Faction;
    statusChange: { from: string; to: string; reason: string };
    worldContext: string;
    userId?: string;
  }): Promise<{ ideology: string; tags: string[] }> {
    log.debug('AI call', { promptId: 'update_doctrine@v1' });
    
    const completion = await chat({
      messages: [
        { role: 'system', content: UPDATE_DOCTRINE_SYSTEM_PROMPT },
        { role: 'user', content: buildDoctrineUpdateUserPrompt(
          params.faction.name,
          params.faction.ideology,
          params.faction.tags,
          params.statusChange,
          params.worldContext
        )}
      ],
      tools: [UPDATE_DOCTRINE_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'update_doctrine' } },
      temperature: 0.8,
      max_tokens: 1000,
      metadata: buildMetadata(this.MODULE, 'update_doctrine@v1', params.userId || 'anonymous', { 
        faction_id: params.faction.id,
        status_change: `${params.statusChange.from}_to_${params.statusChange.to}`
      })
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const args = JSON.parse(toolCall.function.arguments);
    log.info('AI success', { 
      ai: { 
        prompt_id: 'update_doctrine@v1', 
        usage: completion.usage 
      } 
    });
    
    return {
      ideology: args.ideology,
      tags: args.tags
    };
  }

  async evaluateRelations(params: {
    worldId: string;
    factions: Faction[];
    currentRelations: FactionRelation[];
    beatContext: string;
    userId?: string;
  }): Promise<Array<{
    sourceId: string;
    targetId: string;
    suggestedStance: DiplomaticStance;
    reason: string;
  }>> {
    log.debug('AI call', { promptId: 'evaluate_relations@v1' });
    
    const factionSummaries = params.factions.map(f => ({
      id: f.id,
      name: f.name,
      ideology: f.ideology,
      status: f.status,
      tags: f.tags
    }));
    
    const completion = await chat({
      messages: [
        { role: 'system', content: EVALUATE_RELATIONS_SYSTEM_PROMPT },
        { role: 'user', content: buildEvaluateRelationsUserPrompt(
          factionSummaries,
          params.currentRelations.map(r => ({
            sourceId: r.source_id,
            targetId: r.target_id,
            stance: r.stance
          })),
          params.beatContext
        )}
      ],
      tools: [EVALUATE_RELATIONS_SCHEMA],
      tool_choice: { type: 'function', function: { name: 'evaluate_relations' } },
      temperature: 0.7,
      max_tokens: 2000,
      metadata: buildMetadata(this.MODULE, 'evaluate_relations@v1', params.userId || 'anonymous', { 
        world_id: params.worldId,
        faction_count: params.factions.length
      })
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const args = JSON.parse(toolCall.function.arguments);
    log.info('AI success', { 
      ai: { 
        prompt_id: 'evaluate_relations@v1', 
        usage: completion.usage 
      },
      suggestions_count: args.suggestions.length
    });
    
    return args.suggestions;
  }

  async generatePropaganda(params: {
    faction: Faction;
    targetAudience: string;
    topic: string;
  }): Promise<string> {
    log.debug('AI call', { promptId: 'generate_propaganda@v1' });
    
    const completion = await chat({
      messages: [
        { 
          role: 'system', 
          content: `You are creating propaganda material for a faction. Match the tone and style to their ideology and current status. Be dramatic but believable.` 
        },
        { 
          role: 'user', 
          content: `Create propaganda for:
Faction: ${params.faction.name} (${params.faction.status})
Ideology: ${params.faction.ideology}
Target Audience: ${params.targetAudience}
Topic: ${params.topic}

Write 2-3 paragraphs of compelling propaganda that advances the faction's interests.`
        }
      ],
      temperature: 0.9,
      max_tokens: 500,
      metadata: buildMetadata(this.MODULE, 'generate_propaganda@v1', 'anonymous', { 
        faction_id: params.faction.id 
      })
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from AI');
    }
    
    log.info('AI success', { 
      ai: { 
        prompt_id: 'generate_propaganda@v1', 
        usage: completion.usage 
      } 
    });
    
    return content;
  }
}