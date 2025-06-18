import { injectable, inject } from 'tsyringe';
import { createLogger } from '../../../core/infra/logger';
import type { IEventBus } from '../../../core/infra/eventBus';
import type { ICharacterRepository, ICharacterAI } from '../domain/ports';
import type { 
  Character, 
  CreateCharacter, 
  UpdateCharacter,
  CharacterRelation,
  CreateCharacterRelation,
  CharacterStatus,
  PersonalityUpdate,
  SpawnContext,
  EnrichmentContext,
  HistoricalEvent,
  ImpactLevel,
  RelationshipType
} from '../domain/schema';
import type * as Events from '../domain/events';
import type { WorldRepo } from '../../world/domain/ports';
import type { IFactionRepository } from '../../faction/domain/ports';
import type { LocationRepository } from '../../location/domain/ports';

const logger = createLogger('character.service');

@injectable()
export class CharacterService {
  constructor(
    @inject('ICharacterRepository') private repo: ICharacterRepository,
    @inject('ICharacterAI') private ai: ICharacterAI,
    @inject('WorldRepo') private worldRepo: WorldRepo,
    @inject('IFactionRepository') private factionRepo: IFactionRepository,
    @inject('LocationRepository') private locationRepo: LocationRepository,
    @inject('eventBus') private eventBus: IEventBus
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventBus.on('world.created', async (evt: any) => {
      await this.handleWorldCreated(evt.payload);
    });
    
    this.eventBus.on('world.beat.created', async (evt: any) => {
      await this.reactToBeat(evt.payload);
    });
    
    this.eventBus.on('faction.created', async (evt: any) => {
      await this.generateForFaction(evt.payload.factionId);
    });
    
    this.eventBus.on('location.status_changed', async (evt: any) => {
      await this.handleLocationStatusChange(evt.payload);
    });
  }

  // Creation methods
  async createPlayerCharacter(userId: string, input: CreateCharacter): Promise<Character> {
    logger.info('Creating player character', { 
      name: input.name, 
      worldId: input.world_id,
      userId 
    });
    
    if (input.type !== 'player') {
      throw new Error('Invalid character type for player creation');
    }
    
    const character = await this.repo.create({
      ...input,
      user_id: userId,
      type: 'player'
    });
    
    await this.emitCharacterCreated(character);
    
    if (input.faction_id) {
      await this.createFactionRelationships(character);
    }
    
    return character;
  }

  async spawnNPCs(context: SpawnContext): Promise<Character[]> {
    logger.info('Spawning NPCs', { 
      worldId: context.world_id,
      count: context.count,
      context: context.context 
    });

    const world = await this.worldRepo.getWorld(context.world_id);
    if (!world) throw new Error('World not found');

    const existingCharacters = await this.repo.findByWorldId(context.world_id);
    const factions = context.faction_id 
      ? [await this.factionRepo.findById(context.faction_id)]
      : await this.factionRepo.findByWorldId(context.world_id);

    const factionContext = factions
      .filter(f => f !== null)
      .map(f => ({ id: f!.id, name: f!.name, ideology: f!.ideology }));

    const generatedData = await this.ai.generateBeatCharacters({
      worldId: context.world_id,
      worldTheme: world.description,
      beatDirective: context.context,
      beatContext: context.context,
      existingCharacters: existingCharacters.map(c => ({ 
        name: c.name, 
        role: c.story_role 
      })),
      factionContext
    });

    const characters: Character[] = [];
    
    for (const charData of generatedData.characters) {
      const character = await this.repo.create({
        world_id: context.world_id,
        user_id: null,
        name: charData.name,
        type: 'npc',
        status: 'alive',
        story_role: charData.story_role as any,
        personality_traits: charData.personality_traits,
        core_beliefs: charData.core_beliefs,
        goals: charData.initial_goals,
        fears: [],
        faction_id: charData.faction_id || context.faction_id || null,
        home_location_id: context.location_id || null,
        current_location_id: context.location_id || null,
        date_of_birth: null,
        date_of_death: null,
        appearance_description: null,
        backstory: charData.backstory,
        voice_description: null
      });
      
      await this.emitCharacterCreated(character);
      characters.push(character);
    }
    
    return characters;
  }

  async generateForFaction(factionId: string): Promise<Character[]> {
    logger.info('Generating characters for faction', { factionId });
    
    const faction = await this.factionRepo.findById(factionId);
    if (!faction) throw new Error('Faction not found');
    
    const world = await this.worldRepo.getWorld(faction.world_id);
    if (!world) throw new Error('World not found');
    
    const existingCharacters = await this.repo.findByWorldId(faction.world_id);
    
    const generatedData = await this.ai.generateFactionCharacters({
      worldId: faction.world_id,
      worldTheme: world.description,
      factionId: faction.id,
      factionName: faction.name,
      factionIdeology: faction.ideology,
      existingCharacters: existingCharacters.map(c => c.name)
    });
    
    const characters: Character[] = [];
    const roleToCharacter = new Map<string, Character>();
    
    // Create all characters first
    for (const charData of generatedData.characters) {
      const character = await this.repo.create({
        world_id: faction.world_id,
        user_id: null,
        name: charData.name,
        type: 'npc',
        status: 'alive',
        story_role: charData.role.toLowerCase().includes('leader') ? 'major' : 'minor',
        personality_traits: charData.personality_traits,
        core_beliefs: charData.core_beliefs,
        goals: charData.initial_goals,
        fears: [],
        faction_id: faction.id,
        home_location_id: faction.home_location_id,
        current_location_id: faction.home_location_id,
        date_of_birth: null,
        date_of_death: null,
        appearance_description: null,
        backstory: charData.backstory,
        voice_description: null
      });
      
      await this.emitCharacterCreated(character);
      characters.push(character);
      roleToCharacter.set(charData.role, character);
    }
    
    // Create relationships between faction members
    for (let i = 0; i < generatedData.characters.length; i++) {
      const charData = generatedData.characters[i];
      const character = characters[i];
      
      for (const rel of charData.relationships) {
        const targetChar = roleToCharacter.get(rel.target_role);
        if (targetChar && targetChar.id !== character.id) {
          logger.debug('Creating relationship', { 
            from: character.name, 
            to: targetChar.name, 
            type: rel.type 
          });
          await this.formRelationship(
            character.id, 
            targetChar.id, 
            rel.type,
            rel.description
          );
        }
      }
    }
    
    return characters;
  }

  // Query methods
  async get(id: string): Promise<Character | null> {
    return await this.repo.findById(id);
  }

  async findByWorldId(worldId: string): Promise<Character[]> {
    return await this.repo.findByWorldId(worldId);
  }

  async findByFactionId(factionId: string): Promise<Character[]> {
    return await this.repo.findByFactionId(factionId);
  }

  async findByLocationId(locationId: string, currentOnly: boolean = true): Promise<Character[]> {
    return await this.repo.findByLocationId(locationId, currentOnly);
  }

  async getRelationships(characterId: string): Promise<CharacterRelation[]> {
    return await this.repo.findRelationsForCharacter(characterId);
  }

  async getMajorCharacters(worldId: string): Promise<Character[]> {
    const all = await this.repo.findByWorldId(worldId);
    return all.filter(c => c.story_role === 'major');
  }

  async getDeceasedLegacies(worldId: string): Promise<Character[]> {
    return await this.repo.findByStatus(worldId, 'deceased');
  }

  // State management
  async updateStatus(
    id: string, 
    status: CharacterStatus, 
    reason: string
  ): Promise<void> {
    logger.info('Updating character status', { id, status, reason });
    
    const character = await this.repo.findById(id);
    if (!character) throw new Error('Character not found');
    
    const previousStatus = character.status;
    
    const updates: UpdateCharacter = { status };
    if (status === 'deceased') {
      updates.date_of_death = new Date().toISOString();
    }
    
    await this.repo.update(id, updates);
    
    this.eventBus.emit<Events.CharacterStatusChanged>('character.status_changed', {
      v: 1,
      worldId: character.world_id,
      characterId: id,
      name: character.name,
      previousStatus,
      newStatus: status,
      reason
    });
    
    await this.addHistoricalEvent(id, {
      timestamp: new Date().toISOString(),
      event: `Status changed to ${status}: ${reason}`,
      impact_on_story: this.determineStatusChangeImpact(character, status),
      related_characters: []
    });
  }

  async relocate(id: string, locationId: string, reason: string): Promise<void> {
    logger.info('Relocating character', { id, locationId, reason });
    
    const character = await this.repo.findById(id);
    if (!character) throw new Error('Character not found');
    
    const fromLocationId = character.current_location_id;
    
    await this.repo.update(id, { current_location_id: locationId });
    
    this.eventBus.emit<Events.CharacterRelocated>('character.relocated', {
      v: 1,
      worldId: character.world_id,
      characterId: id,
      name: character.name,
      fromLocationId: fromLocationId || undefined,
      toLocationId: locationId,
      reason
    });
  }

  async changeFaction(
    id: string, 
    factionId: string | null, 
    reason: string
  ): Promise<void> {
    logger.info('Changing character faction', { id, factionId, reason });
    
    const character = await this.repo.findById(id);
    if (!character) throw new Error('Character not found');
    
    const previousFactionId = character.faction_id;
    
    await this.repo.update(id, { faction_id: factionId });
    
    this.eventBus.emit<Events.CharacterFactionChanged>('character.faction_changed', {
      v: 1,
      worldId: character.world_id,
      characterId: id,
      name: character.name,
      previousFactionId: previousFactionId || undefined,
      newFactionId: factionId || undefined,
      reason
    });
    
    await this.addHistoricalEvent(id, {
      timestamp: new Date().toISOString(),
      event: factionId 
        ? `Joined new faction: ${reason}`
        : `Left faction: ${reason}`,
      impact_on_story: character.story_role === 'major' ? 'moderate' : 'minor',
      related_characters: []
    });
  }

  async die(id: string, cause: string, impactLevel: ImpactLevel): Promise<void> {
    logger.info('Character dying', { id, cause, impactLevel });
    
    const character = await this.repo.findById(id);
    if (!character) throw new Error('Character not found');
    
    if (character.status === 'deceased') {
      logger.warn('Character already deceased', { id });
      return;
    }
    
    const currentBeat = await this.worldRepo.getCurrentBeat(character.world_id);
    
    await this.updateStatus(id, 'deceased', cause);
    
    this.eventBus.emit<Events.CharacterDied>('character.died', {
      v: 1,
      worldId: character.world_id,
      characterId: id,
      name: character.name,
      cause,
      impactLevel,
      beatId: currentBeat?.id || '',
      beatIndex: currentBeat?.beat_index || 0
    });
    
    // Log as world event if significant
    if (impactLevel === 'major' || impactLevel === 'defining') {
      const world = await this.worldRepo.getWorld(character.world_id);
      const arc = world?.current_arc_id ? await this.worldRepo.getArc(world.current_arc_id) : null;
      
      if (arc && currentBeat) {
        await this.worldRepo.createEvent({
          world_id: character.world_id,
          arc_id: arc.id,
          beat_id: currentBeat.id,
          event_type: 'world_event',
          description: `${character.name} has died: ${cause}`,
          impact_level: 'major'
        });
      }
    }
  }

  async resurrect(id: string, method: string): Promise<void> {
    logger.info('Resurrecting character', { id, method });
    
    const character = await this.repo.findById(id);
    if (!character) throw new Error('Character not found');
    
    if (character.status !== 'deceased') {
      throw new Error('Character is not deceased');
    }
    
    await this.updateStatus(id, 'alive', `Resurrected through ${method}`);
    
    const world = await this.worldRepo.getWorld(character.world_id);
    const arc = world?.current_arc_id ? await this.worldRepo.getArc(world.current_arc_id) : null;
    const currentBeat = arc ? await this.worldRepo.getCurrentBeat(arc.id) : null;
    
    if (arc && currentBeat) {
      await this.worldRepo.createEvent({
        world_id: character.world_id,
        arc_id: arc.id,
        beat_id: currentBeat.id,
        event_type: 'world_event',
        description: `${character.name} has been resurrected through ${method}`,
        impact_level: 'major'
      });
    }
  }

  // Relationship management
  async formRelationship(
    char1Id: string,
    char2Id: string,
    type: RelationshipType,
    reason: string
  ): Promise<void> {
    logger.info('Forming relationship', { char1Id, char2Id, type, reason });
    
    const [char1, char2] = await Promise.all([
      this.repo.findById(char1Id),
      this.repo.findById(char2Id)
    ]);
    
    if (!char1 || !char2) throw new Error('Character not found');
    if (char1.world_id !== char2.world_id) throw new Error('Characters from different worlds');
    
    // Check if relationship already exists
    const existing = await this.repo.findRelationBetween(char1Id, char2Id);
    if (existing) {
      logger.warn('Relationship already exists', { char1Id, char2Id });
      return;
    }
    
    const sentiment = this.calculateInitialSentiment(type);
    
    await this.repo.createRelation({
      world_id: char1.world_id,
      character_id: char1Id,
      target_character_id: char2Id,
      relationship_type: type,
      sentiment,
      description: reason
    });
    
    this.eventBus.emit<Events.CharacterRelationshipFormed>('character.relationship_formed', {
      v: 1,
      worldId: char1.world_id,
      characterId: char1Id,
      targetCharacterId: char2Id,
      characterName: char1.name,
      targetName: char2.name,
      relationshipType: type,
      sentiment,
      reason
    });
  }

  async updateRelationship(
    relationId: string,
    sentimentDelta: number,
    reason: string
  ): Promise<void> {
    logger.info('Updating relationship', { relationId, sentimentDelta, reason });
    
    const relation = await this.repo.findRelationsForCharacter('');
    // Note: Need to add findRelationById to repository
    
    // For now, update with new sentiment
    await this.repo.updateRelation(relationId, sentimentDelta, reason);
  }

  async breakRelationship(relationId: string, reason: string): Promise<void> {
    logger.info('Breaking relationship', { relationId, reason });
    
    // Note: Need to get relation details before deletion
    await this.repo.deleteRelation(relationId);
    
    // Should emit relationship broken event
  }

  // Character development
  async achieveGoal(id: string, goal: string): Promise<void> {
    logger.info('Character achieving goal', { id, goal });
    
    const character = await this.repo.findById(id);
    if (!character) throw new Error('Character not found');
    
    const newGoals = character.goals.filter(g => g !== goal);
    await this.repo.update(id, { goals: newGoals });
    
    const impact: ImpactLevel = character.story_role === 'major' ? 'moderate' : 'minor';
    
    this.eventBus.emit<Events.CharacterAchievedGoal>('character.achieved_goal', {
      v: 1,
      worldId: character.world_id,
      characterId: id,
      name: character.name,
      goal,
      impact
    });
    
    await this.addHistoricalEvent(id, {
      timestamp: new Date().toISOString(),
      event: `Achieved goal: ${goal}`,
      impact_on_story: impact,
      related_characters: []
    });
  }

  async addReputation(id: string, tag: string, reason: string): Promise<void> {
    logger.info('Adding reputation tag', { id, tag, reason });
    
    await this.repo.addReputationTag(id, tag);
    
    await this.addHistoricalEvent(id, {
      timestamp: new Date().toISOString(),
      event: `Gained reputation: ${tag} - ${reason}`,
      impact_on_story: 'minor',
      related_characters: []
    });
  }

  async witnessBeat(id: string, beatIndex: number): Promise<void> {
    await this.repo.addStoryBeatWitnessed(id, beatIndex);
  }

  async updatePersonality(
    id: string, 
    changes: PersonalityUpdate
  ): Promise<void> {
    logger.info('Updating character personality', { id, changes });
    
    await this.repo.update(id, changes);
  }

  // AI operations
  async enrichWithAI(id: string, context: EnrichmentContext): Promise<Character> {
    logger.info('Enriching character with AI', { id });
    
    const character = await this.repo.findById(id);
    if (!character) throw new Error('Character not found');
    
    const faction = character.faction_id 
      ? await this.factionRepo.findById(character.faction_id)
      : null;
    
    const enrichment = await this.ai.enrichCharacterHistory({
      characterId: id,
      name: character.name,
      role: character.story_role,
      faction: faction?.name,
      worldTheme: context.world_theme,
      worldHistory: context.recent_events
    });
    
    const updates: UpdateCharacter = {
      backstory: enrichment.backstory,
      appearance_description: enrichment.appearance_description,
      voice_description: enrichment.voice_description
    };
    
    if (enrichment.additional_traits) {
      updates.personality_traits = [
        ...character.personality_traits,
        ...enrichment.additional_traits
      ];
    }
    
    return await this.repo.update(id, updates);
  }

  // Event handlers
  private async handleWorldCreated(payload: any): Promise<void> {
    logger.info('Handling world created event', { worldId: payload.worldId });
    // Initial characters are generated when factions are created
  }

  private async reactToBeat(payload: any): Promise<void> {
    logger.info('Characters reacting to beat', { 
      worldId: payload.worldId,
      beatIndex: payload.beatIndex 
    });
    
    const world = await this.worldRepo.getWorld(payload.worldId);
    if (!world) return;
    
    const beat = await this.worldRepo.getBeat(payload.beatId);
    if (!beat) return;
    
    // Update witnessing characters
    const majorCharacters = await this.getMajorCharacters(payload.worldId);
    for (const char of majorCharacters) {
      if (char.status === 'alive') {
        await this.witnessBeat(char.id, beat.beat_index);
      }
    }
    
    // Generate characters if needed by beat directive
    const directive = beat.world_directives[0] || beat.description;
    if (this.beatRequiresCharacters(directive)) {
      await this.spawnNPCs({
        world_id: payload.worldId,
        count: 2,
        context: directive,
        role_focus: 'minor'
      });
    }
    
    // Update character goals based on events
    const recentEvents = await this.worldRepo.getRecentEvents(payload.worldId, 5);
    for (const char of majorCharacters) {
      if (char.status === 'alive' && char.goals.length > 0) {
        const goalUpdate = await this.ai.updateCharacterGoals({
          characterId: char.id,
          characterName: char.name,
          currentGoals: char.goals,
          personality: char.personality_traits,
          beliefs: char.core_beliefs,
          recentEvents: recentEvents.map(e => e.description),
          worldContext: beat.description
        });
        
        if (goalUpdate.new_goals.length > 0 || goalUpdate.abandoned_goals.length > 0) {
          const newGoals = [
            ...char.goals.filter(g => !goalUpdate.abandoned_goals.includes(g)),
            ...goalUpdate.new_goals
          ].slice(0, 5); // Max 5 goals
          
          await this.repo.update(char.id, { goals: newGoals });
        }
      }
    }
  }

  private async handleLocationStatusChange(payload: any): Promise<void> {
    if (payload.newStatus === 'destroyed' || payload.newStatus === 'abandoned') {
      const characters = await this.findByLocationId(payload.locationId);
      
      for (const char of characters) {
        if (char.status === 'alive') {
          if (payload.newStatus === 'destroyed' && Math.random() < 0.3) {
            // 30% chance of death in destruction
            await this.die(
              char.id, 
              `Killed when ${payload.locationName} was destroyed`,
              char.story_role === 'major' ? 'major' : 'minor'
            );
          } else {
            // Evacuate to home location or become refugee
            const newLocation = char.home_location_id || null;
            if (newLocation) {
              await this.relocate(
                char.id,
                newLocation,
                `Evacuated from ${payload.locationName}`
              );
            } else {
              await this.updateStatus(
                char.id,
                'missing',
                `Lost when ${payload.locationName} was ${payload.newStatus}`
              );
            }
          }
        }
      }
    }
  }

  private async createFactionRelationships(character: Character): Promise<void> {
    if (!character.faction_id) return;
    
    const factionMembers = await this.repo.findByFactionId(character.faction_id);
    const leaders = factionMembers.filter(
      c => c.id !== character.id && c.story_role === 'major'
    );
    
    for (const leader of leaders.slice(0, 1)) { // Connect to first leader
      await this.formRelationship(
        character.id,
        leader.id,
        'professional',
        'Member of the same faction'
      );
    }
  }

  // Helper methods
  private async emitCharacterCreated(character: Character): Promise<void> {
    this.eventBus.emit<Events.CharacterCreated>('character.created', {
      v: 1,
      worldId: character.world_id,
      characterId: character.id,
      name: character.name,
      type: character.type,
      factionId: character.faction_id || undefined,
      locationId: character.current_location_id || undefined
    });
  }

  private async addHistoricalEvent(
    characterId: string, 
    event: HistoricalEvent
  ): Promise<void> {
    await this.repo.addHistoricalEvent(characterId, event);
  }

  private calculateInitialSentiment(type: RelationshipType): number {
    switch (type) {
      case 'family':
      case 'romantic':
        return 75;
      case 'friendship':
        return 50;
      case 'professional':
        return 25;
      case 'rivalry':
        return -25;
      case 'nemesis':
        return -75;
      default:
        return 0;
    }
  }

  private determineStatusChangeImpact(
    character: Character, 
    newStatus: CharacterStatus
  ): ImpactLevel {
    if (newStatus === 'deceased' || newStatus === 'ascended') {
      return character.story_role === 'major' ? 'major' : 'minor';
    }
    return 'minor';
  }

  private beatRequiresCharacters(directive: string): boolean {
    const keywords = [
      'new character',
      'stranger arrives',
      'messenger',
      'refugee',
      'survivor',
      'leader emerges',
      'prophet appears'
    ];
    
    const lower = directive.toLowerCase();
    return keywords.some(keyword => lower.includes(keyword));
  }
}