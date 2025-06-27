import { z } from 'zod';

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  key_hash: z.string(),
  key_prefix: z.string().optional(),
  name: z.string().min(1).max(255),
  last_used_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  expires_at: z.date().nullable(),
  is_active: z.boolean()
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  expires_at: z.date().optional()
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

export const ApiKeyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  key_prefix: z.string(),
  created_at: z.date(),
  last_used_at: z.date().nullable(),
  expires_at: z.date().nullable(),
  is_active: z.boolean()
});

export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;

export const GeneratedApiKeySchema = ApiKeyResponseSchema.extend({
  key: z.string()
});

export type GeneratedApiKey = z.infer<typeof GeneratedApiKeySchema>;