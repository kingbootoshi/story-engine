import { injectable, inject } from 'tsyringe';
import { createLogger } from '../../../core/infra/logger';
import { eventBus } from '../../../core/infra/eventBus';
import type { ICharacterRepository, ICharacterAI } from '../domain/ports';
import type { Character, CreateCharacter, UpdateCharacter } from '../domain/schema';
import type * as Events from '../domain/events';
import type { FactionSeedingComplete } from '../../faction/domain/events';
import type { StoryBeatCreated, WorldEventLogged } from '../../world/domain/events';
import type { WorldRepo } from '../../world/domain/ports';
import type { IFactionRepository } from '../../faction/domain/ports';
import type { LocationRepository } from '../../location/domain/ports';
import type { TrpcCtx } from '../../../core/trpc/context';
import { resolveFactionIdentifier } from '../../../shared/utils/resolveFactionIdentifier';
import type { Faction } from '../../faction/domain/schema';

const logger = createLogger('character.service');

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

@injectable()
export class CharacterService {
  constructor(
    @inject('ICharacterRepository') private repo: ICharacterRepository,
    @inject('ICharacterAI') private ai: ICharacterAI,
    @inject('WorldRepo') private worldRepo: WorldRepo,
    @inject('IFactionRepository') private factionRepo: IFactionRepository,
    @inject('LocationRepository') private locationRepo: LocationRepository
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    eventBus.on('faction.seeding.complete', async (evt: { payload: FactionSeedingComplete }) => {
      await this.seedCharacters(evt.payload);
    });
    
    eventBus.on('world.beat.created', async (evt: { payload: StoryBeatCreated }) => {
      await this.processBeatReactions(evt.payload);
    });
  }

  async create(input: CreateCharacter, ctx: TrpcCtx): Promise<Character> {
    logger.info('Creating character', { 
      name: input.name, 
      worldId: input.world_id,
      correlation: ctx.reqId
    });
    
    const character = await this.repo.create(input);
    
    eventBus.emit<Events.CharacterCreated>('character.created', {
      v: 1,
      worldId: character.world_id,
      characterId: character.id,
      name: character.name,
      factionId: character.faction_id,
      locationId: character.location_id,
      storyRole: character.story_role
    });
    
    return character;
  }

  async update(id: string, updates: UpdateCharacter, ctx: TrpcCtx): Promise<Character> {
    logger.info('Updating character', { id, updates, correlation: ctx.reqId });
    
    const character = await this.repo.findById(id);
    if (!character) throw new Error('Character not found');
    
    if (updates.location_id !== undefined && updates.location_id !== character.location_id) {
      const currentBeat = await this.worldRepo.getCurrentBeat(character.world_id);
      eventBus.emit<Events.CharacterLocationChanged>('character.location_changed', {
        v: 1,
        worldId: character.world_id,
        characterId: id,
        fromLocationId: character.location_id,
        toLocationId: updates.location_id,
        reason: 'Manual update',
        beatIndex: currentBeat?.beat_index || 0
      });
    }
    
    if (updates.faction_id !== undefined && updates.faction_id !== character.faction_id) {
      const currentBeat = await this.worldRepo.getCurrentBeat(character.world_id);
      eventBus.emit<Events.CharacterFactionChanged>('character.faction_changed', {
        v: 1,
        worldId: character.world_id,
        characterId: id,
        fromFactionId: character.faction_id,
        toFactionId: updates.faction_id,
        reason: 'Manual update',
        beatIndex: currentBeat?.beat_index || 0
      });
    }
    
    return await this.repo.update(id, updates);
  }

  async get(id: string): Promise<Character | null> {
    return await this.repo.findById(id);
  }

  async list(worldId: string): Promise<Character[]> {
    return await this.repo.findByWorldId(worldId);
  }

  async delete(id: string, ctx: TrpcCtx): Promise<void> {
    logger.info('Deleting character', { id, correlation: ctx.reqId });
    
    const character = await this.repo.findById(id);
    if (!character) throw new Error('Character not found');
    
    await this.repo.delete(id);
  }

  private async seedCharacters(payload: FactionSeedingComplete): Promise<void> {
    const { worldId } = payload;
    logger.info('Seeding characters for world', { worldId });
    
    const world = await this.worldRepo.getWorld(worldId);
    if (!world) return;
    
    const factions = await this.factionRepo.findByWorldId(worldId);
    const locations = await this.locationRepo.findByWorldId(worldId);
    const availableLocations = locations.map(l => ({ id: l.id, name: l.name }));
    
    const traceCtx: TrpcCtx = {
      reqId: `seed-${worldId}`,
      logger,
      user: undefined
    };
    
    // ------------------------------------------------------------------
    // Run character generation for every faction ***and*** independents
    // concurrently so they all finish together.
    // ------------------------------------------------------------------
    const tasks: Promise<void>[] = [];

    // one task per faction
    for (const faction of factions) {
      tasks.push((async () => {
        const targetCount = 3 + Math.floor(Math.random() * 6);

        const characterBatch = await this.ai.generateCharacterBatch({
          worldId,
          worldTheme: world.description,
          factionId: faction.id,
          factionName: faction.name,
          factionIdeology: faction.ideology,
          existingCharacterCount: 0,
          targetCount,
          availableLocations
        }, traceCtx);

        const charactersToCreate: CreateCharacter[] = characterBatch.map(char => ({
          world_id: worldId,
          name: char.name,
          type: 'npc',
          status: 'alive',
          story_role: char.story_role,
          location_id: availableLocations.find(l => l.name === char.spawn_location)?.id || null,
          faction_id: faction.id,
          description: char.description,
          background: char.background,
          personality_traits: char.personality_traits,
          motivations: char.motivations,
          memories: [],
          story_beats_witnessed: []
        }));

        await this.repo.batchCreate(charactersToCreate);

        eventBus.emit<Events.CharacterBatchGenerated>('character.batch_generated', {
          v: 1,
          worldId,
          count: charactersToCreate.length,
          factionId: faction.id,
          trigger: 'faction_seeding'
        });
      })());
    }

    // one task for non-faction (“independent”) characters
    const independentCount = 3 + Math.floor(Math.random() * 6);
    tasks.push((async () => {
      const independentBatch = await this.ai.generateCharacterBatch({
        worldId,
        worldTheme: world.description,
        factionId: null,
        existingCharacterCount: factions.length * 5,
        targetCount: independentCount,
        availableLocations
      }, traceCtx);

      const independentCharacters: CreateCharacter[] = independentBatch.map(char => ({
        world_id: worldId,
        name: char.name,
        type: 'npc',
        status: 'alive',
        story_role: char.story_role,
        location_id: availableLocations.find(l => l.name === char.spawn_location)?.id || null,
        faction_id: null,
        description: char.description,
        background: char.background,
        personality_traits: char.personality_traits,
        motivations: char.motivations,
        memories: [],
        story_beats_witnessed: []
      }));

      await this.repo.batchCreate(independentCharacters);

      eventBus.emit<Events.CharacterBatchGenerated>('character.batch_generated', {
        v: 1,
        worldId,
        count: independentCharacters.length,
        factionId: null,
        trigger: 'faction_seeding'
      });
    })());

    // Wait for all generation tasks to complete in parallel
    await Promise.all(tasks);
    
    logger.success('Character seeding complete', { 
      worldId, 
      totalCharacters: (factions.length * 5) + independentCount 
    });
  }

  private async processBeatReactions(payload: StoryBeatCreated): Promise<void> {
    const { worldId, beatId, beatIndex, directives, emergent } = payload;
    logger.info('Processing character reactions to beat', { worldId, beatId, beatIndex });
    
    const [characters, factions, locations] = await Promise.all([
      this.repo.findByWorldId(worldId),
      this.factionRepo.findByWorldId(worldId),
      this.locationRepo.findByWorldId(worldId)
    ]);
    
    const factionRelations: Record<string, Record<string, string>> = {};
    for (const faction of factions) {
      const relations = await this.factionRepo.getRelations(faction.id);
      factionRelations[faction.name] = {};
      for (const rel of relations) {
        const targetFaction = factions.find(f => 
          f.id === (rel.source_id === faction.id ? rel.target_id : rel.source_id)
        );
        if (targetFaction) {
          factionRelations[faction.name][targetFaction.name] = rel.stance;
        }
      }
    }
    
    const traceCtx: TrpcCtx = {
      reqId: `beat-${beatId}`,
      logger,
      user: undefined
    };
    
    const beat = await this.worldRepo.getBeat(beatId);
    if (!beat) return;
    
    await this.checkForNewCharacters({
      beat: {
        description: beat.description,
        directives,
        emergent
      },
      world_theme: (await this.worldRepo.getWorld(worldId))?.description || '',
      existing_factions: factions.map(f => `${f.name}: ${f.ideology}`),
      existing_locations: locations.map(l => ({ id: l.id, name: l.name })),
      current_character_count: characters.length
    }, traceCtx, worldId, beatIndex, factions);
    
    const characterBatches = chunk(characters, 10);
    
    for (const batch of characterBatches) {
      await Promise.all(batch.map(async (character) => {
        const currentLocation = locations.find(l => l.id === character.location_id);
        const currentFaction = factions.find(f => f.id === character.faction_id);
        
        const recentMemories = character.memories
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3);
        
        const reaction = await this.ai.evaluateCharacterReaction({
          beat: {
            description: beat.description,
            directives,
            emergent,
            beatIndex,
            beatId
          },
          character: {
            id: character.id,
            name: character.name,
            story_role: character.story_role,
            personality_traits: character.personality_traits,
            motivations: character.motivations,
            current_location: currentLocation?.name || null,
            current_faction: currentFaction?.name || null,
            recent_memories: recentMemories,
            background: character.background
          },
          world_context: {
            faction_relations: factionRelations,
            available_locations: locations.map(l => ({ id: l.id, name: l.name })),
            available_factions: factions.map(f => ({ id: f.id, name: f.name }))
          }
        }, traceCtx);
        
        if (!reaction.affected) return;
        
        await this.applyCharacterReaction(character, reaction, beatIndex, beatId);
      }));
    }
    
    logger.success('Beat reactions processed', { worldId, beatId, characterCount: characters.length });
  }

  private async checkForNewCharacters(
    context: {
      beat: { description: string; directives: string[]; emergent: string[] };
      world_theme: string;
      existing_factions: string[];
      existing_locations: Array<{ id: string; name: string }>;
      current_character_count: number;
    },
    traceCtx: TrpcCtx,
    worldId: string,
    beatIndex: number,
    factions: Faction[]
  ): Promise<void> {
    const spawnDecision = await this.ai.analyzeSpawnNeed(context, traceCtx);
    
    if (!spawnDecision.spawn_characters || spawnDecision.new_characters.length === 0) {
      return;
    }
    
    logger.info('Spawning new characters based on beat', {
      worldId,
      count: spawnDecision.new_characters.length,
      correlation: traceCtx.reqId
    });
    
    const charactersToCreate: CreateCharacter[] = spawnDecision.new_characters.map(char => ({
      world_id: worldId,
      name: char.name,
      type: 'npc',
      status: 'alive',
      story_role: char.story_role,
      location_id: context.existing_locations.find(l => l.name === char.spawn_location)?.id || null,
      faction_id: char.faction_id ? resolveFactionIdentifier(char.faction_id, factions) : null,
      description: char.description,
      background: char.background,
      personality_traits: char.personality_traits,
      motivations: char.motivations,
      memories: [],
      story_beats_witnessed: [beatIndex]
    }));
    
    await this.repo.batchCreate(charactersToCreate);
    
    eventBus.emit<Events.CharacterBatchGenerated>('character.batch_generated', {
      v: 1,
      worldId,
      count: charactersToCreate.length,
      factionId: null,
      trigger: 'beat_spawn'
    });
  }

  private async applyCharacterReaction(
    character: Character,
    reaction: any,
    beatIndex: number,
    beatId: string
  ): Promise<void> {
    const updates: UpdateCharacter = {};
    let hasChanges = false;
    
    if (reaction.changes.new_memories.length > 0) {
      for (const memory of reaction.changes.new_memories) {
        await this.repo.addMemory(character.id, memory);
        
        eventBus.emit<Events.CharacterMemoryAdded>('character.memory_added', {
          v: 1,
          worldId: character.world_id,
          characterId: character.id,
          memoryDescription: memory.event_description,
          importance: memory.importance,
          beatIndex
        });
      }
      hasChanges = true;
    }
    
    if (reaction.changes.motivation_changes.add.length > 0 || reaction.changes.motivation_changes.remove.length > 0) {
      const newMotivations = character.motivations
        .filter(m => !reaction.changes.motivation_changes.remove.includes(m))
        .concat(reaction.changes.motivation_changes.add);
      updates.motivations = newMotivations;
      
      eventBus.emit<Events.CharacterMotivationChanged>('character.motivation_changed', {
        v: 1,
        worldId: character.world_id,
        characterId: character.id,
        added: reaction.changes.motivation_changes.add,
        removed: reaction.changes.motivation_changes.remove,
        beatIndex
      });
      hasChanges = true;
    }
    
    if (reaction.changes.location_id !== undefined && reaction.changes.location_id !== character.location_id) {
      updates.location_id = reaction.changes.location_id;
      
      eventBus.emit<Events.CharacterLocationChanged>('character.location_changed', {
        v: 1,
        worldId: character.world_id,
        characterId: character.id,
        fromLocationId: character.location_id,
        toLocationId: reaction.changes.location_id,
        reason: 'Beat reaction',
        beatIndex
      });
      hasChanges = true;
    }
    
    if (reaction.changes.faction_id !== undefined && reaction.changes.faction_id !== character.faction_id) {
      updates.faction_id = reaction.changes.faction_id;
      
      eventBus.emit<Events.CharacterFactionChanged>('character.faction_changed', {
        v: 1,
        worldId: character.world_id,
        characterId: character.id,
        fromFactionId: character.faction_id,
        toFactionId: reaction.changes.faction_id,
        reason: 'Beat reaction',
        beatIndex
      });
      hasChanges = true;
    }
    
    if (reaction.changes.new_description) {
      updates.description = reaction.changes.new_description;
      hasChanges = true;
    }
    
    if (reaction.changes.background_addition) {
      updates.background = character.background + '\n\n' + reaction.changes.background_addition;
      hasChanges = true;
    }
    
    if (reaction.changes.dies) {
      updates.status = 'deceased';
      
      eventBus.emit<Events.CharacterDied>('character.died', {
        v: 1,
        worldId: character.world_id,
        characterId: character.id,
        name: character.name,
        cause: 'Beat event',
        beatId,
        beatIndex
      });
      hasChanges = true;
    }
    
    if (!character.story_beats_witnessed.includes(beatIndex)) {
      await this.repo.addWitnessedBeat(character.id, beatIndex);
    }
    
    if (hasChanges) {
      await this.repo.update(character.id, updates);
      
      eventBus.emit<Events.CharacterReacted>('character.reacted', {
        v: 1,
        worldId: character.world_id,
        characterId: character.id,
        beatId,
        beatIndex,
        memoriesAdded: reaction.changes.new_memories.length,
        motivationsChanged: reaction.changes.motivation_changes.add.length > 0 || reaction.changes.motivation_changes.remove.length > 0,
        locationChanged: reaction.changes.location_id !== undefined,
        factionChanged: reaction.changes.faction_id !== undefined
      });
    }
    
    if (reaction.world_event?.emit) {
      eventBus.emit<WorldEventLogged>('world.event.logged', {
        v: 1,
        worldId: character.world_id,
        eventId: `char-${character.id}-beat-${beatIndex}`,
        impact: reaction.world_event.impact,
        description: reaction.world_event.description
      });
    }
  }
}