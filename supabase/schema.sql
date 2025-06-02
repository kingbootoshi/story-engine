-- World Story Engine Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Worlds table: represents different game worlds or story universes
CREATE TABLE worlds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_arc_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- World Arcs table: story arcs that affect the entire world
CREATE TABLE world_arcs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  arc_number INTEGER NOT NULL,
  story_name VARCHAR(255) NOT NULL,
  story_idea TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(world_id, arc_number)
);

-- World Beats table: individual story beats within an arc
CREATE TABLE world_beats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  arc_id UUID NOT NULL REFERENCES world_arcs(id) ON DELETE CASCADE,
  beat_index INTEGER NOT NULL,
  beat_type VARCHAR(50) NOT NULL CHECK (beat_type IN ('anchor', 'dynamic')),
  beat_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  world_directives TEXT[] DEFAULT '{}',
  emergent_storylines TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(arc_id, beat_index)
);

-- World Events table: tracks significant events that happen in the world
CREATE TABLE world_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  arc_id UUID REFERENCES world_arcs(id) ON DELETE SET NULL,
  beat_id UUID REFERENCES world_beats(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('player_action', 'system_event', 'environmental', 'social')),
  description TEXT NOT NULL,
  impact_level VARCHAR(50) DEFAULT 'minor' CHECK (impact_level IN ('minor', 'moderate', 'major', 'catastrophic')),
  affected_regions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_world_arcs_world_id ON world_arcs(world_id);
CREATE INDEX idx_world_arcs_status ON world_arcs(status);
CREATE INDEX idx_world_beats_arc_id ON world_beats(arc_id);
CREATE INDEX idx_world_beats_beat_index ON world_beats(beat_index);
CREATE INDEX idx_world_events_world_id ON world_events(world_id);
CREATE INDEX idx_world_events_created_at ON world_events(created_at DESC);
CREATE INDEX idx_world_events_impact_level ON world_events(impact_level);

-- Add foreign key constraint for current_arc_id after world_arcs table is created
ALTER TABLE worlds
ADD CONSTRAINT fk_current_arc
FOREIGN KEY (current_arc_id) REFERENCES world_arcs(id) ON DELETE SET NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON worlds
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable for production
-- ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE world_arcs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE world_beats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth strategy)
-- CREATE POLICY "Worlds are viewable by everyone" ON worlds FOR SELECT USING (true);
-- CREATE POLICY "Authenticated users can create worlds" ON worlds FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- CREATE POLICY "Users can update their own worlds" ON worlds FOR UPDATE USING (auth.uid() = metadata->>'owner_id');