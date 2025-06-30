import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/shared/lib/trpcClient';

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type WorldState = RouterOutputs['world']['getWorldState'];
export type World = WorldState['world'];
export type Arc = WorldState['currentArc'];
export type Beat = WorldState['currentBeats'][number];
export type WorldEvent = WorldState['recentEvents'][number];

export interface CreateWorldRequest {
  name: string;
  description: string;
}

export interface CreateArcRequest {
  worldId: string;
  worldName: string;
  worldDescription: string;
  storyIdea: string;
}

export interface RecordEventRequest {
  world_id: string;
  event_type: 'player_action' | 'system_event' | 'world_event';
  impact_level: 'minor' | 'moderate' | 'major';
  description: string;
}

export interface ProgressArcRequest {
  worldId: string;
  arcId: string;
}

export type ViewDensity = 'compact' | 'standard' | 'detailed';