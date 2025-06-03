export interface WorldBeat {
  id: string;
  arcId: string;
  beatIndex: number; // 0-14
  beatName: string;
  description: string;
  worldDirectives: string[];
  emergentStorylines: string[];
  createdAt: string;
} 