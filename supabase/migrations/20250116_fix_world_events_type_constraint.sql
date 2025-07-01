-- Fix world_events event_type constraint to match application code
-- The application expects: player_action, world_event, system_event
-- But database has: player_action, system_event, environmental, social

BEGIN;

-- First, drop the existing check constraint
ALTER TABLE world_events 
DROP CONSTRAINT IF EXISTS world_events_event_type_check;

-- Add the new check constraint with correct values
ALTER TABLE world_events 
ADD CONSTRAINT world_events_event_type_check 
CHECK (event_type IN ('player_action', 'system_event', 'world_event'));

-- Optional: Update any existing 'environmental' or 'social' events to 'world_event'
-- Uncomment if you have existing data that needs migration
-- UPDATE world_events 
-- SET event_type = 'world_event' 
-- WHERE event_type IN ('environmental', 'social');

COMMIT;

-- Add a comment for documentation
COMMENT ON COLUMN world_events.event_type IS 'Event type: player_action (user-initiated), system_event (AI/system generated), world_event (general world changes)'; 