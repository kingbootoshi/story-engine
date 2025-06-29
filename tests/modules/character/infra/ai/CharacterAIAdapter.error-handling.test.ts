import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterAIAdapter } from '../../../../../src/modules/character/infra/ai/CharacterAIAdapter';
import * as aiCore from '../../../../../src/core/ai';
import type { CharacterGenerationContext } from '../../../../../src/modules/character/domain/ports';

vi.mock('../../../../../src/core/ai', () => ({
  chat: vi.fn(),
  buildMetadata: vi.fn().mockReturnValue({ module: 'character', prompt_id: 'test' }),
  safeParseJSON: vi.fn(),
  extractToolCall: vi.fn(),
  retryWithBackoff: vi.fn(),
  AIValidationError: class AIValidationError extends Error {
    constructor(module: string, promptId: string, errors: any, data: any, context: any) {
      super('Validation error');
      this.name = 'AIValidationError';
    }
  },
  AIParsingError: class AIParsingError extends Error {
    constructor(module: string, promptId: string, rawResponse: string, parseError: Error, context: any) {
      super('Parsing error');
      this.name = 'AIParsingError';
    }
  },
  AIResponseError: class AIResponseError extends Error {
    constructor(module: string, promptId: string, message: string, response: any, context: any) {
      super(message);
      this.name = 'AIResponseError';
    }
  }
}));

describe('CharacterAIAdapter Error Handling', () => {
  let adapter: CharacterAIAdapter;
  let mockContext: CharacterGenerationContext;
  let mockTrace: any;

  beforeEach(() => {
    adapter = new CharacterAIAdapter();
    mockContext = {
      worldId: 'world-123',
      worldTheme: 'Fantasy Kingdom',
      targetCount: 3,
      availableLocations: [
        { id: 'loc-1', name: 'Castle Town' },
        { id: 'loc-2', name: 'Dark Forest' }
      ]
    };
    mockTrace = {
      reqId: 'req-123',
      user: { id: 'user-123' }
    };
    vi.clearAllMocks();
  });

  describe('generateCharacterBatch', () => {
    it('should handle malformed JSON response', async () => {
      const mockRetryWithBackoff = vi.mocked(aiCore.retryWithBackoff);
      mockRetryWithBackoff.mockResolvedValue({
        choices: [{ message: { tool_calls: [{ function: { name: 'generate_characters', arguments: 'invalid json' } }] } }]
      });

      const mockExtractToolCall = vi.mocked(aiCore.extractToolCall);
      mockExtractToolCall.mockReturnValue({
        function: { name: 'generate_characters', arguments: 'invalid json' }
      });

      const mockSafeParseJSON = vi.mocked(aiCore.safeParseJSON);
      mockSafeParseJSON.mockImplementation(() => {
        throw new aiCore.AIParsingError('character', 'generate_character_batch@v1', 'invalid json', new Error('Unexpected token'), {});
      });

      await expect(adapter.generateCharacterBatch(mockContext, mockTrace))
        .rejects.toThrow('Parsing error');
    });

    it('should handle validation errors', async () => {
      const mockRetryWithBackoff = vi.mocked(aiCore.retryWithBackoff);
      mockRetryWithBackoff.mockResolvedValue({
        choices: [{ message: { tool_calls: [{ function: { name: 'generate_characters', arguments: '{}' } }] } }]
      });

      const mockExtractToolCall = vi.mocked(aiCore.extractToolCall);
      mockExtractToolCall.mockReturnValue({
        function: { name: 'generate_characters', arguments: '{}' }
      });

      const mockSafeParseJSON = vi.mocked(aiCore.safeParseJSON);
      mockSafeParseJSON.mockReturnValue({ invalidStructure: true });

      await expect(adapter.generateCharacterBatch(mockContext, mockTrace))
        .rejects.toThrow('Validation error');
    });

    it('should handle missing tool call', async () => {
      const mockRetryWithBackoff = vi.mocked(aiCore.retryWithBackoff);
      mockRetryWithBackoff.mockResolvedValue({
        choices: [{ message: {} }]
      });

      const mockExtractToolCall = vi.mocked(aiCore.extractToolCall);
      mockExtractToolCall.mockImplementation(() => {
        throw new aiCore.AIResponseError('character', 'generate_character_batch@v1', 'No tool call found', {}, {});
      });

      await expect(adapter.generateCharacterBatch(mockContext, mockTrace))
        .rejects.toThrow('No tool call found');
    });

    it('should successfully retry on transient errors', async () => {
      const mockRetryWithBackoff = vi.mocked(aiCore.retryWithBackoff);
      let callCount = 0;
      mockRetryWithBackoff.mockImplementation(async (fn) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network timeout');
        }
        return {
          choices: [{ message: { tool_calls: [{ function: { name: 'generate_characters', arguments: '{"characters": []}' } }] } }]
        };
      });

      const mockExtractToolCall = vi.mocked(aiCore.extractToolCall);
      mockExtractToolCall.mockReturnValue({
        function: { name: 'generate_characters', arguments: '{"characters": []}' }
      });

      const mockSafeParseJSON = vi.mocked(aiCore.safeParseJSON);
      mockSafeParseJSON.mockReturnValue({ characters: [] });

      const result = await adapter.generateCharacterBatch(mockContext, mockTrace);
      expect(result).toEqual([]);
    });
  });
});