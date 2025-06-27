import { z } from 'zod';
import { container } from 'tsyringe';
import { router, authedProcedure } from '../../../../core/trpc/init';
import { UsageService } from '../../application/UsageService';
import { UserAIUsage, UsageSummary } from '../../domain/schema';

export const usageRouter = router({
  /**
   * Get usage records for the authenticated user
   */
  getRecords: authedProcedure
    .input(z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      limit: z.number().min(1).max(1000).default(100)
    }))
    .output(UserAIUsage.array())
    .query(async ({ input, ctx }) => {
      const usageService = container.resolve(UsageService);
      return usageService.getUsageRecords(
        ctx.user.id,
        input.startDate ? new Date(input.startDate) : undefined,
        input.endDate ? new Date(input.endDate) : undefined,
        input.limit
      );
    }),

  /**
   * Get usage summary for the authenticated user
   */
  getSummary: authedProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'all']).default('month')
    }))
    .output(UsageSummary)
    .query(async ({ input, ctx }) => {
      const usageService = container.resolve(UsageService);
      return usageService.getUsageSummary(ctx.user.id, input.period);
    }),

  /**
   * Get current month usage for billing
   */
  getCurrentMonth: authedProcedure
    .output(z.object({
      tokens: z.number(),
      cost: z.number(),
      daily_average: z.number()
    }))
    .query(async ({ ctx }) => {
      const usageService = container.resolve(UsageService);
      return usageService.getCurrentMonthUsage(ctx.user.id);
    }),

  /**
   * Get detailed usage for a specific world
   */
  getWorldUsage: authedProcedure
    .input(z.object({
      worldId: z.string().uuid(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional()
    }))
    .output(z.object({
      world_id: z.string().uuid(),
      total_tokens: z.number(),
      total_cost: z.number(),
      usage_by_module: z.record(z.object({
        tokens: z.number(),
        cost: z.number()
      }))
    }))
    .query(async ({ input, ctx }) => {
      const usageService = container.resolve(UsageService);
      const records = await usageService.getUsageRecords(
        ctx.user.id,
        input.startDate ? new Date(input.startDate) : undefined,
        input.endDate ? new Date(input.endDate) : undefined,
        1000
      );

      // Filter for the specific world
      const worldRecords = records.filter(r => r.world_id === input.worldId);

      // Aggregate by module
      const usageByModule: Record<string, { tokens: number; cost: number }> = {};
      let totalTokens = 0;
      let totalCost = 0;

      for (const record of worldRecords) {
        totalTokens += record.total_tokens;
        totalCost += record.total_cost;

        if (!usageByModule[record.module]) {
          usageByModule[record.module] = { tokens: 0, cost: 0 };
        }
        usageByModule[record.module].tokens += record.total_tokens;
        usageByModule[record.module].cost += record.total_cost;
      }

      return {
        world_id: input.worldId,
        total_tokens: totalTokens,
        total_cost: totalCost,
        usage_by_module: usageByModule
      };
    })
});