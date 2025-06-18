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

describe('CharacterService.state', () => {
  let service: CharacterService;
  let characterRepo: InMemoryCharacterRepo;
  let worldRepo: InMemoryWorldRepo;
  let factionRepo: InMemoryFactionRepo;
  let locationRepo: InMemoryLocationRepo;
  let eventBus: MockEventBus;
  let testCharacter: Character;

  beforeEach(() => {
    container.reset();
    
    characterRepo = new InMemoryCharacterRepo();
    worldRepo = new InMemoryWorldRepo();
    factionRepo = new InMemoryFactionRepo();
    locationRepo = new InMemoryLocationRepo();
    eventBus = new MockEventBus();
    
    container.register('ICharacterRepository', { useValue: characterRepo });
    container.register('ICharacterAI', { useValue: {} });
    container.register('WorldRepo', { useValue: worldRepo });
    container.register('IFactionRepository', { useValue: factionRepo });
    container.register('LocationRepository', { useValue: locationRepo });
    container.register('eventBus', { useValue: eventBus });
    
    service = container.resolve(CharacterService);
    
    // Seed test data
    worldRepo.seed({
      id: 'world-1',
      user_id: 'user-1',
      name: 'Test World',
      description: 'A fantasy world',
      current_arc_id: 'arc-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    worldRepo.seedBeat({
      id: 'beat-1',
      arc_id: 'arc-1',
      beat_index: 5,
      beat_type: 'dynamic',
      beat_name: 'Heroes arrive at the castle',
      description: 'The party finally reaches the castle gates...',
      world_directives: ['Heroes arrive at the castle'],
      emergent_storylines: [],
      created_at: new Date().toISOString()
    });

    testCharacter = {
      id: 'char-1',
      world_id: 'world-1',
      user_id: null,
      name: 'Test Character',
      type: 'npc',
      status: 'alive',
      story_role: 'major',
      personality_traits: ['brave', 'loyal'],
      core_beliefs: ['honor above all'],
      goals: ['protect the realm'],
      fears: ['failure'],
      faction_id: 'faction-1',
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
    };
    
    characterRepo.seed(testCharacter);
  });

  describe('updateStatus', () => {
    it('updates character status and emits event', async () => {
      await service.updateStatus('char-1', 'missing', 'Lost in the forest');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.status).toBe('missing');

      const events = eventBus.getEmitted('character.status_changed');
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        v: 1,
        worldId: 'world-1',
        characterId: 'char-1',
        name: 'Test Character',
        previousStatus: 'alive',
        newStatus: 'missing',
        reason: 'Lost in the forest'
      });

      // Check historical event was added
      expect(updated?.historical_events).toHaveLength(1);
      expect(updated?.historical_events[0]).toMatchObject({
        event: 'Status changed to missing: Lost in the forest',
        impact_on_story: 'minor'
      });
    });

    it('sets date_of_death when status changes to deceased', async () => {
      await service.updateStatus('char-1', 'deceased', 'Killed in battle');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.status).toBe('deceased');
      expect(updated?.date_of_death).toBeTruthy();
    });

    it('throws error if character not found', async () => {
      await expect(
        service.updateStatus('nonexistent', 'deceased', 'test')
      ).rejects.toThrow('Character not found');
    });
  });

  describe('die', () => {
    beforeEach(() => {
      vi.spyOn(worldRepo, 'getCurrentBeat').mockResolvedValue({
        id: 'beat-1',
        arc_id: 'arc-1',
        beat_index: 5,
        beat_type: 'dynamic',
        beat_name: 'Battle at the gates',
        description: 'The battle rages...',
        world_directives: ['Battle at the gates'],
        emergent_storylines: [],
        created_at: new Date().toISOString()
      });

      vi.spyOn(worldRepo, 'createEvent').mockResolvedValue({
        id: 'event-1',
        world_id: 'world-1',
        arc_id: 'arc-1',
        beat_id: 'beat-1',
        event_type: 'world_event',
        description: '',
        impact_level: 'major',
        created_at: new Date().toISOString()
      });
    });

    it('kills character and emits events', async () => {
      await service.die('char-1', 'Heroic sacrifice', 'major');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.status).toBe('deceased');
      expect(updated?.date_of_death).toBeTruthy();

      const deathEvents = eventBus.getEmitted('character.died');
      expect(deathEvents).toHaveLength(1);
      expect(deathEvents[0].payload).toMatchObject({
        v: 1,
        worldId: 'world-1',
        characterId: 'char-1',
        name: 'Test Character',
        cause: 'Heroic sacrifice',
        impactLevel: 'major',
        beatId: 'beat-1',
        beatIndex: 5
      });
    });

    it('logs world event for major character deaths', async () => {
      // Need to setup world with arc for event creation
      vi.spyOn(worldRepo, 'getWorld').mockResolvedValue({
        id: 'world-1',
        user_id: 'user-1',
        name: 'Test World',
        description: 'A fantasy world',
        current_arc_id: 'arc-1',
        created_at: new Date().toISOString(),
        updated_at: null
      });
      
      vi.spyOn(worldRepo, 'getArc').mockResolvedValue({
        id: 'arc-1',
        world_id: 'world-1',
        arc_number: 1,
        story_name: 'Test Arc',
        story_idea: 'Test story',
          summary: null,
        detailed_description: '',
        current_beat_id: 'beat-1',
        created_at: new Date().toISOString(),
        completed_at: null
      });

      await service.die('char-1', 'Heroic sacrifice', 'major');

      expect(worldRepo.createEvent).toHaveBeenCalledWith({
        world_id: 'world-1',
        arc_id: 'arc-1',
        beat_id: 'beat-1',
        event_type: 'world_event',
        description: 'Test Character has died: Heroic sacrifice',
        impact_level: 'major'
      });
    });

    it('does not log world event for minor deaths', async () => {
      await service.die('char-1', 'Random accident', 'minor');

      expect(worldRepo.createEvent).not.toHaveBeenCalled();
    });

    it('skips if character already deceased', async () => {
      await characterRepo.update('char-1', { 
        status: 'deceased',
        date_of_death: new Date().toISOString()
      });

      await service.die('char-1', 'Another death', 'major');

      const events = eventBus.getEmitted('character.died');
      expect(events).toHaveLength(0);
    });
  });

  describe('relocate', () => {
    it('updates character location and emits event', async () => {
      await service.relocate('char-1', 'location-2', 'Fleeing the battle');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.current_location_id).toBe('location-2');

      const events = eventBus.getEmitted('character.relocated');
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        v: 1,
        worldId: 'world-1',
        characterId: 'char-1',
        name: 'Test Character',
        fromLocationId: 'location-1',
        toLocationId: 'location-2',
        reason: 'Fleeing the battle'
      });
    });
  });

  describe('changeFaction', () => {
    it('updates character faction and emits event', async () => {
      await service.changeFaction('char-1', 'faction-2', 'Betrayed for gold');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.faction_id).toBe('faction-2');

      const events = eventBus.getEmitted('character.faction_changed');
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        v: 1,
        worldId: 'world-1',
        characterId: 'char-1',
        name: 'Test Character',
        previousFactionId: 'faction-1',
        newFactionId: 'faction-2',
        reason: 'Betrayed for gold'
      });

      // Check historical event
      expect(updated?.historical_events).toHaveLength(1);
      expect(updated?.historical_events[0]).toMatchObject({
        event: 'Joined new faction: Betrayed for gold',
        impact_on_story: 'moderate' // major character changing faction
      });
    });

    it('handles leaving faction (null faction)', async () => {
      await service.changeFaction('char-1', null, 'Going rogue');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.faction_id).toBeNull();

      const events = eventBus.getEmitted('character.faction_changed');
      expect(events[0].payload).toMatchObject({
        previousFactionId: 'faction-1',
        newFactionId: undefined
      });

      // Check historical event text
      expect(updated?.historical_events[0].event).toBe('Left faction: Going rogue');
    });
  });

  describe('resurrect', () => {
    beforeEach(async () => {
      // Kill the character first
      await characterRepo.update('char-1', {
        status: 'deceased',
        date_of_death: new Date().toISOString()
      });

      vi.spyOn(worldRepo, 'createEvent').mockResolvedValue({
        id: 'event-1',
        world_id: 'world-1',
        arc_id: 'arc-1',
        beat_id: 'beat-1',
        event_type: 'world_event',
        description: '',
        impact_level: 'major',
        created_at: new Date().toISOString()
      });
    });

    it('resurrects deceased character', async () => {
      // Need to setup world with arc for event creation
      vi.spyOn(worldRepo, 'getWorld').mockResolvedValue({
        id: 'world-1',
        user_id: 'user-1',
        name: 'Test World',
        description: 'A fantasy world',
        current_arc_id: 'arc-1',
        created_at: new Date().toISOString(),
        updated_at: null
      });
      
      vi.spyOn(worldRepo, 'getArc').mockResolvedValue({
        id: 'arc-1',
        world_id: 'world-1',
        arc_number: 1,
        story_name: 'Test Arc',
        story_idea: 'Test story',
        status: 'active',
        summary: null,
        detailed_description: '',
        current_beat_id: 'beat-1',
        created_at: new Date().toISOString(),
        completed_at: null
      });
      
      vi.spyOn(worldRepo, 'getCurrentBeat').mockResolvedValue({
        id: 'beat-1',
        arc_id: 'arc-1',
        beat_index: 5,
        beat_type: 'dynamic',
        beat_name: 'Current beat',
        description: 'Current events',
        world_directives: [],
        emergent_storylines: [],
        created_at: new Date().toISOString()
      });

      await service.resurrect('char-1', 'divine intervention');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.status).toBe('alive');

      // Check world event was logged
      expect(worldRepo.createEvent).toHaveBeenCalledWith({
        world_id: 'world-1',
        arc_id: 'arc-1',
        beat_id: 'beat-1',
        event_type: 'world_event',
        description: 'Test Character has been resurrected through divine intervention',
        impact_level: 'major'
      });
    });

    it('throws error if character not deceased', async () => {
      await characterRepo.update('char-1', { status: 'alive' });

      await expect(
        service.resurrect('char-1', 'magic')
      ).rejects.toThrow('Character is not deceased');
    });
  });

  describe('achieveGoal', () => {
    it('removes goal and emits achievement event', async () => {
      await service.achieveGoal('char-1', 'protect the realm');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.goals).toEqual([]);

      const events = eventBus.getEmitted('character.achieved_goal');
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        v: 1,
        worldId: 'world-1',
        characterId: 'char-1',
        name: 'Test Character',
        goal: 'protect the realm',
        impact: 'moderate' // major character goal
      });

      // Check historical event
      expect(updated?.historical_events).toHaveLength(1);
      expect(updated?.historical_events[0]).toMatchObject({
        event: 'Achieved goal: protect the realm',
        impact_on_story: 'moderate'
      });
    });

    it('handles goal not in list gracefully', async () => {
      await service.achieveGoal('char-1', 'nonexistent goal');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.goals).toEqual(['protect the realm']);
    });
  });

  describe('addReputation', () => {
    it('adds reputation tag and historical event', async () => {
      await service.addReputation('char-1', 'hero_of_westmarch', 'Saved the city');

      const updated = await characterRepo.findById('char-1');
      expect(updated?.reputation_tags).toContain('hero_of_westmarch');
      expect(updated?.historical_events).toHaveLength(1);
      expect(updated?.historical_events[0]).toMatchObject({
        event: 'Gained reputation: hero_of_westmarch - Saved the city',
        impact_on_story: 'minor'
      });
    });
  });

  describe('witnessBeat', () => {
    it('adds beat index to witnessed beats', async () => {
      await service.witnessBeat('char-1', 5);
      await service.witnessBeat('char-1', 3);
      await service.witnessBeat('char-1', 7);

      const updated = await characterRepo.findById('char-1');
      expect(updated?.story_beats_witnessed).toEqual([3, 5, 7]); // Sorted

      // Duplicate should not be added
      await service.witnessBeat('char-1', 5);
      const updated2 = await characterRepo.findById('char-1');
      expect(updated2?.story_beats_witnessed).toEqual([3, 5, 7]);
    });
  });

  describe('updatePersonality', () => {
    it('updates personality traits, beliefs, goals, and fears', async () => {
      const changes = {
        personality_traits: ['brave', 'loyal', 'wise'],
        core_beliefs: ['honor above all', 'knowledge is power'],
        goals: ['protect the realm', 'seek ancient wisdom'],
        fears: ['failure', 'ignorance']
      };

      await service.updatePersonality('char-1', changes);

      const updated = await characterRepo.findById('char-1');
      expect(updated?.personality_traits).toEqual(changes.personality_traits);
      expect(updated?.core_beliefs).toEqual(changes.core_beliefs);
      expect(updated?.goals).toEqual(changes.goals);
      expect(updated?.fears).toEqual(changes.fears);
    });
  });
});