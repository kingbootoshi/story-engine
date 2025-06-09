import { container } from 'tsyringe';
import { SupabaseLocationRepo } from './persistence/SupabaseLocationRepo';
import { LocationAIAdapter } from './ai/LocationAIAdapter';

/**
 * Register location module dependencies
 */
container.register('LocationRepository', { useClass: SupabaseLocationRepo });
container.register('LocationAI', { useClass: LocationAIAdapter });