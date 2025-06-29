export { chat, type ChatParams } from './client';
export { buildMetadata, type AIMetadata } from './metadata';
export { modelRegistry } from './registry';
export { 
  safeParseJSON, 
  extractToolCall, 
  retryWithBackoff,
  type RetryConfig 
} from './utils';
export {
  AIError,
  AIParsingError,
  AIValidationError,
  AIResponseError,
  AIRetryableError
} from './errors';