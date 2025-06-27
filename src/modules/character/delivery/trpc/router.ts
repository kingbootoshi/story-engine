import { z } from 'zod';
import { router, authedProcedure } from '../../../../core/trpc/init';
import { Character, CreateCharacter, UpdateCharacter } from '../../domain/schema';
import { CharacterService } from '../../application/CharacterService';
import { container } from 'tsyringe';

export const characterRouter = router({
  list: authedProcedure
    .input(z.object({
      worldId: z.string().uuid()
    }))
    .output(z.array(Character))
    .query(async ({ input }) => {
      const service = container.resolve(CharacterService);
      return await service.list(input.worldId);
    }),

  get: authedProcedure
    .input(z.object({
      characterId: z.string().uuid()
    }))
    .output(Character.nullable())
    .query(async ({ input }) => {
      const service = container.resolve(CharacterService);
      return await service.get(input.characterId);
    }),

  create: authedProcedure
    .input(CreateCharacter)
    .output(Character)
    .mutation(async ({ input, ctx }) => {
      const service = container.resolve(CharacterService);
      return await service.create(input, ctx);
    }),

  update: authedProcedure
    .input(z.object({
      characterId: z.string().uuid(),
      updates: UpdateCharacter
    }))
    .output(Character)
    .mutation(async ({ input, ctx }) => {
      const service = container.resolve(CharacterService);
      return await service.update(input.characterId, input.updates, ctx);
    }),

  delete: authedProcedure
    .input(z.object({
      characterId: z.string().uuid()
    }))
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const service = container.resolve(CharacterService);
      await service.delete(input.characterId, ctx);
    }),

  // INTERNAL: Use list endpoint with filtering instead
  listByFaction: authedProcedure
    .input(z.object({
      factionId: z.string().uuid()
    }))
    .output(z.array(Character))
    .query(async ({ input }) => {
      const repo = container.resolve<any>('ICharacterRepository');
      return await repo.findByFactionId(input.factionId);
    }),

  // INTERNAL: Use list endpoint with filtering instead
  listByLocation: authedProcedure
    .input(z.object({
      locationId: z.string().uuid()
    }))
    .output(z.array(Character))
    .query(async ({ input }) => {
      const repo = container.resolve<any>('ICharacterRepository');
      return await repo.findByLocationId(input.locationId);
    })
});