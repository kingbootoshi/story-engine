import { container } from 'tsyringe';
import { SupabaseApiKeyRepository } from './persistence/SupabaseApiKeyRepository';
import { ApiKeyService } from '../application/ApiKeyService';

container.registerSingleton<SupabaseApiKeyRepository>('IApiKeyRepository', SupabaseApiKeyRepository);
container.registerSingleton<ApiKeyService>('IApiKeyService', ApiKeyService);