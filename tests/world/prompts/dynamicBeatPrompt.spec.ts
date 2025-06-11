import { describe, it, expect } from 'vitest';
import { 
  DYNAMIC_BEAT_SYSTEM_PROMPT, 
  buildDynamicBeatUserPrompt 
} from '../../../src/modules/world/infra/ai/prompts/dynamicBeat.prompts';

describe('Dynamic Beat Prompts', () => {
  describe('DYNAMIC_BEAT_SYSTEM_PROMPT', () => {
    it('should contain narrative expertise context', () => {
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('narrative expert');
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('dynamic world events');
    });

    it('should emphasize systemic changes', () => {
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('SYSTEMIC changes');
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('entire world or major regions');
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('environmental, social, or metaphysical changes');
    });

    it('should mention player interaction', () => {
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('player interaction and agency');
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('SEAMLESSLY incorporate recent player actions');
    });

    it('should define beat requirements', () => {
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('Follow naturally from previous world states');
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('Progress toward the established anchor point');
      expect(DYNAMIC_BEAT_SYSTEM_PROMPT).toContain('Create new opportunities and challenges');
    });
  });

  describe('buildDynamicBeatUserPrompt', () => {
    const baseParams = {
      worldName: 'Eldoria',
      worldDescription: 'A fantasy realm',
      currentBeatIndex: 5,
      beatLabel: 'Set-Up',
      beatPurpose: 'Establish the ordinary world and hint at conflict',
      previousBeatsSummary: 'Previous beats summary',
      nextAnchorSummary: 'Next anchor summary',
      recentEvents: 'Dragon sighting reported',
    };

    it('should include all required parameters', () => {
      const prompt = buildDynamicBeatUserPrompt(
        baseParams.worldName,
        baseParams.worldDescription,
        baseParams.currentBeatIndex,
        baseParams.beatLabel,
        baseParams.beatPurpose,
        baseParams.previousBeatsSummary,
        baseParams.nextAnchorSummary,
        baseParams.recentEvents
      );

      expect(prompt).toContain('## WORLD NAME: Eldoria');
      expect(prompt).toContain('## WORLD DESCRIPTION: A fantasy realm');
      expect(prompt).toContain('Beat #5');
      expect(prompt).toContain('Generate the NEXT BEAT — Beat #5');
    });

    it('should include previous beats summary', () => {
      const prompt = buildDynamicBeatUserPrompt(
        baseParams.worldName,
        baseParams.worldDescription,
        baseParams.currentBeatIndex,
        baseParams.beatLabel,
        baseParams.beatPurpose,
        'The kingdom faced drought',
        baseParams.nextAnchorSummary,
        baseParams.recentEvents
      );

      expect(prompt).toContain('## PREVIOUS WORLD STATES:');
      expect(prompt).toContain('The kingdom faced drought');
    });

    it('should include next anchor summary', () => {
      const prompt = buildDynamicBeatUserPrompt(
        baseParams.worldName,
        baseParams.worldDescription,
        baseParams.currentBeatIndex,
        baseParams.beatLabel,
        baseParams.beatPurpose,
        baseParams.previousBeatsSummary,
        'Magic returns to the world',
        baseParams.recentEvents
      );

      expect(prompt).toContain('## NEXT ANCHOR POINT');
      expect(prompt).toContain('Magic returns to the world');
    });

    it('should include recent events when provided', () => {
      const prompt = buildDynamicBeatUserPrompt(
        baseParams.worldName,
        baseParams.worldDescription,
        baseParams.currentBeatIndex,
        baseParams.beatLabel,
        baseParams.beatPurpose,
        baseParams.previousBeatsSummary,
        baseParams.nextAnchorSummary,
        'Players defeated the tyrant king'
      );

      expect(prompt).toContain('## RECENT WORLD EVENTS:');
      expect(prompt).toContain('Players defeated the tyrant king');
    });

    it('should handle empty recent events', () => {
      const prompt = buildDynamicBeatUserPrompt(
        baseParams.worldName,
        baseParams.worldDescription,
        baseParams.currentBeatIndex,
        baseParams.beatLabel,
        baseParams.beatPurpose,
        baseParams.previousBeatsSummary,
        baseParams.nextAnchorSummary,
        ''
      );

      expect(prompt).toContain('No specific events recorded.');
    });

    it('should handle different beat indices correctly', () => {
      const indices = [1, 3, 6, 9, 12];
      
      indices.forEach(index => {
        const prompt = buildDynamicBeatUserPrompt(
          baseParams.worldName,
          baseParams.worldDescription,
          index,
          baseParams.beatLabel,
          baseParams.beatPurpose,
          baseParams.previousBeatsSummary,
          baseParams.nextAnchorSummary,
          baseParams.recentEvents
        );

        expect(prompt).toContain(`Beat #${index}`);
      });
    });

    it('should maintain narrative direction instruction', () => {
      const prompt = buildDynamicBeatUserPrompt(
        baseParams.worldName,
        baseParams.worldDescription,
        baseParams.currentBeatIndex,
        baseParams.beatLabel,
        baseParams.beatPurpose,
        baseParams.previousBeatsSummary,
        baseParams.nextAnchorSummary,
        baseParams.recentEvents
      );

      expect(prompt).toContain('naturally incorporates the recent events');
    });

    it('should handle multi-line summaries', () => {
      const multiLinePrevious = `Beat 1: Kingdom at peace
Beat 2: Mysterious plague appears
Beat 3: Cities begin quarantine`;
      
      const multiLineAnchor = `Beat 14: New World Order
- Magic and technology merged
- Society restructured`;

      const prompt = buildDynamicBeatUserPrompt(
        baseParams.worldName,
        baseParams.worldDescription,
        baseParams.currentBeatIndex,
        baseParams.beatLabel,
        baseParams.beatPurpose,
        multiLinePrevious,
        multiLineAnchor,
        baseParams.recentEvents
      );

      expect(prompt).toContain(multiLinePrevious);
      expect(prompt).toContain(multiLineAnchor);
    });
  });
});