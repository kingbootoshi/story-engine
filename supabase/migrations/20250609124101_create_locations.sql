-- Create location type enum
CREATE TYPE location_type AS ENUM ('region', 'city', 'landmark', 'wilderness');

-- Create location status enum
CREATE TYPE location_status AS ENUM ('thriving', 'stable', 'declining', 'ruined', 'abandoned', 'lost');

-- Create locations table
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
    (type = 'region') OR (parent_location_id IS NOT NULL) OR (type IS NULL)
  )
);

-- Create indexes for common queries
CREATE INDEX idx_locations_world_id ON locations(world_id);
CREATE INDEX idx_locations_parent_id ON locations(parent_location_id);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_tags ON locations USING GIN(tags);
CREATE INDEX idx_locations_name_search ON locations USING GIN(to_tsvector('english', name));
CREATE INDEX idx_locations_description_search ON locations USING GIN(to_tsvector('english', description));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_locations_timestamp
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();

-- Create RLS policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read locations
CREATE POLICY "Locations are viewable by all authenticated users" 
  ON locations FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow users to create locations for worlds they own
CREATE POLICY "Users can create locations for their worlds" 
  ON locations FOR INSERT 
  TO authenticated 
  WITH CHECK (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Allow users to update locations for worlds they own
CREATE POLICY "Users can update locations for their worlds" 
  ON locations FOR UPDATE 
  TO authenticated 
  USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete locations for worlds they own
CREATE POLICY "Users can delete locations for their worlds" 
  ON locations FOR DELETE 
  TO authenticated 
  USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE locations IS 'Stores all locations within game worlds including regions, cities, landmarks, and wilderness areas';
COMMENT ON COLUMN locations.historical_events IS 'JSONB array of historical events with structure: {timestamp, event, previous_status?, arc_id?, beat_index?}';
COMMENT ON COLUMN locations.tags IS 'Array of descriptive tags for the location (e.g., coastal, fortified, magical)';