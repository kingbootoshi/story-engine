interface Model {
  name: string;
  default: boolean;
}

/**
 * Registry of available AI models with their configuration.
 * Models are prioritized based on performance, cost, and capabilities.
 */
const MODELS: Model[] = [
  { name: 'openai/gpt-4.1-nano', default: false },
  { name: 'anthropic/claude-sonnet-4', default: true },
  { name: 'openai/gpt-4o-mini', default: false },
];

export const modelRegistry = {
  list(): string[] {
    return MODELS.map(m => m.name);
  },
  
  getDefault(): string {
    const defaultModel = MODELS.find(m => m.default);
    if (!defaultModel) {
      throw new Error('No default model configured');
    }
    return defaultModel.name;
  }
};