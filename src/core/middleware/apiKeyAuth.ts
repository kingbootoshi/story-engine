import type { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { createLogger } from '../infra/logger';
import type { IApiKeyService } from '../../modules/auth/domain/ports';
import NodeCache from 'node-cache';

const logger = createLogger('middleware.apikey');

const apiKeyCache = new NodeCache({ 
  stdTTL: 900,
  checkperiod: 120,
  useClones: false
});

export interface ApiKeyAuthRequest extends Request {
  apiKeyUser?: { id: string };
}

export async function apiKeyAuthMiddleware(
  req: ApiKeyAuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return next();
  }

  logger.debug('API key authentication attempt', { 
    path: req.path,
    method: req.method 
  });

  try {
    const cachedUser = apiKeyCache.get<{ id: string }>(apiKey);
    if (cachedUser) {
      logger.debug('API key found in cache', { userId: cachedUser.id });
      req.apiKeyUser = cachedUser;
      return next();
    }

    const apiKeyService = container.resolve<IApiKeyService>('IApiKeyService');
    const validationResult = await apiKeyService.validateApiKey(apiKey);

    if (validationResult) {
      logger.info('API key validated successfully', { 
        userId: validationResult.userId,
        path: req.path 
      });
      
      apiKeyCache.set(apiKey, { id: validationResult.userId });
      req.apiKeyUser = { id: validationResult.userId };
    } else {
      logger.warn('Invalid API key provided', { 
        path: req.path,
        keyPrefix: apiKey.substring(0, 6) 
      });
    }
  } catch (error) {
    logger.error('API key validation error', error, { path: req.path });
  }

  next();
}