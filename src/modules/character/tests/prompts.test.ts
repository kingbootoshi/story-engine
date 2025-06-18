import { describe, it, expect } from 'vitest';
import {
  GENERATE_CHARACTER_SYSTEM_PROMPT,
  buildGenerateCharacterUserPrompt
} from '../infra/ai/prompts/generateCharacter';
import {
  GENERATE_DIALOGUE_SYSTEM_PROMPT,
  buildGenerateDialogueUserPrompt
} from '../infra/ai/prompts/generateDialogue';
import {
  PREDICT_REACTION_SYSTEM_PROMPT,
  buildPredictReactionUserPrompt
} from '../infra/ai/prompts/predictReaction';
import {
  EVOLVE_PERSONALITY_SYSTEM_PROMPT,
  buildEvolvePersonalityUserPrompt
} from '../infra/ai/prompts/evolvePersonality';
import type { Character } from '../domain/schema';

describe('Character AI Prompts', () => {
  describe('generateCharacter prompt', () => {
    it('includes all required placeholders', () => {
      const params = {
        worldTheme: 'Dark fantasy realm',
        name: 'Aldric',
        role: 'protagonist',
        existingCharacters: ['Elena: A wise mage', 'Thorin: A brave warrior']
      };

      const prompt = buildGenerateCharacterUserPrompt(params);

      // Check all variables are included
      expect(prompt).toContain('Dark fantasy realm');
      expect(prompt).toContain('Aldric');
      expect(prompt).toContain('protagonist');
      expect(prompt).toContain('Elena: A wise mage');
      expect(prompt).toContain('Thorin: A brave warrior');
    });

    it('handles empty existing characters', () => {
      const params = {
        worldTheme: 'Sci-fi universe',
        name: 'Nova',
        role: 'antagonist',
        existingCharacters: []
      };

      const prompt = buildGenerateCharacterUserPrompt(params);

      expect(prompt).toContain('None yet - this is the first character');
    });

    it('system prompt contains key guidance', () => {
      expect(GENERATE_CHARACTER_SYSTEM_PROMPT).toContain('multifaceted personalities');
      expect(GENERATE_CHARACTER_SYSTEM_PROMPT).toContain('strengths and flaws');
      expect(GENERATE_CHARACTER_SYSTEM_PROMPT).toContain('growth and change');
    });
  });

  describe('generateDialogue prompt', () => {
    it('includes character details and context', () => {
      const character: Character = {
        id: 'char-1',
        world_id: 'world-1',
        name: 'Marcus',
        role: 'protagonist',
        description: 'A battle-worn veteran',
        background: 'Former soldier',
        personality_traits: [
          { trait: 'stoic', strength: 0.8 },
          { trait: 'loyal', strength: 0.9 }
        ],
        motivations: ['Protect the innocent', 'Find peace'],
        relationships: [
          {
            character_id: 'char-2',
            type: 'ally',
            strength: 0.7,
            history: 'Fought together'
          }
        ],
        memories: [],
        tags: [],
        location_id: null,
        faction_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const request = {
        character_id: 'char-1',
        context: 'Preparing for battle',
        speaking_to: 'char-2',
        emotional_state: 'determined',
        recent_events: ['Village was attacked', 'Lost a friend']
      };

      const prompt = buildGenerateDialogueUserPrompt(request, character);

      expect(prompt).toContain('Marcus');
      expect(prompt).toContain('protagonist');
      expect(prompt).toContain('stoic (strength: 0.8)');
      expect(prompt).toContain('loyal (strength: 0.9)');
      expect(prompt).toContain('Preparing for battle');
      expect(prompt).toContain('ally (strength: 0.7)');
      expect(prompt).toContain('determined');
      expect(prompt).toContain('Village was attacked');
    });

    it('handles missing optional fields', () => {
      const character: Character = {
        id: 'char-1',
        world_id: 'world-1',
        name: 'Solo',
        role: 'supporting',
        description: 'A loner',
        background: 'Unknown past',
        personality_traits: [],
        motivations: [],
        relationships: [],
        memories: [],
        tags: [],
        location_id: null,
        faction_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const request = {
        character_id: 'char-1',
        context: 'Thinking alone'
      };

      const prompt = buildGenerateDialogueUserPrompt(request, character);

      expect(prompt).toContain('General audience or thinking aloud');
      expect(prompt).not.toContain('emotional_state');
      expect(prompt).not.toContain('recent_events');
    });
  });

  describe('predictReaction prompt', () => {
    it('includes character state and event details', () => {
      const character: Character = {
        id: 'char-1',
        world_id: 'world-1',
        name: 'Elena',
        role: 'protagonist',
        description: 'A skilled archer',
        background: 'Raised by elves',
        personality_traits: [
          { trait: 'cautious', strength: 0.7 },
          { trait: 'protective', strength: 0.9 }
        ],
        motivations: ['Defend the forest', 'Honor her mentors'],
        memories: [
          {
            event_description: 'Forest burned by invaders',
            timestamp: new Date().toISOString(),
            emotional_impact: 'negative',
            importance: 0.9
          }
        ],
        relationships: [],
        tags: [],
        location_id: null,
        faction_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const params = {
        character,
        event: 'Invaders approaching the forest',
        worldContext: 'War has broken out between kingdoms'
      };

      const prompt = buildPredictReactionUserPrompt(params);

      expect(prompt).toContain('Elena');
      expect(prompt).toContain('cautious (strength: 0.7)');
      expect(prompt).toContain('Defend the forest');
      expect(prompt).toContain('Forest burned by invaders (negative)');
      expect(prompt).toContain('Invaders approaching the forest');
      expect(prompt).toContain('War has broken out');
    });
  });

  describe('evolvePersonality prompt', () => {
    it('includes current state and experiences', () => {
      const character: Character = {
        id: 'char-1',
        world_id: 'world-1',
        name: 'Kira',
        role: 'protagonist',
        description: 'Young mage',
        background: 'Academy dropout',
        personality_traits: [
          { trait: 'impulsive', strength: 0.8 },
          { trait: 'curious', strength: 0.9 }
        ],
        motivations: ['Master magic', 'Prove herself'],
        memories: [],
        relationships: [],
        tags: [],
        location_id: null,
        faction_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const recentMemories = [
        {
          event_description: 'Successfully defended village',
          timestamp: new Date().toISOString(),
          emotional_impact: 'positive' as const,
          importance: 0.8
        },
        {
          event_description: 'Lost control of spell, hurt ally',
          timestamp: new Date().toISOString(),
          emotional_impact: 'negative' as const,
          importance: 0.9
        }
      ];

      const worldEvents = ['Magic plague spreading', 'Academy destroyed'];

      const params = { character, recentMemories, worldEvents };
      const prompt = buildEvolvePersonalityUserPrompt(params);

      expect(prompt).toContain('Kira');
      expect(prompt).toContain('impulsive (strength: 0.8)');
      expect(prompt).toContain('Master magic');
      expect(prompt).toContain('Successfully defended village (positive, importance: 0.8)');
      expect(prompt).toContain('Lost control of spell, hurt ally (negative, importance: 0.9)');
      expect(prompt).toContain('Magic plague spreading');
      expect(prompt).toContain('Academy destroyed');
    });

    it('handles empty memories and events', () => {
      const character: Character = {
        id: 'char-1',
        world_id: 'world-1',
        name: 'New Character',
        role: 'supporting',
        description: 'Fresh face',
        background: 'Just arrived',
        personality_traits: [],
        motivations: [],
        memories: [],
        relationships: [],
        tags: [],
        location_id: null,
        faction_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const params = {
        character,
        recentMemories: [],
        worldEvents: []
      };

      const prompt = buildEvolvePersonalityUserPrompt(params);

      expect(prompt).toContain('No significant recent memories');
      expect(prompt).toContain('No major world events');
    });
  });
});