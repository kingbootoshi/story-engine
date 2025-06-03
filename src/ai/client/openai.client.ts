import OpenAI from 'openpipe/openai';
// Using `unknown` for the schema type keeps this wrapper flexible, accepting either
// raw JSON Schema objects or Zod-generated schemas converted to JSON. The OpenPipe
// SDK ultimately only needs a plain JSON schema object.
type JSONSchema = Record<string, any>;
import { log } from '../../shared/utils/logger';
import { env } from '../../shared/config/env';

// ---------------------------------------------------------------------------
// OpenAI (OpenRouter) Client Wrapper
// ---------------------------------------------------------------------------

const baseURL = 'https://openrouter.ai/api/v1';

export const openaiClient = new OpenAI({
  baseURL,
  apiKey: env.OPENROUTER_API_KEY,
  openpipe: { apiKey: env.OPENPIPE_API_KEY },
});

interface ChatCompletionParams {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  schema: JSONSchema;
}

export async function chatCompletion({ model, messages, schema }: ChatCompletionParams) {
  try {
    const completion = await openaiClient.chat.completions.create({
      model,
      messages,
      tools: [
        {
          type: 'function',
          function: { name: 'payload', parameters: schema },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'payload' } },
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    log.info('AI call success', { model, tokens: completion.usage });

    return { toolCall };
  } catch (err) {
    log.error('AI call failed', err);
    throw err;
  }
} 