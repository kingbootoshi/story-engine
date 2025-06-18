import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { CharacterService } from '../../src/modules/character/application/CharacterService';
import { InMemoryCharacterRepo } from '../_shared/fakes/InMemoryCharacterRepo';
import { InMemoryWorldRepo } from '../_shared/fakes/InMemoryWorldRepo';
import { InMemoryFactionRepo } from '../_shared/fakes/InMemoryFactionRepo';
import { InMemoryLocationRepo } from '../_shared/fakes/InMemoryLocationRepo';
import { MockEventBus } from '../_shared/fakes/MockEventBus';
import type { Character } from '../../src/modules/character/domain/schema';
import '../_shared/setup';

describe('CharacterService.events', () => {
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

  describe('faction.created event', () => {
    beforeEach(() => {
      mockAI.generateFactionCharacters.mockResolvedValue({
        characters: [
          {
            name: 'Leader Name',
            role: 'Faction Leader',
            personality_traits: ['charismatic', 'strategic'],
            core_beliefs: ['unity through strength'],
            initial_goals: ['expand influence'],
            backstory: 'Rose to power through merit',
            relationships: []
          }
        ]
      });

      factionRepo.seed({
        id: 'faction-1',
        world_id: 'world-1',
        name: 'New Faction',
        banner_color: '#FF0000',
        emblem_svg: null,
        ideology: 'Revolutionary ideals',
        status: 'rising',
        members_estimate: 100,
        home_location_id: null,
        controlled_locations: [],
        tags: ['revolutionary'],
        historical_events: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    it('generates characters when faction is created', async () => {
      await eventBus.emit('faction.created', {
        v: 1,
        worldId: 'world-1',
        factionId: 'faction-1',
        name: 'New Faction'
      });

      // Give event handler time to process
      await new Promise(resolve => setTimeout(resolve, 10));

      const factionChars = await characterRepo.findByFactionId('faction-1');
      expect(factionChars).toHaveLength(1);
      expect(factionChars[0]).toMatchObject({
        name: 'Leader Name',
        faction_id: 'faction-1',
        story_role: 'major'
      });
    });
  });

  describe('world.beat.created event', () => {
    let testCharacters: Character[];

    beforeEach(() => {
      // Seed beat
      worldRepo.seedBeat({
        id: 'beat-1',
        arc_id: 'arc-1',
        beat_index: 5,
        beat_type: 'dynamic',
        beat_name: 'A mysterious stranger arrives',
        description: 'The stranger brings word of danger...',
        world_directives: ['A mysterious stranger arrives with urgent news'],
        emergent_storylines: [],
        created_at: new Date().toISOString()
      });

      // Seed major characters
      testCharacters = [
        {
          id: 'char-1',
          world_id: 'world-1',
          user_id: null,
          name: 'Hero One',
          type: 'npc',
          status: 'alive',
          story_role: 'major',
          personality_traits: ['brave'],
          core_beliefs: ['protect the innocent'],
          goals: ['save the kingdom', 'find the artifact'],
          fears: ['failure'],
          faction_id: null,
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
        },
        {
          id: 'char-2',
          world_id: 'world-1',
          user_id: null,
          name: 'Hero Two',
          type: 'npc',
          status: 'deceased',
          story_role: 'major',
          personality_traits: ['wise'],
          core_beliefs: ['knowledge is power'],
          goals: [],
          fears: [],
          faction_id: null,
          home_location_id: null,
          current_location_id: null,
          story_beats_witnessed: [1, 2, 3],
          reputation_tags: [],
          historical_events: [],
          date_of_birth: null,
          date_of_death: new Date().toISOString(),
          appearance_description: null,
          backstory: null,
          voice_description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        }
      ];

      testCharacters.forEach(char => characterRepo.seed(char));

      // Mock world repo methods
      vi.spyOn(worldRepo, 'getBeat').mockResolvedValue({
        id: 'beat-1',
        arc_id: 'arc-1',
        beat_index: 5,
        beat_type: 'dynamic',
        beat_name: 'A mysterious stranger arrives',
        description: 'The stranger brings word of danger...',
        world_directives: ['A mysterious stranger arrives with urgent news'],
        emergent_storylines: [],
        created_at: new Date().toISOString()
      });

      vi.spyOn(worldRepo, 'getRecentEvents').mockResolvedValue([
        {
          id: 'event-1',
          world_id: 'world-1',
          event_type: 'faction_war',
          description: 'War breaks out between factions',
          impact_level: 'major',
          metadata: {},
          beat_index: 4,
          created_at: new Date().toISOString()
        }
      ]);

      // Mock AI responses
      mockAI.generateBeatCharacters.mockResolvedValue({
        characters: [{
          name: 'Mysterious Messenger',
          type: 'npc',
          story_role: 'minor',
          personality_traits: ['enigmatic', 'urgent'],
          core_beliefs: ['duty above all'],
          initial_goals: ['deliver the message'],
          backstory: 'Sent by distant allies'
        }]
      });

      mockAI.updateCharacterGoals.mockResolvedValue({
        new_goals: ['investigate the threat'],
        abandoned_goals: ['find the artifact'],
        reason: 'The new threat takes priority'
      });
    });

    it('updates witnessing characters and spawns new ones', async () => {
      await eventBus.emit('world.beat.created', {
        v: 1,
        worldId: 'world-1',
        beatId: 'beat-1',
        beatIndex: 5
      });

      // Give event handler time to process
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check major characters witnessed the beat
      const char1 = await characterRepo.findById('char-1');
      expect(char1?.story_beats_witnessed).toContain(5);

      // Deceased character should not witness
      const char2 = await characterRepo.findById('char-2');
      expect(char2?.story_beats_witnessed).not.toContain(5);

      // Check new character was spawned
      const allChars = await characterRepo.findByWorldId('world-1');
      const messenger = allChars.find(c => c.name === 'Mysterious Messenger');
      expect(messenger).toBeDefined();
      expect(messenger?.story_role).toBe('minor');

      // Check goals were updated
      expect(mockAI.updateCharacterGoals).toHaveBeenCalledWith({
        characterId: 'char-1',
        characterName: 'Hero One',
        currentGoals: ['save the kingdom', 'find the artifact'],
        personality: ['brave'],
        beliefs: ['protect the innocent'],
        recentEvents: ['War breaks out between factions'],
        worldContext: 'The stranger brings word of danger...'
      });

      const updatedChar1 = await characterRepo.findById('char-1');
      expect(updatedChar1?.goals).toContain('save the kingdom');
      expect(updatedChar1?.goals).toContain('investigate the threat');
      expect(updatedChar1?.goals).not.toContain('find the artifact');
    });

    it('only spawns characters when beat directive requires them', async () => {
      // Update beat to not require new characters
      vi.spyOn(worldRepo, 'getBeat').mockResolvedValue({
        id: 'beat-2',
        arc_id: 'arc-1',
        beat_index: 6,
        beat_type: 'dynamic',
        beat_name: 'The heroes rest at the inn',
        description: 'A quiet moment of respite...',
        world_directives: ['The heroes rest at the inn'],
        emergent_storylines: [],
        created_at: new Date().toISOString()
      });

      await eventBus.emit('world.beat.created', {
        v: 1,
        worldId: 'world-1',
        beatId: 'beat-2',
        beatIndex: 6
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not call generateBeatCharacters
      expect(mockAI.generateBeatCharacters).not.toHaveBeenCalled();
    });
  });

  describe('location.status_changed event', () => {
    beforeEach(() => {
      // Seed location
      locationRepo.seed({
        id: 'location-1',
        world_id: 'world-1',
        name: 'City of Light',
        type: 'city',
        status: 'thriving',
        description: 'A bustling metropolis',
        parent_location_id: null,
        coordinates: { x: 100, y: 200 },
        tags: ['trade_hub', 'capital'],
        controlling_faction_id: 'faction-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Seed characters in location
      const chars = [
        {
          id: 'char-1',
          world_id: 'world-1',
          user_id: null,
          name: 'Citizen One',
          type: 'npc' as const,
          status: 'alive' as const,
          story_role: 'minor' as const,
          personality_traits: ['peaceful'],
          core_beliefs: ['home is sacred'],
          goals: ['live in peace'],
          fears: ['war'],
          faction_id: null,
          home_location_id: 'location-1',
          current_location_id: 'location-1',
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
        },
        {
          id: 'char-2',
          world_id: 'world-1',
          user_id: null,
          name: 'Visitor',
          type: 'npc' as const,
          status: 'alive' as const,
          story_role: 'major' as const,
          personality_traits: ['wandering'],
          core_beliefs: ['freedom'],
          goals: ['explore'],
          fears: ['confinement'],
          faction_id: null,
          home_location_id: 'location-2',
          current_location_id: 'location-1',
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
        }
      ];

      chars.forEach(char => characterRepo.seed(char));
    });

    it('handles location destruction with casualties and evacuations', async () => {
      // Mock random for testing
      const mockRandom = vi.spyOn(Math, 'random');
      mockRandom
        .mockReturnValueOnce(0.2) // char-1 dies (< 0.3)
        .mockReturnValueOnce(0.5); // char-2 survives (>= 0.3)

      await eventBus.emit('location.status_changed', {
        v: 1,
        worldId: 'world-1',
        locationId: 'location-1',
        locationName: 'City of Light',
        previousStatus: 'thriving',
        newStatus: 'destroyed'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Check casualties
      const char1 = await characterRepo.findById('char-1');
      expect(char1?.status).toBe('deceased');
      expect(char1?.date_of_death).toBeTruthy();

      const deathEvents = eventBus.getEmitted('character.died');
      expect(deathEvents).toHaveLength(1);
      expect(deathEvents[0].payload).toMatchObject({
        characterId: 'char-1',
        cause: 'Killed when City of Light was destroyed',
        impactLevel: 'minor'
      });

      // Check evacuation
      const char2 = await characterRepo.findById('char-2');
      expect(char2?.status).toBe('alive');
      expect(char2?.current_location_id).toBe('location-2'); // Evacuated to home

      const relocateEvents = eventBus.getEmitted('character.relocated');
      expect(relocateEvents).toHaveLength(1);
      expect(relocateEvents[0].payload).toMatchObject({
        characterId: 'char-2',
        fromLocationId: 'location-1',
        toLocationId: 'location-2',
        reason: 'Evacuated from City of Light'
      });

      mockRandom.mockRestore();
    });

    it('marks homeless characters as missing when location destroyed', async () => {
      // Mock to ensure survival
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      // Update char-1 to have no home
      await characterRepo.update('char-1', { home_location_id: null });

      await eventBus.emit('location.status_changed', {
        v: 1,
        worldId: 'world-1',
        locationId: 'location-1',
        locationName: 'City of Light',
        previousStatus: 'thriving',
        newStatus: 'destroyed'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const char1 = await characterRepo.findById('char-1');
      expect(char1?.status).toBe('missing');

      const statusEvents = eventBus.getEmitted('character.status_changed');
      expect(statusEvents).toHaveLength(1);
      expect(statusEvents[0].payload).toMatchObject({
        characterId: 'char-1',
        newStatus: 'missing',
        reason: 'Lost when City of Light was destroyed'
      });
    });

    it('ignores non-destructive status changes', async () => {
      await eventBus.emit('location.status_changed', {
        v: 1,
        worldId: 'world-1',
        locationId: 'location-1',
        locationName: 'City of Light',
        previousStatus: 'thriving',
        newStatus: 'struggling'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Characters should be unaffected
      const char1 = await characterRepo.findById('char-1');
      expect(char1?.status).toBe('alive');
      expect(char1?.current_location_id).toBe('location-1');

      // No events should be emitted
      expect(eventBus.getEmitted('character.died')).toHaveLength(0);
      expect(eventBus.getEmitted('character.relocated')).toHaveLength(0);
    });
  });
});