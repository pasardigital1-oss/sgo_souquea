-- =============================================
-- Site Assets Storage Bucket
-- Jalankan di Supabase SQL Editor
-- =============================================

-- Bucket untuk logo dan asset platform (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Admin bisa upload ke site-assets
CREATE POLICY "admin_upload_site_assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'site-assets'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_update_site_assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'site-assets'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Public bisa baca (logo harus bisa dilihat semua orang)
CREATE POLICY "public_read_site_assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

-- Pastikan logo_url ada di site_settings
INSERT INTO site_settings (key, value)
VALUES ('logo_url', '')
ON CONFLICT (key) DO NOTHING;
