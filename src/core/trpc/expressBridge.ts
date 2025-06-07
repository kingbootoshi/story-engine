import type { Express, Request, Response, NextFunction } from 'express';
import type { AnyRouter } from '@trpc/server';
import type { TrpcCtx } from './context';
import { createContext } from './context';
import { TRPCError } from '@trpc/server';

export interface RestBridgeOptions<TRouter extends AnyRouter> {
  router: TRouter;
  basePath: string;
  exposeMetaRoute?: boolean;
}

interface RestMapping {
  trpcPath: string;
  restPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  isQuery: boolean;
}

// Map of tRPC procedure names to REST conventions
const REST_MAPPINGS: Record<string, Partial<RestMapping>> = {
  // Generic patterns
  list: { method: 'GET', restPath: '' },
  listAll: { method: 'GET', restPath: '' },
  getAll: { method: 'GET', restPath: '' },
  findMany: { method: 'GET', restPath: '' },
  
  get: { method: 'GET', restPath: '/:id' },
  getById: { method: 'GET', restPath: '/:id' },
  findOne: { method: 'GET', restPath: '/:id' },
  findById: { method: 'GET', restPath: '/:id' },
  
  create: { method: 'POST', restPath: '' },
  add: { method: 'POST', restPath: '' },
  insert: { method: 'POST', restPath: '' },
  
  update: { method: 'PUT', restPath: '/:id' },
  updateById: { method: 'PUT', restPath: '/:id' },
  edit: { method: 'PUT', restPath: '/:id' },
  
  delete: { method: 'DELETE', restPath: '/:id' },
  deleteById: { method: 'DELETE', restPath: '/:id' },
  remove: { method: 'DELETE', restPath: '/:id' },
  
  // Special patterns for nested resources
  createNewArc: { method: 'POST', restPath: '/:worldId/arcs' },
  progressArc: { method: 'POST', restPath: '/arcs/:arcId/progress' },
  completeArc: { method: 'POST', restPath: '/:worldId/arcs/:arcId/complete' },
  recordWorldEvent: { method: 'POST', restPath: '/:worldId/events' },
  getWorldState: { method: 'GET', restPath: '/:worldId' },
};

function inferRestMapping(procedureName: string, isQuery: boolean): RestMapping {
  const mapping = REST_MAPPINGS[procedureName];
  
  if (mapping) {
    return {
      trpcPath: procedureName,
      restPath: mapping.restPath || '',
      method: mapping.method || (isQuery ? 'GET' : 'POST'),
      isQuery,
    };
  }
  
  // Default mapping: use procedure name as path
  return {
    trpcPath: procedureName,
    restPath: `/${procedureName}`,
    method: isQuery ? 'GET' : 'POST',
    isQuery,
  };
}

export function mountTrpcAsRest<TRouter extends AnyRouter>(
  app: Express,
  opts: RestBridgeOptions<TRouter>
): void {
  const { router, basePath, exposeMetaRoute } = opts;
  const procedures = router._def.procedures;
  
  // Create a type-safe caller factory
  const createCaller = (ctx: TrpcCtx) => router.createCaller(ctx);
  
  // Track registered routes for meta endpoint
  const registeredRoutes: Array<{ method: string; path: string; procedure: string }> = [];
  
  // Iterate through all procedures and create REST endpoints
  for (const [procedureName, procedureDef] of Object.entries(procedures)) {
    const def = procedureDef as any;
    const isQuery = def._def.mutation === false;
    const mapping = inferRestMapping(procedureName, isQuery);
    const fullPath = basePath + mapping.restPath;
    
    // Register the route
    registeredRoutes.push({
      method: mapping.method,
      path: fullPath,
      procedure: procedureName,
    });
    
    // Create the route handler
    const handler = async (req: Request, res: Response, next: NextFunction) => {
      const ctx = createContext(req, res);
      const startTime = Date.now();
      
      try {
        const caller = createCaller(ctx) as any;
        
        // Build input based on method and mapping
        let input: any;
        
        if (mapping.isQuery) {
          // For queries, merge params and query
          input = { ...req.params, ...req.query };
          
          // Handle special cases
          if (procedureName === 'get' || procedureName === 'getWorld') {
            input = req.params.id || req.params.worldId;
          } else if (procedureName === 'getWorldState') {
            input = req.params.worldId;
          } else if (Object.keys(input).length === 0) {
            input = undefined;
          }
        } else {
          // For mutations, use body with params merged
          input = { ...req.body, ...req.params };
          
          // Handle special cases
          if (procedureName === 'completeArc') {
            input = {
              worldId: req.params.worldId,
              arcId: req.params.arcId,
            };
          } else if (procedureName === 'progressArc') {
            input = {
              worldId: req.body.worldId,
              arcId: req.params.arcId,
              recentEvents: req.body.recentEvents,
            };
          } else if (procedureName === 'recordWorldEvent') {
            input = {
              world_id: req.params.worldId,
              ...req.body,
            };
          } else if (procedureName === 'createNewArc') {
            // This needs special handling - first get world info
            const world = await caller.getWorld(req.params.worldId);
            if (!world) {
              res.status(404).json({ error: 'World not found' });
              return;
            }
            input = {
              worldId: req.params.worldId,
              worldName: world.name,
              worldDescription: world.description,
              storyIdea: req.body.storyIdea,
            };
          }
        }
        
        // Call the procedure
        const result = await caller[procedureName](input);
        
        const duration = Date.now() - startTime;
        ctx.logger.http(`✓ ${procedureName}`, { 
          status: 200,
          durationMs: duration,
          method: mapping.method,
          path: fullPath,
        });
        
        // Handle special response cases
        if (procedureName === 'progressArc' && !result) {
          res.json({ message: 'Arc is complete', beat: null });
        } else if (procedureName === 'create' || procedureName === 'createWorld' || 
                   procedureName === 'createNewArc' || procedureName === 'recordWorldEvent') {
          res.status(201).json(result);
        } else {
          res.json(result);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        ctx.logger.error(`✗ ${procedureName}`, error, {
          durationMs: duration,
          method: mapping.method,
          path: fullPath,
        });
        
        // Convert tRPC error to REST error
        if (error instanceof TRPCError) {
          const formatted = router._def._config.errorFormatter({
            error,
            type: mapping.isQuery ? 'query' : 'mutation',
            path: procedureName,
            input: undefined,
            ctx,
            shape: {
              code: error.code as any,
              message: error.message,
              data: {
                code: error.code as any,
                httpStatus: 500,
                path: procedureName,
              },
            },
          });
          
          const status = (formatted.data as any)?.status || 500;
          res.status(status).json({
            error: formatted.message,
            code: formatted.code,
            ...(formatted.data as any)?.issues && { issues: (formatted.data as any).issues },
          });
        } else {
          next(error);
        }
      }
    };
    
    // Register the route with Express
    switch (mapping.method) {
      case 'GET':
        app.get(fullPath, handler);
        break;
      case 'POST':
        app.post(fullPath, handler);
        break;
      case 'PUT':
        app.put(fullPath, handler);
        break;
      case 'DELETE':
        app.delete(fullPath, handler);
        break;
      case 'PATCH':
        app.patch(fullPath, handler);
        break;
    }
  }
  
  // Optionally expose meta route
  if (exposeMetaRoute) {
    app.get(`${basePath}/meta`, (_req, res) => {
      res.json({
        procedures: Object.keys(procedures),
        routes: registeredRoutes,
      });
    });
  }
  
  // Log successful mount
  console.log(`[expressBridge] Mounted ${Object.keys(procedures).length} tRPC procedures as REST endpoints at ${basePath}`);
  console.log('[expressBridge] Registered routes:', registeredRoutes);
}