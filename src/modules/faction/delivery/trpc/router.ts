import { z } from 'zod';
import { container } from 'tsyringe';
import { router, publicProcedure, authedProcedure } from '../../../../core/trpc/init';
import { FactionService } from '../../application/FactionService';
import { 
  Faction, 
  CreateFaction, 
  UpdateFaction,
  DiplomaticStance,
  HistoricalEvent,
  UUIDString
} from '../../domain/schema';

export const factionRouter = router({
  list: publicProcedure
    .input(z.object({ worldId: UUIDString }))
    .output(Faction.array())
    .query(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      return factionService.list(input.worldId);
    }),

  get: publicProcedure
    .input(UUIDString)
    .output(Faction.nullable())
    .query(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      return factionService.get(input);
    }),

  create: authedProcedure
    .input(CreateFaction)
    .output(Faction)
    .mutation(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      return factionService.create(input, true);
    }),

  update: authedProcedure
    .input(z.object({
      id: UUIDString,
      updates: UpdateFaction
    }))
    .output(Faction)
    .mutation(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      return factionService.update(input.id, input.updates);
    }),

  setStance: authedProcedure
    .input(z.object({
      sourceId: UUIDString,
      targetId: UUIDString,
      stance: DiplomaticStance,
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      await factionService.setStance(
        input.sourceId,
        input.targetId,
        input.stance,
        input.reason
      );
      return { success: true };
    }),

  getStances: publicProcedure
    .input(UUIDString)
    .output(z.array(z.object({
      targetId: UUIDString,
      stance: DiplomaticStance
    })))
    .query(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      return factionService.getStances(input);
    }),

  claimLocation: authedProcedure
    .input(z.object({
      factionId: UUIDString,
      locationId: UUIDString,
      method: z.enum(['conquest', 'treaty'])
    }))
    .mutation(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      await factionService.claimLocation(
        input.factionId,
        input.locationId,
        input.method
      );
      return { success: true };
    }),

  releaseLocation: authedProcedure
    .input(z.object({
      factionId: UUIDString,
      locationId: UUIDString,
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      await factionService.releaseLocation(
        input.factionId,
        input.locationId,
        input.reason
      );
      return { success: true };
    }),

  setStatus: authedProcedure
    .input(z.object({
      id: UUIDString,
      status: z.enum(['rising', 'stable', 'declining', 'collapsed']),
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      await factionService.setStatus(
        input.id,
        input.status,
        input.reason
      );
      return { success: true };
    }),

  getHistory: publicProcedure
    .input(z.object({
      id: UUIDString,
      limit: z.number().int().positive().optional().default(10)
    }))
    .output(HistoricalEvent.array())
    .query(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      return factionService.getHistory(input.id, input.limit);
    }),

  generateDoctrine: authedProcedure
    .input(UUIDString)
    .output(Faction)
    .mutation(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      return factionService.generateDoctrine(input);
    }),

  evaluateRelations: authedProcedure
    .input(z.object({
      worldId: UUIDString,
      beatContext: z.string()
    }))
    .mutation(async ({ input }) => {
      const factionService = container.resolve(FactionService);
      await factionService.evaluateRelations(input.worldId, input.beatContext);
      return { success: true };
    })
});