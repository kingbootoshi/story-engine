import type { Request, Response } from 'express';
import { createLogger } from '../infra/logger';
import crypto from 'crypto';

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
  
  return {
    logger,
    reqId,
    // user will be populated from auth middleware later
  };
}