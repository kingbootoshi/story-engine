-- Create character types
CREATE TYPE character_type AS ENUM ('player', 'npc');
CREATE TYPE character_status AS ENUM ('alive', 'deceased');
CREATE TYPE story_role AS ENUM ('major', 'minor', 'wildcard', 'background');

-- Create characters table
CREATE TABLE characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  
  -- Core identity
  name VARCHAR(120) NOT NULL,
  type character_type NOT NULL DEFAULT 'npc',
  status character_status NOT NULL DEFAULT 'alive',
  story_role story_role NOT NULL DEFAULT 'minor',
  
  -- Location & Affiliation
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  faction_id UUID REFERENCES factions(id) ON DELETE SET NULL,
  
  -- Character details
  description TEXT NOT NULL,
  background TEXT NOT NULL,
  personality_traits TEXT[] DEFAULT '{}' NOT NULL,
  motivations TEXT[] DEFAULT '{}' NOT NULL,
  
  -- Story tracking
  memories JSONB DEFAULT '[]' NOT NULL,
  story_beats_witnessed INT[] DEFAULT '{}' NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(world_id, name)
);

-- Create indexes for common queries
CREATE INDEX idx_characters_world_id ON characters(world_id);
CREATE INDEX idx_characters_faction_id ON characters(faction_id) WHERE faction_id IS NOT NULL;
CREATE INDEX idx_characters_location_id ON characters(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_characters_status ON characters(status);
CREATE INDEX idx_characters_story_role ON characters(story_role);

-- Create updated_at trigger
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all characters in their worlds
CREATE POLICY "Users can view characters in their worlds"
  ON characters FOR SELECT
  USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create characters in their worlds
CREATE POLICY "Users can create characters in their worlds"
  ON characters FOR INSERT
  WITH CHECK (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update characters in their worlds
CREATE POLICY "Users can update characters in their worlds"
  ON characters FOR UPDATE
  USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete characters in their worlds
CREATE POLICY "Users can delete characters in their worlds"
  ON characters FOR DELETE
  USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );