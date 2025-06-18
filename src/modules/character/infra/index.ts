import { container } from 'tsyringe';
import { SupabaseCharacterRepo } from './persistence/SupabaseCharacterRepo';
import { CharacterAIAdapter } from './ai/CharacterAIAdapter';

// Register repository implementation
container.register('ICharacterRepository', {
  useClass: SupabaseCharacterRepo
});

// Register AI adapter implementation
container.register('ICharacterAI', {
  useClass: CharacterAIAdapter
});