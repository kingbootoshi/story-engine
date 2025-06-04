import { EventEmitter } from 'eventemitter3';
import { DomainEvent } from '../types';

class TypedEventBus extends EventEmitter {
  emit<T = any>(topic: string, payload: T): boolean {
    const event: DomainEvent<T> = {
      topic,
      payload,
      ts: new Date().toISOString()
    };
    return super.emit(topic, event);
  }

  on<T = any>(topic: string, handler: (event: DomainEvent<T>) => void): this {
    return super.on(topic, handler);
  }

  off<T = any>(topic: string, handler: (event: DomainEvent<T>) => void): this {
    return super.off(topic, handler);
  }
}

export const eventBus = new TypedEventBus();