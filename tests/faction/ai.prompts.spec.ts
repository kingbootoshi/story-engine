import { describe, it, expect } from 'vitest';
import { 
  buildGenerateFactionUserPrompt 
} from '../../src/modules/faction/infra/ai/prompts/generateFaction.prompts';
import { 
  buildDoctrineUpdateUserPrompt 
} from '../../src/modules/faction/infra/ai/prompts/doctrineUpdate.prompts';
import { 
  buildEvaluateRelationsUserPrompt 
} from '../../src/modules/faction/infra/ai/prompts/relations.prompts';

describe('Faction AI Prompts', () => {
  describe('generateFaction prompt', () => {
    it('should build prompt for first faction in world', () => {
      const prompt = buildGenerateFactionUserPrompt(
        'A world of ancient magic and forgotten gods',
        [],
        undefined
      );

      expect(prompt).toContain('A world of ancient magic and forgotten gods');
      expect(prompt).toContain('This will be the first faction in this world');
      expect(prompt).toContain('foundational power structure');
      expect(prompt).not.toContain('Location Context:');
    });

    it('should build prompt with existing factions', () => {
      const existingFactions = [
        'Order of the Silver Dawn: Protectors of ancient knowledge',
        'Shadow Syndicate: Information is power, secrets are currency'
      ];

      const prompt = buildGenerateFactionUserPrompt(
        'A cyberpunk dystopia',
        existingFactions,
        undefined
      );

      expect(prompt).toContain('A cyberpunk dystopia');
      expect(prompt).toContain('Order of the Silver Dawn');
      expect(prompt).toContain('Shadow Syndicate');
      expect(prompt).toContain('complement or contrast with existing factions');
    });

    it('should include location context when provided', () => {
      const locationContext = `Crystal Spire (thriving): A towering monument of pure energy
Rust Valley (declining): Industrial wasteland filled with scavengers`;

      const prompt = buildGenerateFactionUserPrompt(
        'Post-apocalyptic world',
        ['Raiders: Take what you need to survive'],
        locationContext
      );

      expect(prompt).toContain('Location Context:');
      expect(prompt).toContain('Crystal Spire');
      expect(prompt).toContain('Rust Valley');
      expect(prompt).toContain('how this faction might relate to or control these locations');
    });
  });

  describe('updateDoctrine prompt', () => {
    it('should build prompt for status change', () => {
      const prompt = buildDoctrineUpdateUserPrompt(
        'Iron Legion',
        'Strength through unity, victory through sacrifice',
        ['militaristic', 'honor-bound', 'traditional'],
        { from: 'stable', to: 'declining', reason: 'Lost major battle, leadership killed' },
        'A world torn by endless war'
      );

      expect(prompt).toContain('Iron Legion');
      expect(prompt).toContain('Strength through unity, victory through sacrifice');
      expect(prompt).toContain('militaristic, honor-bound, traditional');
      expect(prompt).toContain('stable → declining');
      expect(prompt).toContain('Lost major battle, leadership killed');
      expect(prompt).toContain('A world torn by endless war');
    });

    it('should handle collapsed status change', () => {
      const prompt = buildDoctrineUpdateUserPrompt(
        'Merchant Republic',
        'Trade brings prosperity to all',
        ['mercantile', 'neutral', 'diplomatic'],
        { from: 'declining', to: 'collapsed', reason: 'Economic sanctions and blockade' },
        'Maritime trade empire'
      );

      expect(prompt).toContain('declining → collapsed');
      expect(prompt).toContain('Economic sanctions and blockade');
      expect(prompt).toContain('natural response to their circumstances');
    });
  });

  describe('evaluateRelations prompt', () => {
    it('should build prompt with no existing relations', () => {
      const factions = [
        { 
          id: 'f1', 
          name: 'Tech Collective', 
          ideology: 'Progress through innovation',
          status: 'rising',
          tags: ['technological', 'progressive']
        },
        { 
          id: 'f2', 
          name: 'Nature Guardians', 
          ideology: 'Preserve the old ways',
          status: 'stable',
          tags: ['traditional', 'environmental']
        }
      ];

      const prompt = buildEvaluateRelationsUserPrompt(
        factions,
        [],
        'New technology discovered that could harm the environment'
      );

      expect(prompt).toContain('Tech Collective (rising)');
      expect(prompt).toContain('Nature Guardians (stable)');
      expect(prompt).toContain('No established relations yet');
      expect(prompt).toContain('New technology discovered');
    });

    it('should build prompt with existing relations', () => {
      const factions = [
        { 
          id: 'f1', 
          name: 'Empire', 
          ideology: 'Order through strength',
          status: 'stable',
          tags: ['imperial', 'militaristic']
        },
        { 
          id: 'f2', 
          name: 'Rebels', 
          ideology: 'Freedom at any cost',
          status: 'rising',
          tags: ['revolutionary', 'guerrilla']
        },
        { 
          id: 'f3', 
          name: 'Traders', 
          ideology: 'Profit knows no borders',
          status: 'stable',
          tags: ['mercantile', 'opportunistic']
        }
      ];

      const relations = [
        { sourceId: 'f1', targetId: 'f2', stance: 'hostile' },
        { sourceId: 'f1', targetId: 'f3', stance: 'neutral' },
        { sourceId: 'f2', targetId: 'f3', stance: 'ally' }
      ];

      const prompt = buildEvaluateRelationsUserPrompt(
        factions,
        relations,
        'Rebels successfully raided Empire supply lines with Trader intel'
      );

      expect(prompt).toContain('Empire → Rebels: hostile');
      expect(prompt).toContain('Empire → Traders: neutral');
      expect(prompt).toContain('Rebels → Traders: ally');
      expect(prompt).toContain('Rebels successfully raided');
      expect(prompt).toContain('Only suggest changes that are well-justified');
    });

    it('should properly format faction information', () => {
      const factions = [
        { 
          id: 'f1', 
          name: 'Faction One', 
          ideology: 'Test ideology',
          status: 'declining',
          tags: ['tag1', 'tag2', 'tag3']
        }
      ];

      const prompt = buildEvaluateRelationsUserPrompt(factions, [], 'Test beat');

      expect(prompt).toContain('Faction One (declining): Test ideology [tag1, tag2, tag3]');
    });
  });
});