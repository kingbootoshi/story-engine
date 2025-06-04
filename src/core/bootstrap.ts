import 'reflect-metadata';
import express from 'express';
import { glob } from 'glob';
import { DI } from './infra/container';
import { eventBus } from './infra/eventBus';
import { logger } from './infra/logger';
import type { EngineModule } from './types';

export async function bootstrapModules(app: express.Express): Promise<void> {
  logger.info('🚀 Starting module bootstrap');
  
  try {
    const manifestPaths = await glob('src/modules/*/manifest.{ts,js}', {
      absolute: true
    });
    
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
  
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', err, { 
      method: req.method, 
      path: req.path 
    });
    res.status(500).json({ error: 'Internal server error' });
  });
  
  return app;
}