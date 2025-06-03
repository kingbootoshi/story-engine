-- Add foreign key constraint for current_arc_id if it doesn't exist
ALTER TABLE worlds 
ADD CONSTRAINT fk_current_arc 
FOREIGN KEY (current_arc_id) 
REFERENCES world_arcs(id) 
ON DELETE SET NULL;