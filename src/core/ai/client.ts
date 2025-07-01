import OpenAI from 'openpipe/openai';
import { log } from '../infra/logger';
import { env } from '../../shared/config/env';
import { modelRegistry, type ModelType } from './registry';
import { validateMetadata, type AIMetadata } from './metadata';
import { usageTracker } from './usage-tracker';

const client = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'X-Title': 'Story Engine',
  },
  openpipe: {
    apiKey: env.OPENPIPE_API_KEY
  }
});

export interface ChatParams {
  /** defaults to modelRegistry.getDefault() if omitted */
  model?: string;
  /** Model type to use if model not specified. Defaults to 'smart' for backward compatibility */
  modelType?: ModelType;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  tools?: any[];
  tool_choice?: any;
  temperature?: number;
  max_tokens?: number;
  /** MANDATORY metadata for observability */
  metadata: AIMetadata;
}

export async function chat(params: ChatParams): Promise<any> {
  // Determine model based on explicit model, model type, or default
  const model = params.model ?? 
    (params.modelType ? modelRegistry.getDefaultForType(params.modelType) : modelRegistry.getDefault());
  const startTime = Date.now();
  
  try {
    // ────────────────────────────────────────────────────────────────────
    // Enforce metadata contract (module + prompt_id are REQUIRED).  We
    // validate early so that any omission fails fast in development and
    // never reaches the expensive network call.
    // ────────────────────────────────────────────────────────────────────
    validateMetadata(params.metadata);

    const completion = await client.chat.completions.create({
      model,
      messages: params.messages,
      tools: params.tools,
      tool_choice: params.tool_choice,
      temperature: params.temperature,
      max_tokens: params.max_tokens,
      metadata: params.metadata
    });
    
    const duration_ms = Date.now() - startTime;
    
    log.info('AI call', {
      model,
      duration_ms,
      usage: completion.usage,
      ...params.metadata,
    });

    // Track usage asynchronously - fire and forget to avoid blocking
    if (completion.usage) {
      const usageData = usageTracker.extractUsageFromResponse(
        completion,
        model,
        params.metadata
      );
      
      // Extract generation ID from response headers if available
      // Note: OpenRouter may include this in x-generation-id header
      const generationId = (completion as any).headers?.['x-generation-id'];
      
      // Estimate cost based on model and tokens
      const totalCost = usageTracker.estimateCost(
        model,
        completion.usage.prompt_tokens || 0,
        completion.usage.completion_tokens || 0
      );
      
      // Track usage without awaiting to avoid blocking the response
      usageTracker.trackUsage({
        ...usageData,
        generation_id: generationId,
        total_cost: totalCost,
      }).catch((err) => {
        log.error('Failed to track usage asynchronously', err, {
          user_id: params.metadata.user_id,
          module: params.metadata.module,
        });
      });
    }
    
    return completion;
  } catch (error) {
    log.error('AI call failed', error, {
      model,
      ...params.metadata,
    });
    throw error;
  }
}