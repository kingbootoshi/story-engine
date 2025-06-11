import 'reflect-metadata';
import express from 'express';
import { glob } from 'glob';
import { DI } from './infra/container';
import { eventBus } from './infra/eventBus';
import { logger } from './infra/logger';
import type { EngineModule } from './types';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/rootRouter';
import { createContext as buildTrpcContext } from './trpc/context';

export async function bootstrapModules(app: express.Express): Promise<void> {
  logger.info('🚀 Starting module bootstrap');
  
  try {
    const manifestPaths = await glob('src/modules/*/manifest.{ts,js}', {
      absolute: true
    });
    
    // Ensure deterministic, alphabetical loading order so that modules
    // with shared dependencies are initialised in a predictable manner.
    // This prevents situations where a downstream module eagerly resolves
    // a service that depends on a token registered by another module that
    // has not been loaded yet (see: StoryAIService depends on
    // `LocationRepository`).
    manifestPaths.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    
    logger.info(`Found ${manifestPaths.length} module(s)`);
    
    for (const manifestPath of manifestPaths) {
      try {
        const moduleExport = await import(manifestPath);
        const module: EngineModule = moduleExport.default;
        
        if (!module || !module.name) {
          logger.warn(`Invalid module at ${manifestPath}`);
          continue;
        }
        
        logger.info(`🔌 Loading module: ${module.name}`);
        
        module.register(app, DI);
        
        if (module.subscriptions) {
          for (const { topic, handler } of module.subscriptions) {
            eventBus.on(topic, (event) => handler(event, DI));
            logger.debug(`Module ${module.name} subscribed to ${topic}`);
          }
        }
        
        logger.success(`Module loaded: ${module.name}`);
      } catch (error) {
        logger.error(`Failed to load module at ${manifestPath}`, error);
        throw error; // Fail fast
      }
    }
    
    logger.success('✅ Module bootstrap complete');
  } catch (error) {
    logger.error('Failed to bootstrap modules', error);
    throw error;
  }
}

export async function createServer(): Promise<express.Application> {
  const app = express();
  
  app.use(express.json());
  
  // Mount native tRPC batch handler BEFORE module bootstrap so that
  // `/api/trpc` is resolved prior to any 404 middleware.
  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: ({ req, res }) => buildTrpcContext(req, res),
    }),
  );
  logger.info('🔗 Mounted native tRPC handler at /api/trpc');
  
  app.use((req, _res, next) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) req.headers['x-supabase-auth'] = auth.slice(7);
    next();
  });
  
  app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.path}`, { 
      body: req.body,
      query: req.query,
      params: req.params 
    });
    next();
  });
  
  await bootstrapModules(app);
  
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      services: {
        ai: !!process.env.OPENROUTER_API_KEY,
        database: !!process.env.SUPABASE_URL || !!process.env.VITE_SUPABASE_URL
      }
    });
  });
  
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // Extract request ID if available
    const reqId = req.headers['x-request-id'] as string;
    
    // Check if error has a status (from tRPC error formatter)
    const status = err.status || err.statusCode || 500;
    
    logger.error('Unhandled error', err, { 
      method: req.method, 
      path: req.path,
      status,
      reqId,
      errorCode: err.code,
      errorName: err.name
    });
    
    // Return appropriate error response
    if (err.issues) {
      // Zod validation error
      res.status(status).json({ 
        error: 'Validation error',
        issues: err.issues
      });
    } else if (err.code && typeof err.code === 'string') {
      // tRPC or known error
      res.status(status).json({ 
        error: err.message || 'Request failed',
        code: err.code
      });
    } else {
      // Generic error
      res.status(status).json({ 
        error: err.message || 'Internal server error'
      });
    }
  });
  
  return app;
}