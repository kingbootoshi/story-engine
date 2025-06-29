import { injectable, inject } from 'tsyringe';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { createLogger } from '../../../core/infra/logger';
import type { IApiKeyRepository, IApiKeyService } from '../domain/ports';
import type { CreateApiKeyInput, ApiKeyResponse } from '../domain/schema';

const logger = createLogger('auth.apikey.service');

@injectable()
export class ApiKeyService implements IApiKeyService {
  private readonly BCRYPT_ROUNDS = 10;
  private readonly KEY_PREFIX = 'se_';
  private readonly KEY_LENGTH = 32;

  constructor(
    @inject('IApiKeyRepository') private readonly repository: IApiKeyRepository
  ) {}

  async generateApiKey(userId: string, input: CreateApiKeyInput) {
    logger.info('Generating new API key', { userId, keyName: input.name });

    const plainKey = this.generateSecureKey();
    const keyHash = await this.hashKey(plainKey);
    const keyPrefix = plainKey.substring(0, 10);

    try {
      const apiKey = await this.repository.create(userId, keyHash, { 
        ...input,
        keyPrefix 
      });
      
      logger.success('API key generated', {
        userId,
        keyId: apiKey.id,
        keyName: input.name
      });

      return {
        apiKey,
        plainKey
      };
    } catch (error) {
      logger.error('Failed to generate API key', error, { userId });
      throw error;
    }
  }

  async validateApiKey(plainKey: string): Promise<{ userId: string } | null> {
    if (!plainKey.startsWith(this.KEY_PREFIX)) {
      logger.debug('Invalid key prefix', { prefix: plainKey.substring(0, 3) });
      return null;
    }

    try {
      const allActiveKeys = await this.findAllActiveKeys();
      
      for (const key of allActiveKeys) {
        const isValid = await bcrypt.compare(plainKey, key.key_hash);
        if (isValid) {
          if (key.expires_at && key.expires_at < new Date()) {
            logger.warn('API key expired', { keyId: key.id });
            return null;
          }

          await this.repository.updateLastUsed(key.id).catch(err => {
            logger.error('Failed to update last_used_at', err, { keyId: key.id });
          });

          logger.debug('API key validated', { userId: key.user_id });
          return { userId: key.user_id };
        }
      }

      logger.debug('No matching API key found');
      return null;
    } catch (error) {
      logger.error('API key validation error', error);
      return null;
    }
  }

  async listUserKeys(userId: string): Promise<ApiKeyResponse[]> {
    const keys = await this.repository.findByUserId(userId);
    
    return keys.map(key => ({
      id: key.id,
      name: key.name,
      key_prefix: key.key_prefix || this.KEY_PREFIX + '******...',
      created_at: key.created_at,
      last_used_at: key.last_used_at,
      expires_at: key.expires_at,
      is_active: key.is_active
    }));
  }

  async revokeKey(userId: string, keyId: string): Promise<void> {
    logger.info('Revoking API key', { userId, keyId });
    await this.repository.revoke(keyId, userId);
  }

  async updateKeyName(userId: string, keyId: string, name: string) {
    logger.info('Updating API key name', { userId, keyId, name });
    return await this.repository.update(keyId, userId, { name });
  }

  private generateSecureKey(): string {
    const randomPart = randomBytes(this.KEY_LENGTH).toString('base64url');
    return `${this.KEY_PREFIX}${randomPart}`;
  }

  private async hashKey(plainKey: string): Promise<string> {
    return await bcrypt.hash(plainKey, this.BCRYPT_ROUNDS);
  }

  private async findAllActiveKeys() {
    const batchSize = 100;
    let offset = 0;
    const allKeys = [];

    while (true) {
      const batch = await this.repository.findAllActive(offset, batchSize);
      if (batch.length === 0) break;
      allKeys.push(...batch);
      offset += batchSize;
    }

    return allKeys;
  }
}