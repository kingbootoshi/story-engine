import { injectable } from 'tsyringe';
import { 
  chat, 
  buildMetadata, 
  safeParseJSON, 
  extractToolCall, 
  retryWithBackoff,
  AIValidationError 
} from '../../../../core/ai';
import { createLogger } from '../../../../core/infra/logger';
import type { IFactionAI } from '../../domain/ports';
import type { CreateFaction, Faction, FactionRelation, DiplomaticStance } from '../../domain/schema';
import { GENERATE_FACTION_SYSTEM_PROMPT, buildGenerateFactionUserPrompt } from './prompts/generateFaction.prompts';
import { UPDATE_DOCTRINE_SYSTEM_PROMPT, buildDoctrineUpdateUserPrompt } from './prompts/doctrineUpdate.prompts';
import { EVALUATE_RELATIONS_SYSTEM_PROMPT, buildEvaluateRelationsUserPrompt } from './prompts/relations.prompts';
import { GenerateFactionResponseSchema, UpdateDoctrineResponseSchema, EvaluateRelationsResponseSchema } from './schemas';
import { GENERATE_FACTION_SCHEMA, UPDATE_DOCTRINE_SCHEMA, EVALUATE_RELATIONS_SCHEMA } from './toolSchemas';

const log = createLogger('faction.ai');


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
    const promptId = 'generate_faction@v1';
    const contextData = { worldId: params.worldId };
    
    log.debug('AI call', { promptId });
    
    try {
      const completion = await retryWithBackoff(
        () => chat({
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
          metadata: buildMetadata(this.MODULE, promptId, params.userId || 'anonymous', { world_id: params.worldId })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(
        completion,
        'generate_faction',
        contextData
      );

      const parsedData = safeParseJSON(
        toolCall.function.arguments,
        contextData
      );

      const validationResult = GenerateFactionResponseSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(
          validationResult.error,
          parsedData,
          contextData
        );
      }

      const args = validationResult.data;
      log.info('AI success', { 
        ai: { 
          prompt_id: promptId, 
          usage: completion.usage 
        },
        factionName: args.name
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
    } catch (error) {
      log.error('Failed to generate faction', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }

  async updateDoctrine(params: {
    faction: Faction;
    statusChange: { from: string; to: string; reason: string };
    worldContext: string;
    userId?: string;
  }): Promise<{ ideology: string; tags: string[] }> {
    const promptId = 'update_doctrine@v1';
    const contextData = {
      factionId: params.faction.id,
      statusChange: `${params.statusChange.from}_to_${params.statusChange.to}`
    };
    
    log.debug('AI call', { promptId });
    
    try {
      const completion = await retryWithBackoff(
        () => chat({
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
          metadata: buildMetadata(this.MODULE, promptId, params.userId || 'anonymous', { 
            faction_id: params.faction.id,
            status_change: `${params.statusChange.from}_to_${params.statusChange.to}`
          })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(
        completion,
        'update_doctrine',
        contextData
      );

      const parsedData = safeParseJSON(
        toolCall.function.arguments,
        contextData
      );

      const validationResult = UpdateDoctrineResponseSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(
          validationResult.error,
          parsedData,
          contextData
        );
      }

      const args = validationResult.data;
      log.info('AI success', { 
        ai: { 
          prompt_id: promptId, 
          usage: completion.usage 
        },
        factionId: params.faction.id
      });
      
      return {
        ideology: args.ideology,
        tags: args.tags
      };
    } catch (error) {
      log.error('Failed to update doctrine', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
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
    const promptId = 'evaluate_relations@v1';
    const contextData = {
      worldId: params.worldId,
      factionCount: params.factions.length
    };
    
    log.debug('AI call', { promptId });
    
    try {
      const factionSummaries = params.factions.map(f => ({
        id: f.id,
        name: f.name,
        ideology: f.ideology,
        status: f.status,
        tags: f.tags
      }));
      
      const completion = await retryWithBackoff(
        () => chat({
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
          metadata: buildMetadata(this.MODULE, promptId, params.userId || 'anonymous', { 
            world_id: params.worldId,
            faction_count: params.factions.length
          })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const toolCall = extractToolCall(
        completion,
        'evaluate_relations',
        contextData
      );

      const parsedData = safeParseJSON(
        toolCall.function.arguments,
        contextData
      );

      const validationResult = EvaluateRelationsResponseSchema.safeParse(parsedData);
      if (!validationResult.success) {
        throw new AIValidationError(
          validationResult.error,
          parsedData,
          contextData
        );
      }

      const args = validationResult.data;
      log.info('AI success', { 
        ai: { 
          prompt_id: promptId, 
          usage: completion.usage 
        },
        suggestions_count: args.suggestions.length
      });
      
      return args.suggestions;
    } catch (error) {
      log.error('Failed to evaluate relations', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }

  async generatePropaganda(params: {
    faction: Faction;
    targetAudience: string;
    topic: string;
  }): Promise<string> {
    const promptId = 'generate_propaganda@v1';
    const contextData = { factionId: params.faction.id };
    
    log.debug('AI call', { promptId });
    
    try {
      const completion = await retryWithBackoff(
        () => chat({
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
          metadata: buildMetadata(this.MODULE, promptId, 'anonymous', { 
            faction_id: params.faction.id 
          })
        }),
        { maxAttempts: 3 },
        contextData
      );

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No content returned from AI');
      }
      
      log.info('AI success', { 
        ai: { 
          prompt_id: promptId, 
          usage: completion.usage 
        },
        contentLength: content.length
      });
      
      return content;
    } catch (error) {
      log.error('Failed to generate propaganda', {
        error: error instanceof Error ? error.message : String(error),
        rawResponse: (error as any).rawResponse,
        ...contextData
      });
      throw new Error('AI returned an invalid response');
    }
  }
}