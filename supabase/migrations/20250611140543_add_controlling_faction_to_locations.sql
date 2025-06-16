-- Add controlling_faction_id to locations table
ALTER TABLE locations 
ADD COLUMN controlling_faction_id UUID REFERENCES factions(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_locations_controlling_faction ON locations(controlling_faction_id);