export type ModelType = 'smart' | 'small';

interface Model {
  name: string;
  type: ModelType;
  default?: boolean;
}

/**
 * Registry of available AI models with their configuration.
 * Models are categorized as 'smart' (complex reasoning) or 'small' (fast, simple tasks).
 * 
 * Smart models handle:
 * - Initial world/faction/character seeding
 * - All story telling (arc creation, beat progression, summarization)
 * - Faction diplomatic relations updates
 * - Location reactions to beats
 * 
 * Small models handle:
 * - Character reactions to beats
 * - Simple location update checks
 * - Quick evaluations and validations
 */
const MODELS: Model[] = [
  // Smart models - for complex reasoning and generation
  { name: 'openai/gpt-4o', type: 'smart' },
  { name: 'anthropic/claude-sonnet-4', type: 'smart', default: true },
  { name: 'openai/gpt-4-turbo', type: 'smart' },
  
  // Small models - for quick reactions and simple tasks
  { name: 'openai/gpt-4o-mini', type: 'small'},
  { name: 'openai/gpt-4.1-nano', type: 'small', default: true  },
  { name: 'anthropic/claude-haiku', type: 'small' },
];

export const modelRegistry = {
  list(): string[] {
    return MODELS.map(m => m.name);
  },
  
  listByType(type: ModelType): string[] {
    return MODELS.filter(m => m.type === type).map(m => m.name);
  },
  
  getDefault(): string {
    // Legacy method - returns smart model default for backward compatibility
    return this.getDefaultForType('smart');
  },
  
  getDefaultForType(type: ModelType): string {
    const defaultModel = MODELS.find(m => m.type === type && m.default);
    if (!defaultModel) {
      throw new Error(`No default ${type} model configured`);
    }
    return defaultModel.name;
  },
  
  getType(modelName: string): ModelType | undefined {
    const model = MODELS.find(m => m.name === modelName);
    return model?.type;
  },
  
  isSmartModel(modelName: string): boolean {
    return this.getType(modelName) === 'smart';
  },
  
  isSmallModel(modelName: string): boolean {
    return this.getType(modelName) === 'small';
  }
};