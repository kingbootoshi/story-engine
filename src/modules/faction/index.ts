// Public module exports
export { default } from './manifest';

// Domain exports
export * from './domain/schema';
export * from './domain/events';
export type { IFactionRepository, IFactionAI } from './domain/ports';

// Application exports
export { FactionService } from './application/FactionService';

// Delivery exports  
export { factionRouter } from './delivery/trpc/router';