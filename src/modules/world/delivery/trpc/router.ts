import { z } from 'zod';
import { container } from 'tsyringe';
import { router, publicProcedure, authedProcedure } from '../../../../core/trpc/init';
import { WorldService } from '../../application/WorldService';
import * as S from '../../domain/schema';

export const worldRouter = router({
  list: authedProcedure
    .output(S.World.array())
    .query(async ({ ctx }) => {
      const worldService = container.resolve(WorldService);
      return worldService.listWorlds(ctx.user.id);
    }),

  create: authedProcedure
    .input(S.CreateWorld)
    .output(S.World)
    .mutation(async ({ input, ctx }) => {
      const worldService = container.resolve(WorldService);
      return worldService.createWorld(input.name, input.description, ctx.user.id);
    }),

  seedWorld: authedProcedure
    .input(z.object({
      worldId: z.string().uuid()
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const worldService = container.resolve(WorldService);
      await worldService.seedWorld(input.worldId, ctx.user.id);
      return { 
        success: true, 
        message: 'World seeding initiated. Locations, factions, and characters will be generated.' 
      };
    }),

  get: publicProcedure
    .input(z.string().uuid())
    .output(S.World.nullable())
    .query(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.getWorld(input);
    }),

  // INTERNAL: Arc management is handled automatically through event processing
  createNewArc: publicProcedure
    .input(z.object({
      worldId: z.string().uuid(),
      worldName: z.string(),
      worldDescription: z.string(),
      storyIdea: z.string().optional()
    }))
    .output(z.object({
      arc: S.WorldArc,
      anchors: S.WorldBeat.array()
    }))
    .mutation(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.createNewArc(input);
    }),

  progressArc: publicProcedure
    .input(z.object({
      worldId: z.string().uuid(),
      arcId: z.string().uuid(),
      recentEvents: z.string().optional()
    }))
    .output(S.WorldBeat.nullable())
    .mutation(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.progressArc(input);
    }),

  recordWorldEvent: publicProcedure
    .input(
      S.CreateEvent.pick({
        world_id: true,
        event_type: true,
        impact_level: true,
        description: true
      })
    )
    .output(S.WorldEvent)
    .mutation(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.recordWorldEvent(input as any);
    }),

  getWorldState: publicProcedure
    .input(z.string().uuid())
    .output(z.object({
      world: S.World,
      currentArc: S.WorldArc.nullable(),
      currentBeats: S.WorldBeat.array(),
      recentEvents: S.WorldEvent.array()
    }))
    .query(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.getWorldState(input);
    }),

  // INTERNAL: Arc completion is managed by the system
  completeArc: publicProcedure
    .input(z.object({
      worldId: z.string().uuid(),
      arcId: z.string().uuid()
    }))
    .mutation(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      await worldService.completeArc(input.worldId, input.arcId);
      return { message: 'Arc completed successfully' };
    }),

  // INTERNAL: Use getEvents for public API
  getBeatEvents: publicProcedure
    .input(z.string().uuid())
    .output(S.WorldEvent.array())
    .query(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.getBeatEvents(input);
    }),

  getCurrentBeat: publicProcedure
    .input(z.string().uuid())
    .output(S.WorldBeat.nullable())
    .query(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.getCurrentBeat(input);
    }),

  getEvents: publicProcedure
    .input(z.object({
      worldId: z.string().uuid(),
      filters: z.object({
        eventType: z.enum(['player_action', 'system_event', 'environmental', 'social']).optional(),
        impactLevel: z.enum(['minor', 'moderate', 'major', 'catastrophic']).optional(),
        limit: z.number().int().positive().max(100).optional(),
        offset: z.number().int().nonnegative().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional()
      }).optional()
    }))
    .output(S.WorldEvent.array())
    .query(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.getEvents(input.worldId, input.filters);
    }),
});