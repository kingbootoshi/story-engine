import { describe, it, expect } from 'vitest';
import { 
  ANCHOR_SYSTEM_PROMPT, 
  buildAnchorUserPrompt 
} from '../../../src/modules/world/infra/ai/prompts/anchor.prompts';

describe('Anchor Prompts', () => {
  describe('ANCHOR_SYSTEM_PROMPT', () => {
    it('should contain core narrative principles', () => {
      expect(ANCHOR_SYSTEM_PROMPT).toContain('narrative expert');
      expect(ANCHOR_SYSTEM_PROMPT).toContain('world story arcs');
      expect(ANCHOR_SYSTEM_PROMPT).toContain('REAL player actions');
    });

    it('should define three anchor points', () => {
      expect(ANCHOR_SYSTEM_PROMPT).toContain('THREE anchor points');
      expect(ANCHOR_SYSTEM_PROMPT).toContain('Opening State (beat 0)');
      expect(ANCHOR_SYSTEM_PROMPT).toContain('Catalyst Event (beat 7)');
      expect(ANCHOR_SYSTEM_PROMPT).toContain('New Equilibrium (beat 14)');
    });

    it('should emphasize adaptability and emergence', () => {
      expect(ANCHOR_SYSTEM_PROMPT).toContain('ADAPTABLE');
      expect(ANCHOR_SYSTEM_PROMPT).toContain('emergent gameplay');
      expect(ANCHOR_SYSTEM_PROMPT).toContain('collective player actions');
    });
  });

  describe('buildAnchorUserPrompt', () => {
    it('should include world name and description', () => {
      const prompt = buildAnchorUserPrompt(
        'Eldoria',
        'A high fantasy world with magic',
        undefined,
        []
      );

      expect(prompt).toContain('World Name: Eldoria');
      expect(prompt).toContain('<world_description>A high fantasy world with magic</world_description>');
    });

    it('should include story idea when provided', () => {
      const prompt = buildAnchorUserPrompt(
        'Eldoria',
        'Fantasy world',
        'Dragons return after centuries',
        []
      );

      expect(prompt).toContain('Story idea: <story_idea>Dragons return after centuries</story_idea>');
    });

    it('should use default message when no story idea provided', () => {
      const prompt = buildAnchorUserPrompt(
        'Eldoria',
        'Fantasy world',
        undefined,
        []
      );

      expect(prompt).toContain("Based on the world's current state, generate an appropriate and engaging story arc.");
    });

    it('should include previous arcs when provided', () => {
      const previousArcs = [
        'Arc 1: The Great War ended with peace treaty',
        'Arc 2: Magical plague ravaged the lands'
      ];
      
      const prompt = buildAnchorUserPrompt(
        'Eldoria',
        'Fantasy world',
        undefined,
        previousArcs
      );

      expect(prompt).toContain('IMPORTANT WORLD HISTORY');
      expect(prompt).toContain('Arc 1: The Great War ended with peace treaty');
      expect(prompt).toContain('Arc 2: Magical plague ravaged the lands');
      expect(prompt).toContain('ensure continuity');
    });

    it('should not include history section when no previous arcs', () => {
      const prompt = buildAnchorUserPrompt(
        'Eldoria',
        'Fantasy world',
        undefined,
        []
      );

      expect(prompt).not.toContain('IMPORTANT WORLD HISTORY');
    });

    it('should request exactly 3 anchor beats', () => {
      const prompt = buildAnchorUserPrompt(
        'Eldoria',
        'Fantasy world'
      );

      expect(prompt).toContain('Generate exactly 3 anchor beats at indices 0, 7, and 14');
    });

    it('should handle empty arrays for previousArcs', () => {
      const prompt = buildAnchorUserPrompt(
        'TestWorld',
        'Test Description'
      );

      expect(prompt).toBeDefined();
      expect(prompt).not.toContain('IMPORTANT WORLD HISTORY');
    });

    it('should properly escape special characters in inputs', () => {
      const prompt = buildAnchorUserPrompt(
        'World & <Dragons>',
        'A world with "special" characters & <tags>',
        'Story with & and <brackets>',
        ['Previous arc with & and <content>']
      );

      expect(prompt).toContain('World & <Dragons>');
      expect(prompt).toContain('A world with "special" characters & <tags>');
      expect(prompt).toContain('Story with & and <brackets>');
      expect(prompt).toContain('Previous arc with & and <content>');
    });
  });
});