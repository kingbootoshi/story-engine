import { vi } from 'vitest';
import type { IEventBus } from '../../../src/core/infra/eventBus';
import type { DomainEvent } from '../../../src/core/types';

export class MockEventBus implements IEventBus {
  public emitSpy = vi.fn();
  public onSpy = vi.fn();
  public offSpy = vi.fn();
  
  private handlers: Map<string, any[]> = new Map();

  emit<T = any>(topic: string, payload: T & { _hop?: number }): boolean {
    this.emitSpy(topic, payload);
    const eventHandlers = this.handlers.get(topic) || [];
    const event: DomainEvent<T> = {
      topic,
      payload,
      ts: new Date().toISOString()
    };
    eventHandlers.forEach(handler => handler(event));
    return eventHandlers.length > 0;
  }

  on<T = any>(topic: string, handler: (event: DomainEvent<T>) => void): this {
    this.onSpy(topic, handler);
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push(handler);
    return this;
  }

  off<T = any>(topic: string, handler: (event: DomainEvent<T>) => void): this {
    this.offSpy(topic, handler);
    const handlers = this.handlers.get(topic);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }


  // Test helper methods
  clear(): void {
    this.handlers.clear();
    this.emitSpy.mockClear();
    this.onSpy.mockClear();
    this.offSpy.mockClear();
  }

  getEmittedEvents(): Array<{ topic: string; payload: any }> {
    return this.emitSpy.mock.calls.map(([topic, payload]) => ({ topic, payload }));
  }

  getEmitted(eventName: string): Array<{ event: string; payload: any }> {
    return this.emitSpy.mock.calls
      .filter(([topic]) => topic === eventName)
      .map(([topic, payload]) => ({ event: topic, payload }));
  }
}