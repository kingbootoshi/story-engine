import { container } from 'tsyringe';
import { SupabaseFactionRepo } from './persistence/SupabaseFactionRepo';
import { FactionAIAdapter } from './ai/FactionAIAdapter';

// Register infrastructure implementations
container.register('IFactionRepository', { useClass: SupabaseFactionRepo });
container.register('IFactionAI', { useClass: FactionAIAdapter });

// Export for convenience
export { SupabaseFactionRepo } from './persistence/SupabaseFactionRepo';
export { FactionAIAdapter } from './ai/FactionAIAdapter';