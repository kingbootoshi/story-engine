import { describe, it, expect } from 'vitest';
import {
  buildGenerateCharactersUserPrompt,
  GENERATE_CHARACTERS_SYSTEM_PROMPT
} from '../../src/modules/character/infra/ai/prompts/generateCharacters.prompts';
import {
  buildEvaluateBeatUserPrompt,
  EVALUATE_BEAT_SYSTEM_PROMPT
} from '../../src/modules/character/infra/ai/prompts/evaluateBeat.prompts';
import {
  buildSpawnCharactersUserPrompt,
  SPAWN_CHARACTERS_SYSTEM_PROMPT
} from '../../src/modules/character/infra/ai/prompts/spawnCharacters.prompts';

describe('Character AI Prompts', () => {
  describe('generateCharacters prompts', () => {
    it('should have non-empty system prompt', () => {
      expect(GENERATE_CHARACTERS_SYSTEM_PROMPT).toBeTruthy();
      expect(GENERATE_CHARACTERS_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('should build faction-aligned character prompt correctly', () => {
      const prompt = buildGenerateCharactersUserPrompt(
        'Medieval fantasy world',
        5,
        {
          name: 'Healers Guild',
          ideology: 'Help all in need'
        },
        ['Temple District', 'Market Square']
      );

      expect(prompt).toContain('Medieval fantasy world');
      expect(prompt).toContain('5 unique characters');
      expect(prompt).toContain('Healers Guild');
      expect(prompt).toContain('Help all in need');
      expect(prompt).toContain('Temple District');
      expect(prompt).toContain('Market Square');
    });

    it('should build independent character prompt correctly', () => {
      const prompt = buildGenerateCharactersUserPrompt(
        'Post-apocalyptic wasteland',
        3,
        undefined,
        ['Ruined City', 'Safe Zone']
      );

      expect(prompt).toContain('Post-apocalyptic wasteland');
      expect(prompt).toContain('3 unique characters');
      expect(prompt).toContain('independent characters');
      expect(prompt).toContain('Ruined City');
    });
  });

  describe('evaluateBeat prompts', () => {
    it('should have non-empty system prompt', () => {
      expect(EVALUATE_BEAT_SYSTEM_PROMPT).toBeTruthy();
      expect(EVALUATE_BEAT_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('should build evaluation prompt with all context', () => {
      const character = {
        name: 'Elena',
        story_role: 'minor',
        personality_traits: ['compassionate', 'brave'],
        motivations: ['heal the sick', 'protect innocents'],
        current_location: 'Market Square',
        current_faction: 'Healers Guild',
        recent_memories: [{
          event_description: 'Helped injured merchant',
          emotional_impact: 'positive' as const,
          importance: 0.6
        }],
        background: 'Temple trained healer'
      };

      const beat = {
        description: 'Fire breaks out in the market',
        directives: ['Market destroyed'],
        emergent: ['Refugees flee']
      };

      const worldContext = {
        available_locations: ['Temple District', 'Market Square'],
        available_factions: ['Healers Guild', 'City Watch']
      };

      const prompt = buildEvaluateBeatUserPrompt(character, beat, worldContext);

      expect(prompt).toContain('Elena');
      expect(prompt).toContain('Market Square');
      expect(prompt).toContain('Fire breaks out');
      expect(prompt).toContain('compassionate');
      expect(prompt).toContain('Temple District');
    });
  });

  describe('spawnCharacters prompts', () => {
    it('should have non-empty system prompt', () => {
      expect(SPAWN_CHARACTERS_SYSTEM_PROMPT).toBeTruthy();
      expect(SPAWN_CHARACTERS_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('should build spawn analysis prompt correctly', () => {
      const beat = {
        description: 'A mysterious prophet arrives',
        directives: ['New religious movement'],
        emergent: ['Citizens divided']
      };

      const prompt = buildSpawnCharactersUserPrompt(
        beat,
        'Medieval fantasy',
        ['Healers Guild', 'Merchants Guild'],
        [{ name: 'Temple District' }, { name: 'Market Square' }],
        25
      );

      expect(prompt).toContain('mysterious prophet arrives');
      expect(prompt).toContain('Medieval fantasy');
      expect(prompt).toContain('Current Character Count: 25');
      expect(prompt).toContain('Healers Guild');
      expect(prompt).toContain('Temple District');
    });
  });
});