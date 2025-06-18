import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { CharacterService } from '../../src/modules/character/application/CharacterService';
import { InMemoryCharacterRepo } from '../_shared/fakes/InMemoryCharacterRepo';
import { InMemoryWorldRepo } from '../_shared/fakes/InMemoryWorldRepo';
import { InMemoryFactionRepo } from '../_shared/fakes/InMemoryFactionRepo';
import { InMemoryLocationRepo } from '../_shared/fakes/InMemoryLocationRepo';
import { MockEventBus } from '../_shared/fakes/MockEventBus';
import { makeFakeChat } from '../_shared/helpers/mockAI';
import '../_shared/setup';

describe('CharacterService.create', () => {
  let service: CharacterService;
  let characterRepo: InMemoryCharacterRepo;
  let worldRepo: InMemoryWorldRepo;
  let factionRepo: InMemoryFactionRepo;
  let locationRepo: InMemoryLocationRepo;
  let eventBus: MockEventBus;
  let mockAI: any;

  beforeEach(() => {
    container.reset();
    
    characterRepo = new InMemoryCharacterRepo();
    worldRepo = new InMemoryWorldRepo();
    factionRepo = new InMemoryFactionRepo();
    locationRepo = new InMemoryLocationRepo();
    eventBus = new MockEventBus();
    mockAI = {
      generateFactionCharacters: vi.fn(),
      generateBeatCharacters: vi.fn(),
      updateCharacterGoals: vi.fn(),
      evaluateRelationships: vi.fn(),
      enrichCharacterHistory: vi.fn()
    };
    
    container.register('ICharacterRepository', { useValue: characterRepo });
    container.register('ICharacterAI', { useValue: mockAI });
    container.register('WorldRepo', { useValue: worldRepo });
    container.register('IFactionRepository', { useValue: factionRepo });
    container.register('LocationRepository', { useValue: locationRepo });
    container.register('eventBus', { useValue: eventBus });
    
    service = container.resolve(CharacterService);
    
    // Seed test world
    worldRepo.seed({
      id: 'world-1',
      user_id: 'user-1',
      name: 'Test World',
      description: 'A fantasy world',
      current_arc_id: 'arc-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  describe('createPlayerCharacter', () => {
    it('creates a player character successfully', async () => {
      const input = {
        world_id: 'world-1',
        user_id: 'user-1',
        name: 'Hero McGee',
        type: 'player' as const,
        status: 'alive' as const,
        story_role: 'major' as const,
        personality_traits: ['brave', 'cunning'],
        core_beliefs: ['justice above all'],
        goals: ['save the kingdom'],
        fears: ['losing loved ones'],
        faction_id: null,
        home_location_id: null,
        current_location_id: null,
        date_of_birth: null,
        date_of_death: null,
        appearance_description: null,
        backstory: null,
        voice_description: null
      };

      const character = await service.createPlayerCharacter('user-1', input);

      expect(character).toMatchObject({
        name: 'Hero McGee',
        type: 'player',
        status: 'alive',
        story_role: 'major',
        user_id: 'user-1',
        world_id: 'world-1'
      });
      
      // Check event was emitted
      const events = eventBus.getEmitted('character.created');
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        v: 1,
        worldId: 'world-1',
        characterId: character.id,
        name: 'Hero McGee',
        type: 'player'
      });
    });

    it('throws error if type is not player', async () => {
      const input = {
        world_id: 'world-1',
        user_id: null,
        name: 'NPC Name',
        type: 'npc' as const,
        status: 'alive' as const,
        story_role: 'minor' as const,
        personality_traits: [],
        core_beliefs: [],
        goals: [],
        fears: [],
        faction_id: null,
        home_location_id: null,
        current_location_id: null,
        date_of_birth: null,
        date_of_death: null,
        appearance_description: null,
        backstory: null,
        voice_description: null
      };

      await expect(
        service.createPlayerCharacter('user-1', input)
      ).rejects.toThrow('Invalid character type for player creation');
    });

    it('creates faction relationships for player with faction', async () => {
      // Seed faction and leader
      factionRepo.seed({
        id: 'faction-1',
        world_id: 'world-1',
        name: 'The Order',
        banner_color: '#0000FF',
        emblem_svg: null,
        ideology: 'Order and justice',
        status: 'stable',
        members_estimate: 1000,
        home_location_id: null,
        controlled_locations: [],
        tags: ['military', 'lawful'],
        historical_events: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      characterRepo.seed({
        id: 'leader-1',
        world_id: 'world-1',
        user_id: null,
        name: 'General Smith',
        type: 'npc',
        status: 'alive',
        story_role: 'major',
        personality_traits: ['disciplined', 'wise'],
        core_beliefs: ['order above chaos'],
        goals: ['maintain peace'],
        fears: [],
        faction_id: 'faction-1',
        home_location_id: null,
        current_location_id: null,
        story_beats_witnessed: [],
        reputation_tags: [],
        historical_events: [],
        date_of_birth: null,
        date_of_death: null,
        appearance_description: null,
        backstory: null,
        voice_description: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      });

      const input = {
        world_id: 'world-1',
        user_id: 'user-1',
        name: 'Recruit Jones',
        type: 'player' as const,
        status: 'alive' as const,
        story_role: 'minor' as const,
        personality_traits: ['eager', 'loyal'],
        core_beliefs: ['serve the order'],
        goals: ['prove myself'],
        fears: ['dishonor'],
        faction_id: 'faction-1',
        home_location_id: null,
        current_location_id: null,
        date_of_birth: null,
        date_of_death: null,
        appearance_description: null,
        backstory: null,
        voice_description: null
      };

      const character = await service.createPlayerCharacter('user-1', input);

      // Check relationship was formed
      const relations = await characterRepo.findRelationsForCharacter(character.id);
      expect(relations).toHaveLength(1);
      expect(relations[0]).toMatchObject({
        character_id: character.id,
        target_character_id: 'leader-1',
        relationship_type: 'professional',
        sentiment: 25
      });

      // Check relationship formed event
      const events = eventBus.getEmitted('character.relationship_formed');
      expect(events).toHaveLength(1);
    });
  });

  describe('spawnNPCs', () => {
    beforeEach(() => {
      mockAI.generateBeatCharacters.mockResolvedValue({
        characters: [
          {
            name: 'Mysterious Stranger',
            type: 'npc',
            story_role: 'minor',
            personality_traits: ['enigmatic', 'wise', 'cautious'],
            core_beliefs: ['knowledge is power', 'trust no one'],
            initial_goals: ['deliver the message', 'observe events'],
            backstory: 'A wanderer with unknown origins'
          },
          {
            name: 'Village Elder',
            type: 'npc',
            story_role: 'background',
            personality_traits: ['kind', 'traditional', 'worried'],
            core_beliefs: ['protect the village', 'honor ancestors'],
            initial_goals: ['keep peace', 'preserve traditions'],
            backstory: 'Has led the village for decades'
          }
        ]
      });
    });

    it('spawns NPCs based on context', async () => {
      const context = {
        world_id: 'world-1',
        count: 2,
        context: 'A mysterious stranger arrives with urgent news'
      };

      const characters = await service.spawnNPCs(context);

      expect(characters).toHaveLength(2);
      expect(characters[0]).toMatchObject({
        name: 'Mysterious Stranger',
        type: 'npc',
        story_role: 'minor'
      });
      expect(characters[1]).toMatchObject({
        name: 'Village Elder',
        type: 'npc',
        story_role: 'background'
      });

      // Check AI was called correctly
      expect(mockAI.generateBeatCharacters).toHaveBeenCalledWith({
        worldId: 'world-1',
        worldTheme: 'A fantasy world',
        beatDirective: context.context,
        beatContext: context.context,
        existingCharacters: [],
        factionContext: []
      });

      // Check events
      const events = eventBus.getEmitted('character.created');
      expect(events).toHaveLength(2);
    });

    it('includes faction context when faction specified', async () => {
      factionRepo.seed({
        id: 'faction-1',
        world_id: 'world-1',
        name: 'The Rebels',
        banner_color: '#FF0000',
        emblem_svg: null,
        ideology: 'Freedom through revolution',
        status: 'rising',
        members_estimate: 500,
        home_location_id: null,
        controlled_locations: [],
        tags: ['revolutionary', 'chaotic'],
        historical_events: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const context = {
        world_id: 'world-1',
        faction_id: 'faction-1',
        count: 1,
        context: 'Rebel scouts report enemy movements'
      };

      await service.spawnNPCs(context);

      expect(mockAI.generateBeatCharacters).toHaveBeenCalledWith(
        expect.objectContaining({
          factionContext: [{
            id: 'faction-1',
            name: 'The Rebels',
            ideology: 'Freedom through revolution'
          }]
        })
      );
    });
  });

  describe('generateForFaction', () => {
    beforeEach(() => {
      factionRepo.seed({
        id: 'faction-1',
        world_id: 'world-1',
        name: 'Iron Legion',
        banner_color: '#666666',
        emblem_svg: null,
        ideology: 'Strength through unity',
        status: 'stable',
        members_estimate: 2000,
        home_location_id: 'location-1',
        controlled_locations: ['location-1'],
        tags: ['military', 'disciplined'],
        historical_events: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      mockAI.generateFactionCharacters.mockResolvedValue({
        characters: [
          {
            name: 'Commander Steele',
            role: 'Faction Leader',
            personality_traits: ['stern', 'tactical', 'loyal'],
            core_beliefs: ['unity is strength', 'discipline above all'],
            initial_goals: ['expand territory', 'train new recruits'],
            backstory: 'Rose through the ranks through merit',
            relationships: [
              {
                target_role: 'Chief Advisor',
                type: 'professional',
                description: 'Trusted counsel for years'
              }
            ]
          },
          {
            name: 'Sage Willow',
            role: 'Chief Advisor',
            personality_traits: ['wise', 'patient', 'perceptive'],
            core_beliefs: ['knowledge guides action', 'patience wins wars'],
            initial_goals: ['guide the commander', 'preserve legion history'],
            backstory: 'Former scholar turned military advisor',
            relationships: [
              {
                target_role: 'Faction Leader',
                type: 'professional',
                description: 'Advises on strategy'
              }
            ]
          }
        ]
      });
    });

    it('generates characters for a faction with relationships', async () => {
      const characters = await service.generateForFaction('faction-1');

      expect(characters).toHaveLength(2);
      expect(characters[0]).toMatchObject({
        name: 'Commander Steele',
        type: 'npc',
        story_role: 'major',
        faction_id: 'faction-1'
      });
      expect(characters[1]).toMatchObject({
        name: 'Sage Willow',
        type: 'npc',
        story_role: 'minor',
        faction_id: 'faction-1'
      });

      // Check relationships were created
      const leaderRelations = await characterRepo.findRelationsForCharacter(characters[0].id);
      expect(leaderRelations).toHaveLength(2); // Leader is involved in 2 relationships
      
      // Find the relationship where leader is the source
      const leaderToAdvisor = leaderRelations.find(r => r.character_id === characters[0].id);
      expect(leaderToAdvisor).toMatchObject({
        character_id: characters[0].id,
        target_character_id: characters[1].id,
        relationship_type: 'professional'
      });
      
      // Find the relationship where leader is the target
      const advisorToLeader = leaderRelations.find(r => r.target_character_id === characters[0].id);
      expect(advisorToLeader).toMatchObject({
        character_id: characters[1].id,
        target_character_id: characters[0].id,
        relationship_type: 'professional'
      });

      // Check AI was called correctly
      expect(mockAI.generateFactionCharacters).toHaveBeenCalledWith({
        worldId: 'world-1',
        worldTheme: 'A fantasy world',
        factionId: 'faction-1',
        factionName: 'Iron Legion',
        factionIdeology: 'Strength through unity',
        existingCharacters: []
      });

      // Check events
      const createEvents = eventBus.getEmitted('character.created');
      expect(createEvents).toHaveLength(2);
      
      const relationEvents = eventBus.getEmitted('character.relationship_formed');
      expect(relationEvents).toHaveLength(2); // Both directions
    });

    it('throws error if faction not found', async () => {
      await expect(
        service.generateForFaction('nonexistent-faction')
      ).rejects.toThrow('Faction not found');
    });
  });
});