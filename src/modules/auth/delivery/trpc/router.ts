import { z } from 'zod';
import { router, authedProcedure } from '../../../../core/trpc/init';
import { container } from 'tsyringe';
import type { IApiKeyService } from '../../domain/ports';
import { CreateApiKeySchema } from '../../domain/schema';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  apiKeys: router({
    create: authedProcedure
      .meta({
        description: 'Generate a new API key for SDK authentication',
        tags: ['auth']
      })
      .input(CreateApiKeySchema)
      .mutation(async ({ ctx, input }) => {
        const service = container.resolve<IApiKeyService>('IApiKeyService');
        const { apiKey, plainKey } = await service.generateApiKey(ctx.user.id, input);
        
        ctx.logger.info('API key created', { 
          userId: ctx.user.id, 
          keyId: apiKey.id,
          keyName: input.name 
        });
        
        return {
          id: apiKey.id,
          name: apiKey.name,
          key: plainKey,
          key_prefix: plainKey.substring(0, 10) + '...',
          created_at: apiKey.created_at,
          expires_at: apiKey.expires_at,
          message: 'Store this key securely. It will not be shown again.'
        };
      }),

    list: authedProcedure
      .meta({
        description: 'List all API keys for the authenticated user',
        tags: ['auth']
      })
      .query(async ({ ctx }) => {
        const service = container.resolve<IApiKeyService>('IApiKeyService');
        const keys = await service.listUserKeys(ctx.user.id);
        
        ctx.logger.debug('Listed API keys', { 
          userId: ctx.user.id, 
          count: keys.length 
        });
        
        return keys;
      }),

    revoke: authedProcedure
      .meta({
        description: 'Revoke (deactivate) an API key',
        tags: ['auth']
      })
      .input(z.object({
        keyId: z.string().uuid()
      }))
      .mutation(async ({ ctx, input }) => {
        const service = container.resolve<IApiKeyService>('IApiKeyService');
        
        try {
          await service.revokeKey(ctx.user.id, input.keyId);
          
          ctx.logger.info('API key revoked', { 
            userId: ctx.user.id, 
            keyId: input.keyId 
          });
          
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'API key not found or you do not have permission to revoke it'
          });
        }
      }),

    update: authedProcedure
      .meta({
        description: 'Update an API key name',
        tags: ['auth']
      })
      .input(z.object({
        keyId: z.string().uuid(),
        name: z.string().min(1).max(255)
      }))
      .mutation(async ({ ctx, input }) => {
        const service = container.resolve<IApiKeyService>('IApiKeyService');
        
        try {
          const updated = await service.updateKeyName(ctx.user.id, input.keyId, input.name);
          
          ctx.logger.info('API key updated', { 
            userId: ctx.user.id, 
            keyId: input.keyId,
            newName: input.name 
          });
          
          return {
            id: updated.id,
            name: updated.name,
            updated_at: updated.updated_at
          };
        } catch (error) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'API key not found or you do not have permission to update it'
          });
        }
      })
  })
});