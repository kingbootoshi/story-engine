-- Migration: Add relative coordinates to locations
-- Date: 2025-06-09

BEGIN;

-- Add relative_x column (0-100 numeric scale)
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS relative_x NUMERIC CHECK (relative_x >= 0 AND relative_x <= 100);

-- Add relative_y column (0-100 numeric scale)
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS relative_y NUMERIC CHECK (relative_y >= 0 AND relative_y <= 100);

-- Optional: index for quick bounding-box queries on maps
CREATE INDEX IF NOT EXISTS idx_locations_relative_xy ON locations (relative_x, relative_y);

COMMIT; 