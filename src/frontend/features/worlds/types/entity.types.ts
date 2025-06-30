import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Location = RouterOutputs['location']['list'][number];
export type Character = RouterOutputs['character']['list'][number];
export type Faction = RouterOutputs['faction']['list'][number];

export interface GroupedLocations {
  [key: string]: Location[];
}

export interface LocationModalData {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  population?: number;
  notable_features?: string[];
  key_npcs?: string[];
  political_influence?: string;
  created_at: string;
}

export interface CharacterModalData {
  id: string;
  name: string;
  story_role: string;
  status: string;
  description?: string;
  background?: string;
  motivations?: string[];
  relationships?: string[];
  current_location?: string;
  created_at: string;
}

export interface FactionModalData {
  id: string;
  name: string;
  type?: string;
  status: string;
  description?: string;
  goals?: string[];
  resources?: string[];
  key_members?: string[];
  territory?: string;
  created_at: string;
}