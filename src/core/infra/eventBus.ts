import { EventEmitter } from 'eventemitter3';
import type { DomainEvent } from '../types';

class TypedEventBus {
  private emitter = new EventEmitter();
  
  emit<T = any>(topic: string, payload: T): boolean {
    const event: DomainEvent<T> = {
      topic,
      payload,
      ts: new Date().toISOString()
    };
    return this.emitter.emit(topic, event);
  }

  on<T = any>(topic: string, handler: (event: DomainEvent<T>) => void): this {
    this.emitter.on(topic, handler);
    return this;
  }

  off<T = any>(topic: string, handler: (event: DomainEvent<T>) => void): this {
    this.emitter.off(topic, handler);
    return this;
  }
}

export const eventBus = new TypedEventBus();