import { vi } from 'vitest';
import type { Logger } from 'winston';

export interface MockLogger extends Logger {
  infoSpy: ReturnType<typeof vi.fn>;
  errorSpy: ReturnType<typeof vi.fn>;
  warnSpy: ReturnType<typeof vi.fn>;
  debugSpy: ReturnType<typeof vi.fn>;
  successSpy: ReturnType<typeof vi.fn>;
  childSpy: ReturnType<typeof vi.fn>;
}

export function createMockLogger(): MockLogger {
  const mockLogger = {
    infoSpy: vi.fn(),
    errorSpy: vi.fn(),
    warnSpy: vi.fn(),
    debugSpy: vi.fn(),
    successSpy: vi.fn(),
    childSpy: vi.fn(),
    
    info: function(message: string, meta?: any) {
      this.infoSpy(message, meta);
      return this;
    },
    error: function(message: string, meta?: any) {
      this.errorSpy(message, meta);
      return this;
    },
    warn: function(message: string, meta?: any) {
      this.warnSpy(message, meta);
      return this;
    },
    debug: function(message: string, meta?: any) {
      this.debugSpy(message, meta);
      return this;
    },
    success: function(message: string, meta?: any) {
      this.successSpy(message, meta);
      return this;
    },
    child: function(meta: any) {
      this.childSpy(meta);
      return createMockLogger();
    },
    
    // Other winston methods (stubs)
    log: vi.fn(),
    verbose: vi.fn(),
    silly: vi.fn(),
    profile: vi.fn(),
    startTimer: vi.fn(),
    query: vi.fn(),
    stream: vi.fn(),
    close: vi.fn(),
    clear: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    configure: vi.fn(),
    isLevelEnabled: vi.fn(() => true),
    isSillyEnabled: vi.fn(() => true),
    isDebugEnabled: vi.fn(() => true),
    isVerboseEnabled: vi.fn(() => true),
    isInfoEnabled: vi.fn(() => true),
    isWarnEnabled: vi.fn(() => true),
    isErrorEnabled: vi.fn(() => true),
  } as unknown as MockLogger;

  return mockLogger;
}