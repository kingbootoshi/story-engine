// Public module exports
export { default } from './manifest';

// Domain exports
export * from './domain/schema';
export * from './domain/events';
export type { WorldRepo, WorldAI } from './domain/ports';

// Application exports
export { WorldService } from './application/WorldService';

// Delivery exports  
export { worldRouter } from './delivery/trpc/router';