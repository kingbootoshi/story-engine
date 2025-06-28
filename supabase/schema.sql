-- World Story Engine Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Worlds table: represents different game worlds or story universes
CREATE TABLE worlds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  /*
   * Owner of this world – links to Supabase auth.users so that Row-Level
   * Security policies can restrict access to the rightful tenant.
   */
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  current_beat_id UUID,
  detailed_description TEXT,
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
CREATE INDEX idx_world_arcs_current_beat_id ON world_arcs(current_beat_id);
CREATE INDEX idx_world_beats_arc_id ON world_beats(arc_id);
CREATE INDEX idx_world_beats_beat_index ON world_beats(beat_index);
CREATE INDEX idx_world_events_world_id ON world_events(world_id);
CREATE INDEX idx_world_events_created_at ON world_events(created_at DESC);
CREATE INDEX idx_world_events_impact_level ON world_events(impact_level);

-- Add foreign key constraint for current_arc_id after world_arcs table is created
ALTER TABLE worlds
ADD CONSTRAINT fk_current_arc
FOREIGN KEY (current_arc_id) REFERENCES world_arcs(id) ON DELETE SET NULL;

-- Add foreign key constraint for current_beat_id after world_beats table is created
ALTER TABLE world_arcs
ADD CONSTRAINT fk_current_beat
FOREIGN KEY (current_beat_id) REFERENCES world_beats(id) ON DELETE SET NULL;

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

-- =====================================================
-- LOCATION MODULE TABLES
-- =====================================================

-- Create location type enum
CREATE TYPE location_type AS ENUM ('region', 'city', 'landmark', 'wilderness');

-- Create location status enum
CREATE TYPE location_status AS ENUM ('thriving', 'stable', 'declining', 'ruined', 'abandoned', 'lost');

-- Locations table: geographical entities within a world
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  parent_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL,
  type location_type NOT NULL,
  status location_status NOT NULL DEFAULT 'stable',
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  historical_events JSONB DEFAULT '[]',
  last_significant_change TIMESTAMPTZ,
  relative_x NUMERIC CHECK (relative_x >= 0 AND relative_x <= 100),
  relative_y NUMERIC CHECK (relative_y >= 0 AND relative_y <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique names within a world
  CONSTRAINT unique_location_name_per_world UNIQUE (world_id, name),

  -- Ensure regions don't have parents
  CONSTRAINT regions_have_no_parent CHECK (
    (type != 'region') OR (parent_location_id IS NULL)
  ),

  -- Ensure non-regions have parents (except during initial creation)
  CONSTRAINT non_regions_need_parent CHECK (
    (type = 'region') OR (parent_location_id IS NOT NULL)
  )
);

-- Location indexes
CREATE INDEX idx_locations_world_id ON locations(world_id);
CREATE INDEX idx_locations_parent_id ON locations(parent_location_id);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_tags ON locations USING GIN(tags);
CREATE INDEX idx_locations_name_search ON locations USING GIN(to_tsvector('english', name));
CREATE INDEX idx_locations_description_search ON locations USING GIN(to_tsvector('english', description));
CREATE INDEX idx_locations_relative_xy ON locations (relative_x, relative_y);

-- Location updated_at trigger
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security for locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are viewable by all authenticated users"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create locations for their worlds"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "Users can update locations for their worlds"
  ON locations FOR UPDATE
  TO authenticated
  USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete locations for their worlds"
  ON locations FOR DELETE
  TO authenticated
  USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

-- =====================================================
-- FACTION MODULE TABLES
-- =====================================================

-- Create faction status enum
CREATE TYPE faction_status AS ENUM ('rising', 'stable', 'declining', 'collapsed');

-- Create diplomatic stance enum  
CREATE TYPE diplomatic_stance AS ENUM ('ally', 'neutral', 'hostile');

-- Factions table: power structures within worlds
CREATE TABLE factions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  banner_color VARCHAR(7),
  emblem_svg TEXT,
  ideology TEXT NOT NULL,
  status faction_status NOT NULL DEFAULT 'rising',
  members_estimate INTEGER NOT NULL DEFAULT 0 CHECK (members_estimate >= 0),
  home_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  controlled_locations UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  historical_events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(world_id, name)
);

-- Faction relations table: diplomatic relationships between factions
CREATE TABLE faction_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  stance diplomatic_stance NOT NULL,
  last_changed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, target_id),
  CHECK (source_id != target_id)
);

-- Faction indexes
CREATE INDEX idx_factions_world ON factions(world_id);
CREATE INDEX idx_factions_status ON factions(status);
CREATE INDEX idx_factions_home_location ON factions(home_location_id);
CREATE INDEX idx_faction_rel_source ON faction_relations(source_id);
CREATE INDEX idx_faction_rel_target ON faction_relations(target_id);
CREATE INDEX idx_faction_rel_world ON faction_relations(world_id);

-- Faction triggers
CREATE TRIGGER update_factions_updated_at BEFORE UPDATE ON factions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADDITIONAL CONSOLIDATED SCHEMA
-- =====================================================

-- Link controlling factions back to locations
ALTER TABLE locations
  ADD COLUMN controlling_faction_id UUID REFERENCES factions(id) ON DELETE SET NULL;

CREATE INDEX idx_locations_controlling_faction ON locations(controlling_faction_id);

-- =====================================================
-- CHARACTER MODULE TABLES
-- =====================================================

-- Character enums
CREATE TYPE character_type AS ENUM ('player', 'npc');
CREATE TYPE character_status AS ENUM ('alive', 'deceased');
CREATE TYPE story_role AS ENUM ('major', 'minor', 'wildcard', 'background');

-- Characters table
CREATE TABLE characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  type character_type NOT NULL DEFAULT 'npc',
  status character_status NOT NULL DEFAULT 'alive',
  story_role story_role NOT NULL DEFAULT 'minor',
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  faction_id UUID REFERENCES factions(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  background TEXT NOT NULL,
  personality_traits TEXT[] DEFAULT '{}' NOT NULL,
  motivations TEXT[] DEFAULT '{}' NOT NULL,
  memories JSONB DEFAULT '[]' NOT NULL,
  story_beats_witnessed INT[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(world_id, name)
);

-- Character indexes
CREATE INDEX idx_characters_world_id ON characters(world_id);
CREATE INDEX idx_characters_faction_id ON characters(faction_id);
CREATE INDEX idx_characters_location_id ON characters(location_id);
CREATE INDEX idx_characters_status ON characters(status);
CREATE INDEX idx_characters_story_role ON characters(story_role);

-- Character updated_at trigger
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for characters
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view characters in their worlds" ON characters
  FOR SELECT USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "Users can create characters in their worlds" ON characters
  FOR INSERT WITH CHECK (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "Users can update characters in their worlds" ON characters
  FOR UPDATE USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete characters in their worlds" ON characters
  FOR DELETE USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

-- =====================================================
-- USER AI USAGE TABLE
-- =====================================================

CREATE TABLE user_ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id TEXT,
  model VARCHAR(255) NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  total_cost DECIMAL(10, 6) NOT NULL,
  module VARCHAR(100) NOT NULL,
  prompt_id VARCHAR(100) NOT NULL,
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_ai_usage_user_id ON user_ai_usage(user_id);
CREATE INDEX idx_user_ai_usage_created_at ON user_ai_usage(created_at DESC);
CREATE INDEX idx_user_ai_usage_module ON user_ai_usage(module);
CREATE INDEX idx_user_ai_usage_world_id ON user_ai_usage(world_id) WHERE world_id IS NOT NULL;
CREATE INDEX idx_user_ai_usage_user_date ON user_ai_usage(user_id, created_at DESC);

ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage" ON user_ai_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert AI usage records" ON user_ai_usage
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- API KEYS TABLE
-- =====================================================

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  key_prefix VARCHAR(10)
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL AND is_active = true;

CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_keys_updated_at_trigger
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_api_keys_updated_at();

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES FOR CORE STORY TABLES
-- =====================================================

ALTER TABLE world_arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view arcs in their worlds" ON world_arcs
  FOR SELECT USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "World owner can insert arcs" ON world_arcs
  FOR INSERT WITH CHECK (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "World owner can update arcs" ON world_arcs
  FOR UPDATE USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "World owner can delete arcs" ON world_arcs
  FOR DELETE USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "Users can view beats in their worlds" ON world_beats
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM world_arcs
      JOIN worlds ON world_arcs.world_id = worlds.id
      WHERE world_arcs.id = arc_id
        AND worlds.user_id = auth.uid()
    )
  );

CREATE POLICY "World owner can insert beats" ON world_beats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM world_arcs
      JOIN worlds ON world_arcs.world_id = worlds.id
      WHERE world_arcs.id = arc_id
        AND worlds.user_id = auth.uid()
    )
  );

CREATE POLICY "World owner can update beats" ON world_beats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM world_arcs
      JOIN worlds ON world_arcs.world_id = worlds.id
      WHERE world_arcs.id = arc_id
        AND worlds.user_id = auth.uid()
    )
  );

CREATE POLICY "World owner can delete beats" ON world_beats
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM world_arcs
      JOIN worlds ON world_arcs.world_id = worlds.id
      WHERE world_arcs.id = arc_id
        AND worlds.user_id = auth.uid()
    )
  );

ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their worlds" ON world_events
  FOR SELECT USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "World owner can insert events" ON world_events
  FOR INSERT WITH CHECK (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "World owner can update events" ON world_events
  FOR UPDATE USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));

CREATE POLICY "World owner can delete events" ON world_events
  FOR DELETE USING (world_id IN (SELECT id FROM worlds WHERE user_id = auth.uid()));