import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createLogger } from '../../src/core/infra/logger';

describe('Core Logger', () => {
  // Use the actual logger implementation since mocking winston is complex
  // We'll test the logger's public API behavior instead
  
  it('should create logger instances with different module names', () => {
    const logger1 = createLogger('module1');
    const logger2 = createLogger('module2');
    
    // Test that we can create loggers and they have the expected methods
    expect(logger1).toBeDefined();
    expect(logger2).toBeDefined();
    expect(logger1).not.toBe(logger2);
    
    // Check that all expected methods exist
    expect(typeof logger1.info).toBe('function');
    expect(typeof logger1.error).toBe('function');
    expect(typeof logger1.warn).toBe('function');
    expect(typeof logger1.debug).toBe('function');
    expect(typeof logger1.success).toBe('function');
    expect(typeof logger1.logAICall).toBe('function');
    expect(typeof logger1.logDBOperation).toBe('function');
    expect(typeof logger1.logArcProgression).toBe('function');
  });

  it('should handle error logging with Error objects', () => {
    const logger = createLogger('error-test');
    const error = new Error('Test error message');
    
    // This should not throw
    expect(() => {
      logger.error('Operation failed', error, { context: 'test' });
    }).not.toThrow();
  });

  it('should handle error logging with non-Error objects', () => {
    const logger = createLogger('error-test');
    const error = { code: 'ERR_001', message: 'Custom error' };
    
    // This should not throw
    expect(() => {
      logger.error('Operation failed', error, { context: 'test' });
    }).not.toThrow();
  });

  it('should handle success logging', () => {
    const logger = createLogger('success-test');
    
    // This should not throw
    expect(() => {
      logger.success('Operation completed', { id: '123' });
    }).not.toThrow();
  });

  it('should handle AI call logging', () => {
    const logger = createLogger('ai-test');
    
    // This should not throw
    expect(() => {
      logger.logAICall(
        'generateText',
        'gpt-4',
        { prompt: 'test prompt' },
        { text: 'response' }
      );
    }).not.toThrow();
  });

  it('should handle AI call error logging', () => {
    const logger = createLogger('ai-test');
    const error = new Error('AI service error');
    
    // This should not throw
    expect(() => {
      logger.logAICall(
        'generateText',
        'gpt-4',
        { prompt: 'test prompt' },
        undefined,
        error
      );
    }).not.toThrow();
  });

  it('should handle DB operation logging', () => {
    const logger = createLogger('db-test');
    
    // This should not throw
    expect(() => {
      logger.logDBOperation(
        'insert',
        'users',
        { name: 'John' },
        { id: 1, name: 'John' }
      );
    }).not.toThrow();
  });

  it('should handle DB operation error logging', () => {
    const logger = createLogger('db-test');
    const error = new Error('Database error');
    
    // This should not throw
    expect(() => {
      logger.logDBOperation(
        'insert',
        'users',
        { name: 'John' },
        undefined,
        error
      );
    }).not.toThrow();
  });

  it('should handle arc progression logging', () => {
    const logger = createLogger('arc-test');
    
    // This should not throw
    expect(() => {
      logger.logArcProgression(
        'world-123',
        'arc-456',
        7,
        'beat-created',
        { beat_type: 'anchor' }
      );
    }).not.toThrow();
  });

  it('should handle all log levels', () => {
    const logger = createLogger('levels-test');
    
    // Test that all log levels work without throwing
    expect(() => {
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      logger.http('http message');
    }).not.toThrow();
  });
});