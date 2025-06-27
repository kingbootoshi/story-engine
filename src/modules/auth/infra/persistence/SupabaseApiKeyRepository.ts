import { injectable } from 'tsyringe';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../../../../core/infra/logger';
import type { IApiKeyRepository } from '../../domain/ports';
import type { ApiKey, CreateApiKeyInput } from '../../domain/schema';

const logger = createLogger('auth.apikey.repo');

@injectable()
export class SupabaseApiKeyRepository implements IApiKeyRepository {
  private client;

  constructor() {
    const url = process.env.SUPABASE_URL;
    /**
     * Resolve the Supabase credential in descending order of privilege:
     * 1. `SUPABASE_SERVICE_ROLE_KEY` – full access, bypasses RLS (preferred for backend services)
     * 2. `SUPABASE_SERVICE_KEY`       – legacy naming, still full access if present
     * 3. `SUPABASE_ANON_KEY`          – authenticated user-level access (will be blocked by RLS for inserts)
     */
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.client = createClient(url, key);
  }

  async create(userId: string, keyHash: string, input: CreateApiKeyInput & { keyPrefix: string }): Promise<ApiKey> {
    const { data, error } = await this.client
      .from('api_keys')
      .insert({
        user_id: userId,
        key_hash: keyHash,
        key_prefix: input.keyPrefix,
        name: input.name,
        expires_at: input.expires_at?.toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create API key', error, { userId });
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    return this.mapToApiKey(data);
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    const { data, error } = await this.client
      .from('api_keys')
      .select()
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Failed to find API key by hash', error);
      throw new Error(`Failed to find API key: ${error.message}`);
    }

    return data ? this.mapToApiKey(data) : null;
  }

  async findByUserId(userId: string, offset = 0, limit = 100): Promise<ApiKey[]> {
    let query = this.client
      .from('api_keys')
      .select()
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to find API keys by user', error, { userId });
      throw new Error(`Failed to find API keys: ${error.message}`);
    }

    return (data || []).map(this.mapToApiKey);
  }

  async findAllActive(offset: number, limit: number): Promise<ApiKey[]> {
    const { data, error } = await this.client
      .from('api_keys')
      .select()
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to find active API keys', error);
      throw new Error(`Failed to find active API keys: ${error.message}`);
    }

    return (data || []).map(this.mapToApiKey);
  }

  async updateLastUsed(id: string): Promise<void> {
    const { error } = await this.client
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error('Failed to update last_used_at', error, { keyId: id });
      throw new Error(`Failed to update last_used_at: ${error.message}`);
    }
  }

  async revoke(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to revoke API key', error, { keyId: id, userId });
      throw new Error(`Failed to revoke API key: ${error.message}`);
    }

    logger.info('API key revoked', { keyId: id, userId });
  }

  async update(id: string, userId: string, updates: { name?: string }): Promise<ApiKey> {
    const { data, error } = await this.client
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update API key', error, { keyId: id, userId });
      throw new Error(`Failed to update API key: ${error.message}`);
    }

    return this.mapToApiKey(data);
  }

  private mapToApiKey(data: any): ApiKey {
    return {
      id: data.id,
      user_id: data.user_id,
      key_hash: data.key_hash,
      key_prefix: data.key_prefix,
      name: data.name,
      last_used_at: data.last_used_at ? new Date(data.last_used_at) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      expires_at: data.expires_at ? new Date(data.expires_at) : null,
      is_active: data.is_active
    };
  }
}