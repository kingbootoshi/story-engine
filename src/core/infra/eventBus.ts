import { EventEmitter } from 'eventemitter3';
import type { DomainEvent } from '../types';
import { createLogger } from './logger';

const logger = createLogger('eventBus');

class TypedEventBus {
  private emitter = new EventEmitter();
  
  emit<T = any>(topic: string, payload: T & { _hop?: number }, userId?: string): boolean {
    const hop = (payload._hop ?? 0) + 1;
    
    if (hop > 8) {
      throw new Error(`Event hop limit exceeded: ${hop} hops for topic ${topic}`);
    }
    
    const eventSize = JSON.stringify(payload).length;
    if (eventSize > 50_000) {
      throw new Error(`Event payload too large: ${eventSize} bytes for topic ${topic}`);
    }
    
    const enrichedPayload = { ...payload, _hop: hop };
    const event: DomainEvent<T & { _hop: number }> = {
      topic,
      payload: enrichedPayload,
      ts: new Date().toISOString(),
      user_id: userId
    };
    
    logger.debug('[eventBus] emitted', { topic, hop, user_id: userId });
    
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