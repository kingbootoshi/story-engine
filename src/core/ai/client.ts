import OpenAI from 'openpipe/openai';
import { log } from '../infra/logger';
import { env } from '../../shared/config/env';
import { modelRegistry } from './registry';
import type { AIMetadata } from './metadata';

const client = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: 'https://api.openrouter.ai/api/v1',
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
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  tools?: any[];
  tool_choice?: any;
  temperature?: number;
  max_tokens?: number;
  /** MANDATORY metadata for observability */
  metadata: AIMetadata;
}

export async function chat(params: ChatParams): Promise<any> {
  const model = params.model ?? modelRegistry.getDefault();
  const startTime = Date.now();
  
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: params.messages,
      tools: params.tools,
      tool_choice: params.tool_choice,
      temperature: params.temperature,
      max_tokens: params.max_tokens,
    });
    
    const duration_ms = Date.now() - startTime;
    
    log.info('AI call', {
      model,
      duration_ms,
      usage: completion.usage,
      ...params.metadata,
    });
    
    return completion;
  } catch (error) {
    log.error('AI call failed', error, {
      model,
      ...params.metadata,
    });
    throw error;
  }
}