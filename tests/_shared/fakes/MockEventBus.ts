import { vi } from 'vitest';
import type { IEventBus } from '../../../src/core/infra/eventBus';

export class MockEventBus implements IEventBus {
  public emitSpy = vi.fn();
  public onSpy = vi.fn();
  public offSpy = vi.fn();
  
  private handlers: Map<string, any[]> = new Map();

  emit(event: string, ...args: any[]): boolean {
    this.emitSpy(event, ...args);
    const eventHandlers = this.handlers.get(event) || [];
    eventHandlers.forEach(handler => handler(...args));
    return eventHandlers.length > 0;
  }

  on(event: string, listener: (...args: any[]) => void): this {
    this.onSpy(event, listener);
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.offSpy(event, listener);
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(listener);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  once(event: string, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
    return this;
  }

  listeners(event: string): any[] {
    return this.handlers.get(event) || [];
  }

  eventNames(): (string | symbol)[] {
    return Array.from(this.handlers.keys());
  }

  getMaxListeners(): number {
    return Infinity;
  }

  setMaxListeners(n: number): this {
    return this;
  }

  rawListeners(event: string): any[] {
    return this.listeners(event);
  }

  listenerCount(event: string): number {
    return this.listeners(event).length;
  }

  prependListener(event: string, listener: (...args: any[]) => void): this {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.unshift(listener);
    return this;
  }

  prependOnceListener(event: string, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.prependListener(event, onceWrapper);
  }

  addListener(event: string, listener: (...args: any[]) => void): this {
    return this.on(event, listener);
  }

  removeListener(event: string, listener: (...args: any[]) => void): this {
    return this.off(event, listener);
  }

  // Test helper methods
  clear(): void {
    this.handlers.clear();
    this.emitSpy.mockClear();
    this.onSpy.mockClear();
    this.offSpy.mockClear();
  }

  getEmittedEvents(): Array<{ event: string; args: any[] }> {
    return this.emitSpy.mock.calls.map(([event, ...args]) => ({ event, args }));
  }
}