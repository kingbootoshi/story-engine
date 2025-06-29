import { describe, it, expect } from 'vitest';
import { 
  safeParseJSON, 
  extractToolCall, 
  retryWithBackoff,
  AIParsingError,
  AIResponseError,
  AIRetryExhaustedError
} from '../../../src/core/ai';

describe('AI Error Handling Utilities', () => {
  describe('safeParseJSON', () => {
    it('should parse valid JSON successfully', () => {
      const validJson = '{"name": "test", "value": 123}';
      const result = safeParseJSON(validJson, 'test-module', 'test-prompt');
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should throw AIParsingError on invalid JSON', () => {
      const invalidJson = '{invalid json}';
      expect(() => safeParseJSON(invalidJson, 'test-module', 'test-prompt'))
        .toThrow(AIParsingError);
    });

    it('should include context in error', () => {
      const invalidJson = '{invalid}';
      const context = { userId: 'user-123', worldId: 'world-456' };
      
      try {
        safeParseJSON(invalidJson, 'test-module', 'test-prompt', context);
      } catch (error) {
        expect(error).toBeInstanceOf(AIParsingError);
        expect((error as AIParsingError).context).toEqual(context);
        expect((error as AIParsingError).module).toBe('test-module');
        expect((error as AIParsingError).promptId).toBe('test-prompt');
      }
    });
  });

  describe('extractToolCall', () => {
    it('should extract valid tool call', () => {
      const completion = {
        choices: [{
          message: {
            tool_calls: [{
              function: {
                name: 'test_function',
                arguments: '{"data": "test"}'
              }
            }]
          }
        }]
      };

      const result = extractToolCall(completion as any, 'test_function', 'test-module', 'test-prompt');
      expect(result.function.name).toBe('test_function');
      expect(result.function.arguments).toBe('{"data": "test"}');
    });

    it('should throw AIResponseError when no tool calls', () => {
      const completion = {
        choices: [{
          message: {}
        }]
      };

      expect(() => extractToolCall(completion as any, 'test_function', 'test-module', 'test-prompt'))
        .toThrow(AIResponseError);
    });

    it('should throw AIResponseError when tool name mismatch', () => {
      const completion = {
        choices: [{
          message: {
            tool_calls: [{
              function: {
                name: 'wrong_function',
                arguments: '{"data": "test"}'
              }
            }]
          }
        }]
      };

      expect(() => extractToolCall(completion as any, 'test_function', 'test-module', 'test-prompt'))
        .toThrow(AIResponseError);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const operation = async () => 'success';
      const result = await retryWithBackoff(operation, 'test-module', 'test-prompt');
      expect(result).toBe('success');
    });

    it('should retry on failure and succeed', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success after retries';
      };

      const result = await retryWithBackoff(
        operation, 
        'test-module', 
        'test-prompt',
        { maxAttempts: 3, initialDelay: 10 }
      );
      
      expect(result).toBe('success after retries');
      expect(attempts).toBe(3);
    });

    it('should not retry validation errors', async () => {
      const validationError = new AIParsingError(
        'test-module',
        'test-prompt',
        'invalid',
        new Error('parse error')
      );

      const operation = async () => {
        throw validationError;
      };

      await expect(retryWithBackoff(operation, 'test-module', 'test-prompt'))
        .rejects.toThrow(AIParsingError);
    });

    it('should throw AIRetryExhaustedError after max attempts', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error('Persistent failure');
      };

      await expect(
        retryWithBackoff(
          operation,
          'test-module',
          'test-prompt',
          { maxAttempts: 2, initialDelay: 10 }
        )
      ).rejects.toThrow(AIRetryExhaustedError);

      expect(attempts).toBe(2);
    });
  });
});