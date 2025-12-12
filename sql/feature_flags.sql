-- Feature flags / runtime config table
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Example: set default AI model
INSERT INTO feature_flags (key, value)
VALUES ('ai:model', '{"model":"claude-4-mini"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Example for percent rollout (can be toggled to claude-haiku-4.5 later):
-- INSERT INTO feature_flags (key, value)
-- VALUES ('ai:model', '{"model":"claude-haiku-4.5","percent":1}')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
