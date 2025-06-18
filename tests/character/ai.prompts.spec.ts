import { describe, it, expect } from 'vitest';
import {
  GENERATE_FACTION_CHARACTERS_SYSTEM_PROMPT,
  buildGenerateFactionCharactersUserPrompt,
  GENERATE_BEAT_CHARACTERS_SYSTEM_PROMPT,
  buildGenerateBeatCharactersUserPrompt
} from '../../src/modules/character/infra/ai/prompts/generateCharacters.prompts';
import {
  UPDATE_CHARACTER_GOALS_SYSTEM_PROMPT,
  buildUpdateCharacterGoalsUserPrompt
} from '../../src/modules/character/infra/ai/prompts/updateGoals.prompts';
import {
  EVALUATE_RELATIONSHIPS_SYSTEM_PROMPT,
  buildEvaluateRelationshipsUserPrompt,
  ENRICH_CHARACTER_HISTORY_SYSTEM_PROMPT,
  buildEnrichCharacterHistoryUserPrompt
} from '../../src/modules/character/infra/ai/prompts/evaluateRelationships.prompts';

describe('Character AI Prompts', () => {
  describe('generateFactionCharacters', () => {
    it('system prompt contains essential guidance', () => {
      expect(GENERATE_FACTION_CHARACTERS_SYSTEM_PROMPT).toContain('3-5 characters');
      expect(GENERATE_FACTION_CHARACTERS_SYSTEM_PROMPT).toContain('leader');
      expect(GENERATE_FACTION_CHARACTERS_SYSTEM_PROMPT).toContain('relationships');
      expect(GENERATE_FACTION_CHARACTERS_SYSTEM_PROMPT).toContain('prompt_id@v1');
    });

    it('user prompt includes all required context', () => {
      const prompt = buildGenerateFactionCharactersUserPrompt(
        'Dark Fantasy World',
        'The Shadow Legion',
        'Power through fear and control',
        ['Existing Hero', 'Existing Villain']
      );

      expect(prompt).toContain('Dark Fantasy World');
      expect(prompt).toContain('The Shadow Legion');
      expect(prompt).toContain('Power through fear and control');
      expect(prompt).toContain('Existing Hero');
      expect(prompt).toContain('Existing Villain');
      expect(prompt).toContain('3-5 characters');
      expect(prompt).toContain('faction leader');
    });

    it('handles empty existing characters', () => {
      const prompt = buildGenerateFactionCharactersUserPrompt(
        'Fantasy World',
        'New Faction',
        'Peace and prosperity',
        []
      );

      expect(prompt).toContain('None yet');
    });
  });

  describe('generateBeatCharacters', () => {
    it('system prompt emphasizes narrative emergence', () => {
      expect(GENERATE_BEAT_CHARACTERS_SYSTEM_PROMPT).toContain('story events');
      expect(GENERATE_BEAT_CHARACTERS_SYSTEM_PROMPT).toContain('beat directive');
      expect(GENERATE_BEAT_CHARACTERS_SYSTEM_PROMPT).toContain('prompt_id@v1');
    });

    it('user prompt includes all context without factions', () => {
      const prompt = buildGenerateBeatCharactersUserPrompt(
        'Post-Apocalyptic World',
        'A mysterious stranger arrives with news of a cure',
        'The settlement is running low on supplies',
        [
          { name: 'John Leader', role: 'Settlement Leader' },
          { name: 'Sarah Scout', role: 'Scout' }
        ]
      );

      expect(prompt).toContain('Post-Apocalyptic World');
      expect(prompt).toContain('mysterious stranger arrives');
      expect(prompt).toContain('running low on supplies');
      expect(prompt).toContain('John Leader (Settlement Leader)');
      expect(prompt).toContain('Sarah Scout (Scout)');
      expect(prompt).not.toContain('<factions>');
    });

    it('includes faction context when provided', () => {
      const prompt = buildGenerateBeatCharactersUserPrompt(
        'Fantasy World',
        'Rebels attack the capital',
        'The siege has begun',
        [],
        [
          { id: 'faction-1', name: 'The Rebels', ideology: 'Freedom through revolution' },
          { id: 'faction-2', name: 'The Crown', ideology: 'Order and tradition' }
        ]
      );

      expect(prompt).toContain('<factions>');
      expect(prompt).toContain('The Rebels: Freedom through revolution (ID: faction-1)');
      expect(prompt).toContain('The Crown: Order and tradition (ID: faction-2)');
    });
  });

  describe('updateCharacterGoals', () => {
    it('system prompt focuses on character evolution', () => {
      expect(UPDATE_CHARACTER_GOALS_SYSTEM_PROMPT).toContain('character motivations');
      expect(UPDATE_CHARACTER_GOALS_SYSTEM_PROMPT).toContain('personality');
      expect(UPDATE_CHARACTER_GOALS_SYSTEM_PROMPT).toContain('Maximum 5 active goals');
      expect(UPDATE_CHARACTER_GOALS_SYSTEM_PROMPT).toContain('prompt_id@v1');
    });

    it('user prompt includes all character context', () => {
      const prompt = buildUpdateCharacterGoalsUserPrompt(
        'Sir Roland',
        ['Protect the king', 'Find the traitor'],
        ['brave', 'loyal', 'suspicious'],
        ['duty above all', 'trust is earned'],
        ['The king was assassinated', 'Civil war has begun'],
        'The kingdom is in chaos'
      );

      expect(prompt).toContain('Sir Roland');
      expect(prompt).toContain('Protect the king');
      expect(prompt).toContain('Find the traitor');
      expect(prompt).toContain('brave, loyal, suspicious');
      expect(prompt).toContain('duty above all, trust is earned');
      expect(prompt).toContain('The king was assassinated');
      expect(prompt).toContain('Civil war has begun');
      expect(prompt).toContain('The kingdom is in chaos');
    });
  });

  describe('evaluateRelationships', () => {
    it('system prompt addresses relationship dynamics', () => {
      expect(EVALUATE_RELATIONSHIPS_SYSTEM_PROMPT).toContain('social dynamics');
      expect(EVALUATE_RELATIONSHIPS_SYSTEM_PROMPT).toContain('Crisis events');
      expect(EVALUATE_RELATIONSHIPS_SYSTEM_PROMPT).toContain('-100 (hatred) to 100');
      expect(EVALUATE_RELATIONSHIPS_SYSTEM_PROMPT).toContain('prompt_id@v1');
    });

    it('user prompt formats character and relationship data', () => {
      const prompt = buildEvaluateRelationshipsUserPrompt(
        [
          {
            id: 'char-1',
            name: 'Alice',
            faction_id: 'faction-1',
            personality: ['brave', 'loyal']
          },
          {
            id: 'char-2',
            name: 'Bob',
            personality: ['cunning', 'ambitious']
          }
        ],
        ['The city was destroyed', 'Refugees flee north'],
        [
          {
            char1: 'Alice',
            char2: 'Bob',
            type: 'rivalry',
            sentiment: -30
          }
        ]
      );

      expect(prompt).toContain('Alice (ID: char-1) - Faction: faction-1');
      expect(prompt).toContain('Personality: brave, loyal');
      expect(prompt).toContain('Bob (ID: char-2)');
      expect(prompt).toContain('Personality: cunning, ambitious');
      expect(prompt).toContain('Alice <-> Bob: rivalry (sentiment: -30)');
      expect(prompt).toContain('The city was destroyed');
      expect(prompt).toContain('crisis brings unlikely allies');
    });
  });

  describe('enrichCharacterHistory', () => {
    it('system prompt guides backstory creation', () => {
      expect(ENRICH_CHARACTER_HISTORY_SYSTEM_PROMPT).toContain('backstories');
      expect(ENRICH_CHARACTER_HISTORY_SYSTEM_PROMPT).toContain('appearance');
      expect(ENRICH_CHARACTER_HISTORY_SYSTEM_PROMPT).toContain('voice');
      expect(ENRICH_CHARACTER_HISTORY_SYSTEM_PROMPT).toContain('prompt_id@v1');
    });

    it('user prompt provides character context', () => {
      const prompt = buildEnrichCharacterHistoryUserPrompt(
        'Commander Steele',
        'Faction Leader',
        'Iron Legion',
        'Grimdark Military Fantasy',
        ['The Great War ended 10 years ago', 'Magic is outlawed']
      );

      expect(prompt).toContain('Commander Steele');
      expect(prompt).toContain('Faction Leader');
      expect(prompt).toContain('Iron Legion');
      expect(prompt).toContain('Grimdark Military Fantasy');
      expect(prompt).toContain('The Great War ended 10 years ago; Magic is outlawed');
      expect(prompt).toContain('Backstory (2-3 paragraphs)');
      expect(prompt).toContain('Appearance Description');
      expect(prompt).toContain('Voice Description');
    });

    it('handles no faction affiliation', () => {
      const prompt = buildEnrichCharacterHistoryUserPrompt(
        'Wanderer',
        'Mysterious Stranger',
        undefined,
        'Fantasy',
        []
      );

      expect(prompt).toContain('No faction affiliation');
    });
  });
});