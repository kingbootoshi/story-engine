import { createLogger } from '../infra/logger';
import { AIParsingError, AIResponseError, AIRetryableError } from './errors';
import type { ChatCompletion } from 'openai/resources/chat/completions';

const logger = createLogger('ai.utils');

/**
 * Default retry configuration
 */
export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Safely parse JSON with error handling
 */
export function safeParseJSON(
  jsonString: string,
  context?: Record<string, any>
): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.error('JSON parsing failed', {
      error: error instanceof Error ? error.message : String(error),
      jsonLength: jsonString.length,
      jsonPreview: jsonString.substring(0, 200),
      ...context,
    });
    throw new AIParsingError(
      jsonString,
      context,
      error
    );
  }
}

/**
 * Safely extract tool call from AI response
 */
export function extractToolCall(
  completion: ChatCompletion,
  toolName: string,
  context?: Record<string, any>
): { function: { name: string; arguments: string } } {
  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  
  if (!toolCall || !toolCall.function) {
    logger.error('No tool call in AI response', {
      hasChoices: !!completion.choices?.length,
      hasMessage: !!completion.choices?.[0]?.message,
      hasToolCalls: !!completion.choices?.[0]?.message?.tool_calls,
      ...context,
    });
    throw new AIResponseError(
      `Expected tool call '${toolName}' not found in AI response`,
      completion,
      context
    );
  }

  if (toolCall.function.name !== toolName) {
    logger.error('Unexpected tool call name', {
      expected: toolName,
      actual: toolCall.function.name,
      ...context,
    });
    throw new AIResponseError(
      `Expected tool '${toolName}' but got '${toolCall.function.name}'`,
      completion,
      context
    );
  }

  return toolCall;
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {},
  context?: Record<string, any>
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;
  let delay = cfg.initialDelay;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      logger.debug('Attempting operation', {
        attempt,
        maxAttempts: cfg.maxAttempts,
        ...context,
      });
      
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry validation errors - they won't succeed on retry
      if (
        error instanceof AIParsingError ||
        error instanceof AIResponseError ||
        (error as any).name === 'AIValidationError'
      ) {
        throw error;
      }

      if (attempt === cfg.maxAttempts) {
        logger.error('All retry attempts exhausted', {
          error: lastError.message,
          attempts: cfg.maxAttempts,
          ...context,
        });
        throw new AIRetryableError(
          `Failed after ${cfg.maxAttempts} attempts: ${lastError.message}`,
          undefined,
          context,
          lastError
        );
      }

      logger.warn('Operation failed, retrying', {
        attempt,
        maxAttempts: cfg.maxAttempts,
        delay,
        error: lastError.message,
        ...context,
      });

      await sleep(delay);
      delay = Math.min(delay * cfg.backoffMultiplier, cfg.maxDelay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new AIRetryableError(
    `Failed after ${cfg.maxAttempts} attempts: ${lastError!.message}`,
    undefined,
    context,
    lastError!
  );
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Logger helpers
// ---------------------------------------------------------------------------

// Helper alias for the simple logging methods that share the same signature.
type LoggerMethod = (message: string, meta?: Record<string, unknown>) => void;

/**
 * Public contract exposed by `createLogger()`.
 *
 * We intentionally list only the methods that callers should rely on – this
 * prevents accidental dependence on internals and, critically, keeps the
 * compiler from leaking private members in the exported function type (see
 * TS4094 build error during production build).
 */
export interface PublicLogger {
  error: LoggerMethod;
  warn: LoggerMethod;
  info: LoggerMethod;
  debug: LoggerMethod;
  http: LoggerMethod;
  success: LoggerMethod;
  logAPICall: (...args: any[]) => void;
  logAICall: (...args: any[]) => void;
  logDBOperation: (
    operation: string,
    table: string,
    data?: unknown,
    result?: unknown,
    error?: unknown
  ) => void;
  logArcProgression: (
    worldId: string,
    arcId: string,
    beatIndex: number,
    action: string,
    details?: Record<string, unknown>
  ) => void;
}

/**
 * Create a logger with module context
 */
export function createModuleLogger(moduleName: string): PublicLogger {
  // `as unknown as` is required because our helper returns the broader Logger
  // class which contains additional private members. The assertion is safe –
  // all listed methods exist and maintain the correct runtime behaviour.
  return createLogger(`ai.${moduleName}`) as unknown as PublicLogger;
}