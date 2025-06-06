import { z } from 'zod';
import { container } from 'tsyringe';
import { router, publicProcedure } from '../../../../core/trpc/init';
import { WorldService } from '../../application/WorldService';
import * as S from '../../domain/schema';

export const worldRouter = router({
  list: publicProcedure
    .output(S.World.array())
    .query(async () => {
      const worldService = container.resolve(WorldService);
      return worldService.listWorlds();
    }),

  create: publicProcedure
    .input(S.CreateWorld)
    .output(S.World)
    .mutation(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.createWorld(input.name, input.description);
    }),

  get: publicProcedure
    .input(z.string().uuid())
    .output(S.World.nullable())
    .query(async ({ input }) => {
      const worldService = container.resolve(WorldService);
      return worldService.getWorld(input);
    }),

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
});