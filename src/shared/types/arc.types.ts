export interface WorldArc {
  id: string;
  worldId: string;
  arcNumber: number;
  storyName: string;
  storyIdea: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  summary?: string;
} 