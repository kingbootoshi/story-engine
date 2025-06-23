import { container } from 'tsyringe';
import { SupabaseCharacterRepo } from './persistence/SupabaseCharacterRepo';
import { CharacterAIAdapter } from './ai/CharacterAIAdapter';

container.register('ICharacterRepository', {
  useClass: SupabaseCharacterRepo
});

container.register('ICharacterAI', {
  useClass: CharacterAIAdapter
});