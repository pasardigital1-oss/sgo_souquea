CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON site_settings TO authenticated;
GRANT ALL ON site_settings TO service_role;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_public_read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_write" ON site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO site_settings (key, value) VALUES
  ('platform_name', 'SGO-SouqUAE'),
  ('tagline', 'UAE''s Premium Auto Parts Marketplace'),
  ('phone', '+971 XX XXX XXXX'),
  ('email', 'support@sgosouquae.com'),
  ('address', 'Dubai, United Arab Emirates'),
  ('whatsapp', ''),
  ('vat_trn', ''),
  ('trade_license', ''),
  ('facebook', ''),
  ('instagram', ''),
  ('twitter', '')
ON CONFLICT (key) DO NOTHING;
