import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TrpcCtx } from './context';
import { ZodError } from 'zod';

const t = initTRPC.context<TrpcCtx>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts;
    
    // Handle Zod validation errors specially
    if (error.code === 'BAD_REQUEST' && error.cause instanceof ZodError) {
      return {
        ...shape,
        data: {
          ...shape.data,
          status: 400,
          issues: error.cause.flatten(),
          zodError: error.cause.errors,
        },
      };
    }
    
    // Handle other tRPC errors
    let status = 500;
    if (error.code === 'UNAUTHORIZED') status = 401;
    else if (error.code === 'FORBIDDEN') status = 403;
    else if (error.code === 'NOT_FOUND') status = 404;
    else if (error.code === 'BAD_REQUEST') status = 400;
    else if (error.code === 'CONFLICT') status = 409;
    else if (error.code === 'PRECONDITION_FAILED') status = 412;
    else if (error.code === 'PAYLOAD_TOO_LARGE') status = 413;
    else if (error.code === 'METHOD_NOT_SUPPORTED') status = 405;
    else if (error.code === 'TIMEOUT') status = 408;
    else if (error.code === 'TOO_MANY_REQUESTS') status = 429;
    
    return {
      ...shape,
      data: {
        ...shape.data,
        status,
      },
    };
  },
});

export const router = t.router;
export const procedure = t.procedure;
export const middleware = t.middleware;

// Export common procedure builders with built-in logging
export const publicProcedure = procedure.use(
  middleware(async ({ ctx, next }) => {
    const start = Date.now();
    const result = await next();
    const duration = Date.now() - start;
    
    if (result.ok) {
      ctx.logger.debug('Procedure completed', { durationMs: duration });
    }
    
    return result;
  })
);

// Future: Add authenticated procedure once auth lands
export const authedProcedure = publicProcedure.use(
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }
    
    return next({
      ctx: {
        ...ctx,
        user: ctx.user, // narrowed type
      },
    });
  })
);