const API_BASE = 'http://localhost:3001/api';

export interface World {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  current_arc_id?: string;
}

export interface WorldArc {
  id: string;
  world_id: string;
  arc_number: number;
  story_name: string;
  story_idea: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  completed_at?: string;
  summary?: string;
}

export interface WorldBeat {
  id: string;
  arc_id: string;
  beat_index: number;
  beat_type: 'anchor' | 'dynamic';
  beat_name: string;
  description: string;
  world_directives: string[];
  emergent_storylines: string[];
  created_at: string;
}

export interface WorldEvent {
  id: string;
  world_id: string;
  event_type: string;
  description: string;
  impact_level: string;
  created_at: string;
}

class WorldStoryAPI {
  async createWorld(name: string, description: string): Promise<World> {
    const response = await fetch(`${API_BASE}/worlds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    
    if (!response.ok) throw new Error('Failed to create world');
    return response.json();
  }

  async getWorldState(worldId: string) {
    const response = await fetch(`${API_BASE}/worlds/${worldId}`);
    if (!response.ok) throw new Error('Failed to get world state');
    return response.json();
  }

  async createArc(worldId: string, storyIdea?: string) {
    const response = await fetch(`${API_BASE}/worlds/${worldId}/arcs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyIdea })
    });
    
    if (!response.ok) throw new Error('Failed to create arc');
    return response.json();
  }

  async progressArc(worldId: string, arcId: string, recentEvents?: string) {
    const response = await fetch(`${API_BASE}/worlds/${worldId}/arcs/${arcId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recentEvents })
    });
    
    if (!response.ok) throw new Error('Failed to progress arc');
    return response.json();
  }

  async recordEvent(worldId: string, event: {
    eventType: string;
    description: string;
    impactLevel?: string;
    arcId?: string;
  }) {
    const response = await fetch(`${API_BASE}/worlds/${worldId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) throw new Error('Failed to record event');
    return response.json();
  }

  async getEvents(worldId: string, limit: number = 20): Promise<WorldEvent[]> {
    const response = await fetch(`${API_BASE}/worlds/${worldId}/events?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to get events');
    return response.json();
  }
}

export const api = new WorldStoryAPI();