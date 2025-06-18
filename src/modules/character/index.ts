// Barrel export for character module
export { CharacterService } from './application/CharacterService';
export { characterRouter } from './delivery/trpc/router';
export * from './domain/schema';
export * from './domain/events';
export type { ICharacterRepository, ICharacterAI } from './domain/ports';
export { default } from './manifest';