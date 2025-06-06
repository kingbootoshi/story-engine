import 'reflect-metadata';
import { beforeEach, vi } from 'vitest';
import { DI } from '../../src/core/infra/container';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.OPENROUTER_API_KEY = 'test-key';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Reset container before each test
beforeEach(() => {
  DI.reset();
});

// Mock external dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: {}, error: null })),
      update: vi.fn(() => ({ data: {}, error: null })),
      delete: vi.fn(() => ({ data: {}, error: null })),
    })),
  })),
}));

// Mock winston transports to avoid file system operations
vi.mock('winston', async () => {
  const actual = await vi.importActual<any>('winston');
  return {
    ...actual,
    transports: {
      ...actual.transports,
      File: vi.fn().mockImplementation(() => ({
        name: 'file',
        level: 'info',
        log: vi.fn(),
      })),
      Console: vi.fn().mockImplementation(() => ({
        name: 'console',
        level: 'info',
        log: vi.fn(),
      })),
    },
  };
});

// Create a global mock logger factory
const createMockLogger = (module: string) => ({
  module,
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  http: vi.fn(),
  success: vi.fn(),
  logAPICall: vi.fn(),
  logAICall: vi.fn(),
  logDBOperation: vi.fn(),
  logArcProgression: vi.fn(),
});

// Mock the logger module globally
vi.mock('../../src/core/infra/logger', () => ({
  createLogger: vi.fn((module: string) => createMockLogger(module)),
  logger: createMockLogger('core'),
}));