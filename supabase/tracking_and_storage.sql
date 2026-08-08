-- =============================================
-- SHIPMENT TRACKING + FILE STORAGE
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tambah kolom tracking ke orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS courier TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- 2. Tambah kolom trade_license_url ke vendors (kalau belum ada)
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS trade_license_url TEXT;

-- 3. Buat bucket untuk vendor documents (trade license upload)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Buat bucket untuk used parts listing images (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('used-parts-images', 'used-parts-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policy: siapapun bisa upload used-parts images (authenticated)
CREATE POLICY "used_parts_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'used-parts-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "used_parts_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'used-parts-images');

-- 6. Storage policy: vendor bisa upload dokumen sendiri
CREATE POLICY "vendor_upload_own_docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vendor-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "vendor_read_own_docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vendor-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin bisa baca semua dokumen vendor
CREATE POLICY "admin_read_vendor_docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vendor-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('tracking_number', 'courier', 'tracking_url');
