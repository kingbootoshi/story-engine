import type { Request, Response } from 'express';
import { createLogger } from '../infra/logger';
import crypto from 'crypto';
import type { ApiKeyAuthRequest } from '../middleware/apiKeyAuth';

export interface ILogger {
  http(msg: string, meta?: any): void;
  info(msg: string, meta?: any): void;
  error(msg: string, err?: unknown, meta?: any): void;
  debug(msg: string, meta?: any): void;
  warn(msg: string, meta?: any): void;
  success(msg: string, meta?: any): void;
}

export interface TrpcCtx {
  logger: ILogger;
  user?: { id: string };  // populated once auth lands
  reqId: string;          // uuid per request for tracing
}

export function createContext(req: Request, _res: Response): TrpcCtx {
  const reqId = req.headers['x-request-id'] as string || crypto.randomUUID();
  const logger = createLogger(`req:${reqId}`);
  
  logger.http(`[REQ] ${req.method} ${req.path}`, {
    query: req.query,
    params: req.params,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  });
  
  // ---------------------------------------------------------------------
  // Check for API key authentication first (from middleware)
  // ---------------------------------------------------------------------
  const apiKeyReq = req as ApiKeyAuthRequest;
  if (apiKeyReq.apiKeyUser) {
    logger.debug('Using API key authentication', { userId: apiKeyReq.apiKeyUser.id });
    return {
      logger,
      reqId,
      user: apiKeyReq.apiKeyUser,
    };
  }
  
  // ---------------------------------------------------------------------
  // Token extraction – expects standard `Bearer <jwt>` header from Supabase
  // We purposely avoid *verifying* the signature here to keep the context
  // creation synchronous. Full verification (and authz checks) happen in
  // `authedProcedure` middleware where async calls are allowed.
  // ---------------------------------------------------------------------

  const authHeader = req.headers['authorization'];
  let user: { id: string } | undefined;

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const [, payload] = token.split('.');
    if (payload) {
      try {
        const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        const json = JSON.parse(decoded.toString('utf8'));
        if (json.sub) {
          user = { id: json.sub };
        }
      } catch (err) {
        logger.warn('Failed to parse JWT payload', { err: (err as Error).message });
      }
    }
  }

  return {
    logger,
    reqId,
    user,
  };
}