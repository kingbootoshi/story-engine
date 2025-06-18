-- Create character role enum
CREATE TYPE character_role AS ENUM ('protagonist', 'antagonist', 'supporting', 'background');

-- Create characters table
CREATE TABLE characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  role character_role NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  faction_id UUID REFERENCES factions(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  background TEXT NOT NULL,
  personality_traits JSONB DEFAULT '[]',
  motivations TEXT[] DEFAULT '{}',
  relationships JSONB DEFAULT '[]',
  memories JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(world_id, name)
);

-- Create indexes
CREATE INDEX idx_characters_world ON characters(world_id);
CREATE INDEX idx_characters_location ON characters(location_id);
CREATE INDEX idx_characters_faction ON characters(faction_id);
CREATE INDEX idx_characters_role ON characters(role);
CREATE INDEX idx_characters_tags ON characters USING GIN(tags);

-- Create updated_at trigger
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-level security policies
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Anyone can view characters
CREATE POLICY "Anyone can view characters" ON characters
  FOR SELECT USING (true);

-- World owner can insert characters
CREATE POLICY "World owner can insert characters" ON characters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM worlds 
      WHERE worlds.id = world_id 
      AND worlds.user_id = auth.uid()
    )
  );

-- World owner can update characters
CREATE POLICY "World owner can update characters" ON characters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM worlds 
      WHERE worlds.id = world_id 
      AND worlds.user_id = auth.uid()
    )
  );

-- World owner can delete characters
CREATE POLICY "World owner can delete characters" ON characters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM worlds 
      WHERE worlds.id = world_id 
      AND worlds.user_id = auth.uid()
    )
  );

-- Add character count to locations view
CREATE OR REPLACE VIEW location_details AS
SELECT 
  l.*,
  f.name as controlling_faction_name,
  COUNT(DISTINCT c.id) as character_count
FROM locations l
LEFT JOIN factions f ON l.controlling_faction_id = f.id
LEFT JOIN characters c ON l.id = c.location_id
GROUP BY l.id, f.name;

-- Add character count to factions view
CREATE OR REPLACE VIEW faction_details AS
SELECT 
  f.*,
  COUNT(DISTINCT c.id) as character_count,
  array_agg(DISTINCT l.name) FILTER (WHERE l.id = ANY(f.controlled_locations)) as controlled_location_names
FROM factions f
LEFT JOIN characters c ON f.id = c.faction_id
LEFT JOIN locations l ON l.id = ANY(f.controlled_locations)
GROUP BY f.id;