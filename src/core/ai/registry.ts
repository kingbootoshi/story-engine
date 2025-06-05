interface Model {
  name: string;
  default: boolean;
}

const MODELS: Model[] = [
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