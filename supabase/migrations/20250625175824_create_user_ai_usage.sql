-- Create user AI usage tracking table
CREATE TABLE user_ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- OpenRouter generation details
  generation_id TEXT, -- OpenRouter generation ID for detailed lookups
  model VARCHAR(255) NOT NULL,
  
  -- Token counts
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  
  -- Cost tracking
  total_cost DECIMAL(10, 6) NOT NULL, -- USD cost with 6 decimal precision
  
  -- Context for analytics
  module VARCHAR(100) NOT NULL, -- e.g., 'world', 'faction', 'character'
  prompt_id VARCHAR(100) NOT NULL, -- e.g., 'generate_world_arc_anchors'
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE, -- Optional world context
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_user_ai_usage_user_id ON user_ai_usage(user_id);
CREATE INDEX idx_user_ai_usage_created_at ON user_ai_usage(created_at DESC);
CREATE INDEX idx_user_ai_usage_module ON user_ai_usage(module);
CREATE INDEX idx_user_ai_usage_world_id ON user_ai_usage(world_id) WHERE world_id IS NOT NULL;
CREATE INDEX idx_user_ai_usage_user_date ON user_ai_usage(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own usage
CREATE POLICY "Users can view their own AI usage"
  ON user_ai_usage FOR SELECT
  USING (user_id = auth.uid());

-- Policy: System can insert usage records (no user restriction on INSERT)
-- This allows our backend to insert records for any user
CREATE POLICY "System can insert AI usage records"
  ON user_ai_usage FOR INSERT
  WITH CHECK (true);