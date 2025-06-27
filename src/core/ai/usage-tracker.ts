import { supabase } from '../infra/supabase';
import { createLogger } from '../infra/logger';
import type { ChatCompletion } from 'openai/resources/chat/completions';

const log = createLogger('ai:usage-tracker');

export interface UsageRecord {
  user_id: string;
  generation_id?: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost: number;
  module: string;
  prompt_id: string;
  world_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Tracks AI usage asynchronously to avoid blocking AI generation.
 * Captures token usage and costs for billing and analytics.
 */
export class UsageTracker {
  /**
   * Records AI usage to the database asynchronously.
   * Errors are logged but not thrown to avoid affecting AI operations.
   */
  async trackUsage(record: UsageRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_ai_usage')
        .insert({
          user_id: record.user_id,
          generation_id: record.generation_id,
          model: record.model,
          prompt_tokens: record.prompt_tokens,
          completion_tokens: record.completion_tokens,
          total_tokens: record.total_tokens,
          total_cost: record.total_cost,
          module: record.module,
          prompt_id: record.prompt_id,
          world_id: record.world_id,
          metadata: record.metadata || {},
        });

      if (error) {
        log.error('Failed to track AI usage', error, {
          user_id: record.user_id,
          module: record.module,
          prompt_id: record.prompt_id,
        });
      } else {
        log.debug('AI usage tracked', {
          user_id: record.user_id,
          model: record.model,
          tokens: record.total_tokens,
          cost: record.total_cost,
        });
      }
    } catch (err) {
      log.error('Unexpected error tracking AI usage', err, {
        user_id: record.user_id,
        module: record.module,
      });
    }
  }

  /**
   * Extracts usage data from OpenRouter response.
   * OpenRouter provides token counts but not costs directly in the response.
   */
  extractUsageFromResponse(
    response: ChatCompletion,
    model: string,
    metadata: { user_id: string; module: string; prompt_id: string; world_id?: string }
  ): Omit<UsageRecord, 'total_cost' | 'generation_id'> {
    const usage = response.usage;
    
    if (!usage) {
      throw new Error('No usage data in OpenRouter response');
    }

    return {
      user_id: metadata.user_id,
      model,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      module: metadata.module,
      prompt_id: metadata.prompt_id,
      world_id: metadata.world_id,
      metadata: {
        completion_id: response.id,
        created: response.created,
      },
    };
  }

  /**
   * Estimates cost based on model and token counts.
   * This is a fallback when we can't get exact costs from OpenRouter.
   * Costs are approximate and should be updated with actual pricing data.
   */
  estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Approximate costs per 1M tokens (these should be updated regularly)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'openai/gpt-4o': { prompt: 5.0, completion: 15.0 },
      'openai/gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
      'openai/gpt-4.1-nano': { prompt: 0.1, completion: 0.4 },
      'anthropic/claude-sonnet-4': { prompt: 3.0, completion: 15.0 },
    };

    const modelPricing = pricing[model] || { prompt: 1.0, completion: 3.0 };
    
    const promptCost = (promptTokens / 1_000_000) * modelPricing.prompt;
    const completionCost = (completionTokens / 1_000_000) * modelPricing.completion;
    
    return promptCost + completionCost;
  }
}

export const usageTracker = new UsageTracker();