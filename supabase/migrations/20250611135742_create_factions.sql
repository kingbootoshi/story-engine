-- Create faction status enum
CREATE TYPE faction_status AS ENUM ('rising', 'stable', 'declining', 'collapsed');

-- Create diplomatic stance enum  
CREATE TYPE diplomatic_stance AS ENUM ('ally', 'neutral', 'hostile');

-- Create factions table
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

-- Create faction relations table
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

-- Create indexes
CREATE INDEX idx_factions_world ON factions(world_id);
CREATE INDEX idx_factions_status ON factions(status);
CREATE INDEX idx_factions_home_location ON factions(home_location_id);
CREATE INDEX idx_faction_rel_source ON faction_relations(source_id);
CREATE INDEX idx_faction_rel_target ON faction_relations(target_id);
CREATE INDEX idx_faction_rel_world ON faction_relations(world_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_factions_updated_at BEFORE UPDATE ON factions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-level security policies
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faction_relations ENABLE ROW LEVEL SECURITY;

-- Faction policies - anyone can read, only world owner can modify
CREATE POLICY "Anyone can view factions" ON factions
  FOR SELECT USING (true);

CREATE POLICY "World owner can insert factions" ON factions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM worlds 
      WHERE worlds.id = world_id 
      AND worlds.user_id = auth.uid()
    )
  );

CREATE POLICY "World owner can update factions" ON factions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM worlds 
      WHERE worlds.id = world_id 
      AND worlds.user_id = auth.uid()
    )
  );

CREATE POLICY "World owner can delete factions" ON factions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM worlds 
      WHERE worlds.id = world_id 
      AND worlds.user_id = auth.uid()
    )
  );

-- Faction relation policies
CREATE POLICY "Anyone can view faction relations" ON faction_relations
  FOR SELECT USING (true);

CREATE POLICY "World owner can manage faction relations" ON faction_relations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM worlds 
      WHERE worlds.id = world_id 
      AND worlds.user_id = auth.uid()
    )
  );