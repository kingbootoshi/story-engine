import type { Express } from 'express';
import type { Container } from '../infra/container';

export type ID = string & { readonly brand: unique symbol };

export interface DomainEvent<T = any> {
  topic: string;
  payload: T;
  ts: string;
  user_id?: string;
}

export interface EngineModule {
  name: string;
  migrations?: string[];
  register(app: Express, di: Container): void;
  subscriptions?: {
    topic: string;
    handler: (event: DomainEvent<any>, di: Container) => void | Promise<void>;
  }[];
}