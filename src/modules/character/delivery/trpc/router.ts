import { z } from 'zod';
import { container } from 'tsyringe';
import { router, publicProcedure, authedProcedure } from '../../../../core/trpc/init';
import { CharacterService } from '../../application/CharacterService';
import { 
  Character, 
  CreateCharacter, 
  UpdateCharacter,
  CharacterRelation,
  PersonalityUpdate,
  SpawnContext,
  EnrichmentContext,
  UUIDString,
  CharacterStatus,
  RelationshipType,
  ImpactLevel
} from '../../domain/schema';

export const characterRouter = router({
  // Query procedures
  list: publicProcedure
    .input(z.object({ worldId: UUIDString }))
    .output(Character.array())
    .query(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.findByWorldId(input.worldId);
    }),

  get: publicProcedure
    .input(UUIDString)
    .output(Character.nullable())
    .query(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.get(input);
    }),

  getByFaction: publicProcedure
    .input(z.object({ factionId: UUIDString }))
    .output(Character.array())
    .query(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.findByFactionId(input.factionId);
    }),

  getByLocation: publicProcedure
    .input(z.object({ 
      locationId: UUIDString,
      currentOnly: z.boolean().optional().default(true)
    }))
    .output(Character.array())
    .query(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.findByLocationId(input.locationId, input.currentOnly);
    }),

  getRelationships: publicProcedure
    .input(z.object({ characterId: UUIDString }))
    .output(CharacterRelation.array())
    .query(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.getRelationships(input.characterId);
    }),

  getMajorCharacters: publicProcedure
    .input(z.object({ worldId: UUIDString }))
    .output(Character.array())
    .query(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.getMajorCharacters(input.worldId);
    }),

  getDeceasedLegacies: publicProcedure
    .input(z.object({ worldId: UUIDString }))
    .output(Character.array())
    .query(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.getDeceasedLegacies(input.worldId);
    }),

  // Mutation procedures
  createPlayer: authedProcedure
    .input(CreateCharacter)
    .output(Character)
    .mutation(async ({ input, ctx }) => {
      const characterService = container.resolve(CharacterService);
      const userId = ctx.session?.user?.id;
      if (!userId) throw new Error('Unauthorized');
      
      return characterService.createPlayerCharacter(userId, input);
    }),

  spawnNPCs: authedProcedure
    .input(SpawnContext)
    .output(Character.array())
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.spawnNPCs(input);
    }),

  updateCharacter: authedProcedure
    .input(z.object({
      id: UUIDString,
      updates: UpdateCharacter
    }))
    .output(Character)
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      const char = await characterService.get(input.id);
      if (!char) throw new Error('Character not found');
      
      const repo = container.resolve('ICharacterRepository');
      return (repo as any).update(input.id, input.updates);
    }),

  relocate: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      locationId: UUIDString,
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      await characterService.relocate(
        input.characterId,
        input.locationId,
        input.reason
      );
      return { success: true };
    }),

  changeFaction: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      factionId: UUIDString.nullable(),
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      await characterService.changeFaction(
        input.characterId,
        input.factionId,
        input.reason
      );
      return { success: true };
    }),

  updateStatus: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      status: CharacterStatus,
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      await characterService.updateStatus(
        input.characterId,
        input.status,
        input.reason
      );
      return { success: true };
    }),

  die: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      cause: z.string(),
      impact: ImpactLevel
    }))
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      await characterService.die(
        input.characterId,
        input.cause,
        input.impact
      );
      return { success: true };
    }),

  resurrect: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      method: z.string()
    }))
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      await characterService.resurrect(
        input.characterId,
        input.method
      );
      return { success: true };
    }),

  // Relationship management
  formRelationship: authedProcedure
    .input(z.object({
      char1Id: UUIDString,
      char2Id: UUIDString,
      type: RelationshipType,
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      await characterService.formRelationship(
        input.char1Id,
        input.char2Id,
        input.type,
        input.reason
      );
      return { success: true };
    }),

  updateGoals: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      goals: z.array(z.string())
    }))
    .output(Character)
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      const repo = container.resolve('ICharacterRepository');
      return (repo as any).update(input.characterId, { goals: input.goals });
    }),

  updatePersonality: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      updates: PersonalityUpdate
    }))
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      await characterService.updatePersonality(
        input.characterId,
        input.updates
      );
      return { success: true };
    }),

  addReputation: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      tag: z.string(),
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      await characterService.addReputation(
        input.characterId,
        input.tag,
        input.reason
      );
      return { success: true };
    }),

  achieveGoal: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      goal: z.string()
    }))
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      await characterService.achieveGoal(
        input.characterId,
        input.goal
      );
      return { success: true };
    }),

  // AI operations
  enrichCharacter: authedProcedure
    .input(z.object({
      characterId: UUIDString,
      context: EnrichmentContext
    }))
    .output(Character)
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.enrichWithAI(
        input.characterId,
        input.context
      );
    }),

  generateNPCsForBeat: authedProcedure
    .input(z.object({
      worldId: UUIDString,
      beatContext: z.string(),
      count: z.number().int().min(1).max(10).optional().default(3)
    }))
    .output(Character.array())
    .mutation(async ({ input }) => {
      const characterService = container.resolve(CharacterService);
      return characterService.spawnNPCs({
        world_id: input.worldId,
        count: input.count,
        context: input.beatContext
      });
    })
});