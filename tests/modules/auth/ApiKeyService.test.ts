import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiKeyService } from '../../../src/modules/auth/application/ApiKeyService';
import type { IApiKeyRepository } from '../../../src/modules/auth/domain/ports';
import type { ApiKey, CreateApiKeyInput } from '../../../src/modules/auth/domain/schema';
import * as bcrypt from 'bcryptjs';

vi.mock('bcryptjs');

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let mockRepository: IApiKeyRepository;
  
  const mockApiKey: ApiKey = {
    id: 'test-key-id',
    user_id: 'test-user-id',
    key_hash: 'hashed-key',
    key_prefix: 'se_test123',
    name: 'Test API Key',
    last_used_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    expires_at: null,
    is_active: true
  };

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findByHash: vi.fn(),
      findByUserId: vi.fn(),
      findAllActive: vi.fn(),
      updateLastUsed: vi.fn(),
      revoke: vi.fn(),
      update: vi.fn()
    };
    
    service = new ApiKeyService(mockRepository);
  });

  describe('generateApiKey', () => {
    it('should generate a new API key with correct prefix', async () => {
      const input: CreateApiKeyInput = {
        name: 'Test Key',
        expires_at: undefined
      };
      
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-key' as never);
      vi.mocked(mockRepository.create).mockResolvedValue(mockApiKey);
      
      const result = await service.generateApiKey('test-user-id', input);
      
      expect(result.plainKey).toMatch(/^se_/);
      expect(result.apiKey).toEqual(mockApiKey);
      expect(mockRepository.create).toHaveBeenCalledWith(
        'test-user-id',
        'hashed-key',
        expect.objectContaining({
          name: 'Test Key',
          keyPrefix: expect.stringMatching(/^se_.{7}/)
        })
      );
    });

    it('should handle creation errors', async () => {
      const input: CreateApiKeyInput = { name: 'Test Key' };
      
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-key' as never);
      vi.mocked(mockRepository.create).mockRejectedValue(new Error('DB Error'));
      
      await expect(service.generateApiKey('test-user-id', input))
        .rejects.toThrow('DB Error');
    });
  });

  describe('validateApiKey', () => {
    it('should validate a correct API key', async () => {
      const plainKey = 'se_testkey123';
      
      vi.mocked(mockRepository.findAllActive).mockResolvedValue([mockApiKey]);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(mockRepository.updateLastUsed).mockResolvedValue();
      
      const result = await service.validateApiKey(plainKey);
      
      expect(result).toEqual({ userId: 'test-user-id' });
      expect(mockRepository.updateLastUsed).toHaveBeenCalledWith('test-key-id');
    });

    it('should reject invalid key prefix', async () => {
      const result = await service.validateApiKey('invalid_prefix_key');
      
      expect(result).toBeNull();
      expect(mockRepository.findAllActive).not.toHaveBeenCalled();
    });

    it('should reject expired keys', async () => {
      const expiredKey = {
        ...mockApiKey,
        expires_at: new Date(Date.now() - 1000)
      };
      
      vi.mocked(mockRepository.findAllActive).mockResolvedValue([expiredKey]);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      
      const result = await service.validateApiKey('se_testkey123');
      
      expect(result).toBeNull();
    });

    it('should handle validation errors gracefully', async () => {
      vi.mocked(mockRepository.findAllActive).mockRejectedValue(new Error('DB Error'));
      
      const result = await service.validateApiKey('se_testkey123');
      
      expect(result).toBeNull();
    });
  });

  describe('listUserKeys', () => {
    it('should return formatted API keys for user', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue([mockApiKey]);
      
      const result = await service.listUserKeys('test-user-id');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'test-key-id',
        name: 'Test API Key',
        key_prefix: 'se_test123',
        created_at: mockApiKey.created_at,
        last_used_at: null,
        expires_at: null,
        is_active: true
      });
    });

    it('should handle missing key prefix', async () => {
      const keyWithoutPrefix = { ...mockApiKey, key_prefix: undefined };
      vi.mocked(mockRepository.findByUserId).mockResolvedValue([keyWithoutPrefix]);
      
      const result = await service.listUserKeys('test-user-id');
      
      expect(result[0].key_prefix).toBe('se_******...');
    });
  });

  describe('revokeKey', () => {
    it('should revoke an API key', async () => {
      vi.mocked(mockRepository.revoke).mockResolvedValue();
      
      await service.revokeKey('test-user-id', 'test-key-id');
      
      expect(mockRepository.revoke).toHaveBeenCalledWith('test-key-id', 'test-user-id');
    });
  });

  describe('updateKeyName', () => {
    it('should update API key name', async () => {
      const updatedKey = { ...mockApiKey, name: 'Updated Name' };
      vi.mocked(mockRepository.update).mockResolvedValue(updatedKey);
      
      const result = await service.updateKeyName('test-user-id', 'test-key-id', 'Updated Name');
      
      expect(result.name).toBe('Updated Name');
      expect(mockRepository.update).toHaveBeenCalledWith(
        'test-key-id',
        'test-user-id',
        { name: 'Updated Name' }
      );
    });
  });
});