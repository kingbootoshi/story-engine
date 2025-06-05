import { container } from 'tsyringe';
import { SupabaseWorldRepo } from './persistence/SupabaseWorldRepo';
import { WorldAIAdapter } from './ai/WorldAIAdapter';

// Register infrastructure implementations
container.register('WorldRepo', { useClass: SupabaseWorldRepo });
container.register('WorldAI', { useClass: WorldAIAdapter });

// Export for convenience
export { SupabaseWorldRepo } from './persistence/SupabaseWorldRepo';
export { WorldAIAdapter } from './ai/WorldAIAdapter';