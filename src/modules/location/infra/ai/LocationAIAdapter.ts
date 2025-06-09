import { injectable } from 'tsyringe';
import { z } from 'zod';
import { chat } from '../../../../core/ai/client';
import { buildMetadata } from '../../../../core/ai/metadata';
import { createLogger } from '../../../../core/infra/logger';
import type { 
  LocationAI, 
  MapGenerationContext, 
  MapGenerationResult, 
  LocationMutationContext, 
  LocationMutations,
  EnrichmentContext 
} from '../../domain/ports';
import { 
  buildWorldMapPrompt, 
  WORLD_MAP_GENERATION_SCHEMA 
} from './prompts/worldMap.prompts';
import { 
  buildLocationMutationPrompt, 
  LOCATION_MUTATION_SCHEMA 
} from './prompts/locationMutation.prompts';

const logger = createLogger('location.ai');

/**
 * AI adapter for location-related operations
 */
@injectable()
export class LocationAIAdapter implements LocationAI {
  
  /**
   * Generate initial world map with 8-15 locations
   */
  async buildWorldMap(context: MapGenerationContext): Promise<MapGenerationResult> {
    const startTime = Date.now();
    const promptSize = JSON.stringify(context).length;
    
    logger.info('Calling AI for world map generation', {
      worldName: context.worldName,
      promptSize,
      correlation: context.worldName
    });

    try {
      const messages = buildWorldMapPrompt(context);
      
      const completion = await chat({
        messages,
        tools: [{ type: 'function', function: WORLD_MAP_GENERATION_SCHEMA }],
        tool_choice: { type: 'function', function: { name: 'generate_world_map' } },
        temperature: 0.8,
        metadata: buildMetadata('location', 'generate_world_map@v1', {
          world_name: context.worldName,
          correlation: context.worldName
        })
      });

      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall || !toolCall.function) {
        throw new Error('No tool call in AI response');
      }

      const result = JSON.parse(toolCall.function.arguments);
      
      const duration_ms = Date.now() - startTime;
      logger.info('AI world map generation complete', {
        worldName: context.worldName,
        locationCount: result.locations.length,
        hasMapSvg: !!result.mapSvg,
        duration_ms,
        tokens: completion.usage,
        correlation: context.worldName
      });

      const validationResult = validateMapGenerationResult(result);
      if (!validationResult.success) {
        logger.error('Schema validation failed for world map', validationResult.error, {
          worldName: context.worldName
        });
        throw new Error('Invalid world map generation result');
      }

      return result;
      
    } catch (error) {
      logger.error('Failed to generate world map', error, {
        worldName: context.worldName,
        correlation: context.worldName
      });
      throw error;
    }
  }

  /**
   * Analyze beat and determine location mutations
   */
  async mutateLocations(context: LocationMutationContext): Promise<LocationMutations> {
    const startTime = Date.now();
    const promptSize = JSON.stringify(context).length;
    
    logger.info('Calling AI for location mutations', {
      worldId: context.worldId,
      locationCount: context.currentLocations.length,
      promptSize,
      correlation: context.worldId
    });

    try {
      const messages = buildLocationMutationPrompt(context);
      
      const completion = await chat({
        messages,
        tools: [{ type: 'function', function: LOCATION_MUTATION_SCHEMA }],
        tool_choice: { type: 'function', function: { name: 'mutate_locations' } },
        temperature: 0.7,
        metadata: buildMetadata('location', 'mutate_locations@v1', {
          world_id: context.worldId,
          correlation: context.worldId
        })
      });

      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall || !toolCall.function) {
        throw new Error('No tool call in AI response');
      }

      const result = JSON.parse(toolCall.function.arguments);
      
      const duration_ms = Date.now() - startTime;
      logger.info('AI location mutation analysis complete', {
        worldId: context.worldId,
        updateCount: result.updates.length,
        discoveryCount: result.discoveries.length,
        duration_ms,
        tokens: completion.usage,
        correlation: context.worldId
      });

      const validationResult = validateLocationMutations(result);
      if (!validationResult.success) {
        logger.error('Schema validation failed for mutations', validationResult.error, {
          worldId: context.worldId
        });
        throw new Error('Invalid location mutations result');
      }

      return result;
      
    } catch (error) {
      logger.error('Failed to analyze location mutations', error, {
        worldId: context.worldId,
        correlation: context.worldId
      });
      throw error;
    }
  }

  /**
   * Enrich a location's description with more detail
   */
  async enrichDescription(context: EnrichmentContext): Promise<string> {
    const startTime = Date.now();
    
    logger.info('Calling AI for description enrichment', {
      locationId: context.location.id,
      locationName: context.location.name,
      correlation: context.location.world_id
    });

    try {
      const messages = [
        {
          role: 'system' as const,
          content: `You are a creative world-building assistant. Enrich the description of a location with vivid details, atmosphere, and narrative hooks.

Current location: ${context.location.name} (${context.location.type})
Status: ${context.location.status}
Current description: ${context.location.description}

World context: ${context.worldContext}

${context.recentEvents?.length ? `Recent events:\n${context.recentEvents.join('\n')}` : ''}

Provide an enriched description that:
1. Maintains consistency with existing details
2. Adds sensory details and atmosphere
3. Hints at potential story hooks
4. Reflects the location's current status
5. Stays under 500 words`
        },
        {
          role: 'user' as const,
          content: 'Generate an enriched description for this location.'
        }
      ];

      const completion = await chat({
        messages,
        temperature: 0.8,
        max_tokens: 800,
        metadata: buildMetadata('location', 'enrich_description@v1', {
          location_id: context.location.id,
          world_id: context.location.world_id,
          correlation: context.location.world_id
        })
      });

      const enrichedDescription = completion.choices[0]?.message?.content;
      if (!enrichedDescription) {
        throw new Error('No content in AI response');
      }

      const duration_ms = Date.now() - startTime;
      logger.info('AI description enrichment complete', {
        locationId: context.location.id,
        originalLength: context.location.description.length,
        enrichedLength: enrichedDescription.length,
        duration_ms,
        tokens: completion.usage,
        correlation: context.location.world_id
      });

      return enrichedDescription;
      
    } catch (error) {
      logger.error('Failed to enrich description', error, {
        locationId: context.location.id,
        correlation: context.location.world_id
      });
      throw error;
    }
  }
}

/**
 * Validation schemas
 */
const MapGenerationResultSchema = z.object({
  locations: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    parent_region_name: z.string().optional(),
    tags: z.array(z.string()),
    relative_position: z.object({
      x: z.number(),
      y: z.number()
    })
  })),
  mapSvg: z.string().optional()
});

const LocationMutationsSchema = z.object({
  updates: z.array(z.object({
    locationId: z.string(),
    newStatus: z.string().optional(),
    descriptionAppend: z.string().optional(),
    reason: z.string()
  })),
  discoveries: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    parentRegionName: z.string().optional(),
    tags: z.array(z.string())
  }))
});

function validateMapGenerationResult(result: any) {
  return MapGenerationResultSchema.safeParse(result);
}

function validateLocationMutations(result: any) {
  return LocationMutationsSchema.safeParse(result);
}