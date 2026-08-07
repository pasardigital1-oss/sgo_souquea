CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  gateway TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT FALSE,
  is_sandbox BOOLEAN DEFAULT TRUE,
  public_key TEXT,
  secret_key TEXT,
  webhook_secret TEXT,
  extra_config JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO payment_settings (gateway, is_enabled, is_sandbox) VALUES
  ('stripe', false, true),
  ('telr', false, true),
  ('tabby', false, true),
  ('tamara', false, true),
  ('cod', true, false)
ON CONFLICT (gateway) DO NOTHING;

GRANT ALL ON payment_settings TO authenticated;
GRANT SELECT ON payment_settings TO anon;
