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

describe('CharacterService.relationships', () => {
  let service: CharacterService;
  let characterRepo: InMemoryCharacterRepo;
  let worldRepo: InMemoryWorldRepo;
  let factionRepo: InMemoryFactionRepo;
  let locationRepo: InMemoryLocationRepo;
  let eventBus: MockEventBus;
  let char1: Character;
  let char2: Character;

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
    
    // Seed test characters
    char1 = {
      id: 'char-1',
      world_id: 'world-1',
      user_id: null,
      name: 'Alice',
      type: 'npc',
      status: 'alive',
      story_role: 'major',
      personality_traits: ['brave', 'loyal'],
      core_beliefs: ['honor above all'],
      goals: ['protect the realm'],
      fears: ['betrayal'],
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

    char2 = {
      id: 'char-2',
      world_id: 'world-1',
      user_id: null,
      name: 'Bob',
      type: 'npc',
      status: 'alive',
      story_role: 'minor',
      personality_traits: ['cunning', 'ambitious'],
      core_beliefs: ['power is everything'],
      goals: ['gain influence'],
      fears: ['obscurity'],
      faction_id: 'faction-2',
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
    };
    
    characterRepo.seed(char1);
    characterRepo.seed(char2);
  });

  describe('formRelationship', () => {
    it('creates relationship between two characters', async () => {
      await service.formRelationship(
        'char-1',
        'char-2',
        'rivalry',
        'Competing for the throne'
      );

      const relations = await characterRepo.findRelationsForCharacter('char-1');
      expect(relations).toHaveLength(1);
      expect(relations[0]).toMatchObject({
        character_id: 'char-1',
        target_character_id: 'char-2',
        relationship_type: 'rivalry',
        sentiment: -25,
        description: 'Competing for the throne'
      });

      // Check event
      const events = eventBus.getEmitted('character.relationship_formed');
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        v: 1,
        worldId: 'world-1',
        characterId: 'char-1',
        targetCharacterId: 'char-2',
        characterName: 'Alice',
        targetName: 'Bob',
        relationshipType: 'rivalry',
        sentiment: -25,
        reason: 'Competing for the throne'
      });
    });

    it('calculates correct initial sentiment for different relationship types', async () => {
      const testCases = [
        { type: 'family', expectedSentiment: 75 },
        { type: 'romantic', expectedSentiment: 75 },
        { type: 'friendship', expectedSentiment: 50 },
        { type: 'professional', expectedSentiment: 25 },
        { type: 'rivalry', expectedSentiment: -25 },
        { type: 'nemesis', expectedSentiment: -75 }
      ];

      for (const { type, expectedSentiment } of testCases) {
        // Create new characters for each test
        const charA = { ...char1, id: `char-a-${type}` };
        const charB = { ...char2, id: `char-b-${type}` };
        characterRepo.seed(charA);
        characterRepo.seed(charB);

        await service.formRelationship(
          charA.id,
          charB.id,
          type as any,
          `Test ${type} relationship`
        );

        const relations = await characterRepo.findRelationsForCharacter(charA.id);
        expect(relations[0].sentiment).toBe(expectedSentiment);
      }
    });

    it('prevents duplicate relationships', async () => {
      // Form initial relationship
      await service.formRelationship(
        'char-1',
        'char-2',
        'friendship',
        'Met at the tavern'
      );

      // Try to form another relationship
      await service.formRelationship(
        'char-1',
        'char-2',
        'rivalry',
        'Fight broke out'
      );

      // Should still only have one relationship
      const relations = await characterRepo.findRelationsForCharacter('char-1');
      expect(relations).toHaveLength(1);
      expect(relations[0].relationship_type).toBe('friendship');
    });

    it('throws error if characters from different worlds', async () => {
      const alienChar: Character = {
        ...char2,
        id: 'char-3',
        world_id: 'world-2'
      };
      characterRepo.seed(alienChar);

      await expect(
        service.formRelationship('char-1', 'char-3', 'friendship', 'test')
      ).rejects.toThrow('Characters from different worlds');
    });

    it('throws error if character not found', async () => {
      await expect(
        service.formRelationship('char-1', 'nonexistent', 'friendship', 'test')
      ).rejects.toThrow('Character not found');
    });
  });

  describe('updateRelationship', () => {
    it('updates relationship sentiment', async () => {
      // Create initial relationship
      const relation = await characterRepo.createRelation({
        world_id: 'world-1',
        character_id: 'char-1',
        target_character_id: 'char-2',
        relationship_type: 'friendship',
        sentiment: 50,
        description: 'Old friends'
      });

      await service.updateRelationship(
        relation.id,
        -30, // sentiment change
        'Betrayed trust'
      );

      const updated = await characterRepo.findRelationBetween('char-1', 'char-2');
      expect(updated?.sentiment).toBe(-30);
      expect(updated?.description).toBe('Betrayed trust');
    });
  });

  describe('breakRelationship', () => {
    it('deletes relationship', async () => {
      // Create initial relationship
      const relation = await characterRepo.createRelation({
        world_id: 'world-1',
        character_id: 'char-1',
        target_character_id: 'char-2',
        relationship_type: 'friendship',
        sentiment: 50,
        description: 'Old friends'
      });

      await service.breakRelationship(relation.id, 'Irreconcilable differences');

      const relations = await characterRepo.findRelationsForCharacter('char-1');
      expect(relations).toHaveLength(0);

      // TODO: Should emit relationship broken event
    });
  });

  describe('getRelationships', () => {
    it('returns all relationships for a character', async () => {
      // Create multiple relationships
      await characterRepo.createRelation({
        world_id: 'world-1',
        character_id: 'char-1',
        target_character_id: 'char-2',
        relationship_type: 'rivalry',
        sentiment: -25,
        description: 'Competing rivals'
      });

      // Create third character
      const char3 = { ...char1, id: 'char-3', name: 'Charlie' };
      characterRepo.seed(char3);

      await characterRepo.createRelation({
        world_id: 'world-1',
        character_id: 'char-1',
        target_character_id: 'char-3',
        relationship_type: 'friendship',
        sentiment: 60,
        description: 'Childhood friends'
      });

      const relations = await service.getRelationships('char-1');
      expect(relations).toHaveLength(2);
      expect(relations.map(r => r.target_character_id).sort()).toEqual(['char-2', 'char-3']);
    });

    it('includes relationships where character is target', async () => {
      await characterRepo.createRelation({
        world_id: 'world-1',
        character_id: 'char-2',
        target_character_id: 'char-1',
        relationship_type: 'professional',
        sentiment: 30,
        description: 'Employer-employee'
      });

      const relations = await service.getRelationships('char-1');
      expect(relations).toHaveLength(1);
      expect(relations[0].character_id).toBe('char-2');
    });
  });

  describe('relationship impact on events', () => {
    it('forms professional relationship when joining same faction', async () => {
      // Create player character in faction-1
      const player = await service.createPlayerCharacter('user-1', {
        world_id: 'world-1',
        user_id: 'user-1',
        name: 'Player One',
        type: 'player',
        status: 'alive',
        story_role: 'major',
        personality_traits: ['determined'],
        core_beliefs: ['justice'],
        goals: ['save the world'],
        fears: ['failure'],
        faction_id: 'faction-1',
        home_location_id: 'location-1',
        current_location_id: 'location-1',
        date_of_birth: null,
        date_of_death: null,
        appearance_description: null,
        backstory: null,
        voice_description: null
      });

      // Should have formed relationship with Alice (char-1) who is in faction-1
      const relations = await characterRepo.findRelationsForCharacter(player.id);
      expect(relations).toHaveLength(1);
      expect(relations[0]).toMatchObject({
        target_character_id: 'char-1',
        relationship_type: 'professional',
        sentiment: 25
      });
    });
  });
});