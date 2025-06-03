export interface World {
  id: string; // UUID
  name: string;
  description: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  currentArcId?: string;
} 