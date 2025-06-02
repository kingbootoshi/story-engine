/*
  # Add user_id to worlds table

  1. Changes
    - Add user_id column to worlds table
    - Add foreign key constraint to auth.users
    - Enable RLS
    - Add policies for user access

  2. Security
    - Enable RLS on worlds table
    - Add policies for authenticated users to:
      - Read their own worlds
      - Create new worlds
      - Update their own worlds
      - Delete their own worlds
*/

-- Add user_id column
ALTER TABLE worlds
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own worlds"
ON worlds FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create worlds"
ON worlds FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own worlds"
ON worlds FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own worlds"
ON worlds FOR DELETE
TO authenticated
USING (auth.uid() = user_id);