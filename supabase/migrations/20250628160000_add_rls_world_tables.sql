-- Enable RLS and define policies for core world narrative tables
-- Date: 2025-06-28

BEGIN;

/* ------------------------------------------------------------
 * world_arcs
 * ---------------------------------------------------------- */

-- Enable Row Level Security
ALTER TABLE world_arcs ENABLE ROW LEVEL SECURITY;

-- View arcs belonging to worlds owned by the current user
CREATE POLICY "Users can view arcs in their worlds" ON world_arcs
  FOR SELECT USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Allow world owners to create arcs
CREATE POLICY "World owner can insert arcs" ON world_arcs
  FOR INSERT WITH CHECK (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Allow world owners to update arcs
CREATE POLICY "World owner can update arcs" ON world_arcs
  FOR UPDATE USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Allow world owners to delete arcs
CREATE POLICY "World owner can delete arcs" ON world_arcs
  FOR DELETE USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

/* ------------------------------------------------------------
 * world_beats
 * ---------------------------------------------------------- */

-- Enable Row Level Security
ALTER TABLE world_beats ENABLE ROW LEVEL SECURITY;

-- Helper expression to check ownership via joined world_arcs → worlds
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

/* ------------------------------------------------------------
 * world_events
 * ---------------------------------------------------------- */

-- Enable Row Level Security
ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view events for worlds they own
CREATE POLICY "Users can view events in their worlds" ON world_events
  FOR SELECT USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Allow world owners to insert events
CREATE POLICY "World owner can insert events" ON world_events
  FOR INSERT WITH CHECK (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Allow world owners to update events (rare, but for corrections)
CREATE POLICY "World owner can update events" ON world_events
  FOR UPDATE USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

-- Allow world owners to delete events
CREATE POLICY "World owner can delete events" ON world_events
  FOR DELETE USING (
    world_id IN (
      SELECT id FROM worlds WHERE user_id = auth.uid()
    )
  );

COMMIT; 