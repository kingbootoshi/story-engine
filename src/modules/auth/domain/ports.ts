import type { ApiKey, CreateApiKeyInput, ApiKeyResponse } from './schema';

export interface IApiKeyRepository {
  create(userId: string, keyHash: string, input: CreateApiKeyInput & { keyPrefix: string }): Promise<ApiKey>;
  findByHash(keyHash: string): Promise<ApiKey | null>;
  findByUserId(userId: string, offset?: number, limit?: number): Promise<ApiKey[]>;
  findAllActive(offset: number, limit: number): Promise<ApiKey[]>;
  updateLastUsed(id: string): Promise<void>;
  revoke(id: string, userId: string): Promise<void>;
  update(id: string, userId: string, updates: { name?: string }): Promise<ApiKey>;
}

export interface IApiKeyService {
  generateApiKey(userId: string, input: CreateApiKeyInput): Promise<{
    apiKey: ApiKey;
    plainKey: string;
  }>;
  validateApiKey(plainKey: string): Promise<{ userId: string } | null>;
  listUserKeys(userId: string): Promise<ApiKeyResponse[]>;
  revokeKey(userId: string, keyId: string): Promise<void>;
  updateKeyName(userId: string, keyId: string, name: string): Promise<ApiKey>;
}