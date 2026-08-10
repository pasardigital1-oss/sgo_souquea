-- =============================================
-- Add vehicle_types column to spare_parts
-- Jalankan di Supabase SQL Editor
-- =============================================

-- Tambah kolom vehicle_types (array of text)
ALTER TABLE spare_parts
  ADD COLUMN IF NOT EXISTS vehicle_types TEXT[] DEFAULT '{}';

-- Index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_spare_parts_vehicle_types 
  ON spare_parts USING GIN(vehicle_types);

-- Update produk yang sudah ada berdasarkan nama
-- (auto-detect dari nama produk)
UPDATE spare_parts SET vehicle_types = ARRAY['suv', 'car']
WHERE name ILIKE '%Land Cruiser%' OR name ILIKE '%Patrol%' OR name ILIKE '%Prado%';

UPDATE spare_parts SET vehicle_types = ARRAY['car']
WHERE name ILIKE '%Camry%' OR name ILIKE '%Corolla%' OR name ILIKE '%Accord%' OR name ILIKE '%Civic%';

UPDATE spare_parts SET vehicle_types = ARRAY['car', 'suv']
WHERE name ILIKE '%Pajero%' OR name ILIKE '%Mitsubishi%';

-- Verify
SELECT id, name, vehicle_types FROM spare_parts LIMIT 10;
