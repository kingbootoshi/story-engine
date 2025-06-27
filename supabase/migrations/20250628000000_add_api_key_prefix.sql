-- Add key_prefix column to api_keys table for display purposes
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_prefix VARCHAR(10);

-- Add comment
COMMENT ON COLUMN api_keys.key_prefix IS 'First few characters of the API key for identification';