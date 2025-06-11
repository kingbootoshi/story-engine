import 'reflect-metadata';
import { beforeEach, vi } from 'vitest';
import { DI } from '../../src/core/infra/container';
import type { LocationRepository } from '../../src/modules/location/domain/ports';
import { container as tsyringeContainer } from 'tsyringe';

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

// Import LocationRepository interface and define a minimal in‐memory stub after container reset
class NoopLocationRepo implements LocationRepository {
  async createBulk(_: any[]): Promise<any[]> { return []; }
  async create(_: any): Promise<any> { return { id: 'noop', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; }
  async findByWorldId(_: string): Promise<any[]> { return []; }
  async findById(_: string): Promise<any | null> { return null; }
  async findByParentId(_: string): Promise<any[]> { return []; }
  async updateStatus(_: string, __: any, ___: any): Promise<void> { /* noop */ }
  async updateDescription(_: string, __: string): Promise<void> { /* noop */ }
  async addHistoricalEvent(_: string, __: any): Promise<void> { /* noop */ }
  async update(_: string, __: any): Promise<any> { return {} as any; }
  async search(_: string, __: string, ___?: string[]): Promise<any[]> { return []; }
}

function registerDefaultStubs() {
  // Register a minimal LocationRepository stub so services depending on it resolve without failures
  DI.register('LocationRepository', { useValue: new NoopLocationRepo() });
}

// Patch DI.reset so every call re-registers default stubs automatically
const originalReset = DI.reset.bind(DI);
(DI as any).reset = () => {
  originalReset();
  registerDefaultStubs();
};

// Also register once for the initial container state
registerDefaultStubs();

// Patch container.clearInstances so every call re-registers default stubs automatically
const originalClear = (tsyringeContainer as any).clearInstances.bind(tsyringeContainer);
(tsyringeContainer as any).clearInstances = () => {
  originalClear();
  registerDefaultStubs();
};