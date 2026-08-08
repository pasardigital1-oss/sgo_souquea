-- VIN Cache Table
CREATE TABLE IF NOT EXISTS vin_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vin VARCHAR(17) UNIQUE NOT NULL,
  decoded_data JSONB NOT NULL,
  source TEXT DEFAULT 'nhtsa',
  cached_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON vin_cache TO authenticated;
GRANT ALL ON vin_cache TO service_role;
ALTER TABLE vin_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vin_cache_public_read" ON vin_cache FOR SELECT USING (true);
CREATE POLICY "vin_cache_service_write" ON vin_cache FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_vin_cache_vin ON vin_cache(vin);

-- Used Parts Listings Table
CREATE TABLE IF NOT EXISTS used_parts_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_aed DECIMAL(10,2) NOT NULL,
  condition TEXT DEFAULT 'used' CHECK (condition IN ('used','good','fair','for_parts')),
  make TEXT,
  model TEXT,
  year INTEGER,
  emirate TEXT CHECK (emirate IN ('dubai','abu_dhabi','sharjah','ajman','rak','uaq','fujairah')),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON used_parts_listings TO authenticated;
GRANT ALL ON used_parts_listings TO service_role;
ALTER TABLE used_parts_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "used_parts_public_read" ON used_parts_listings FOR SELECT USING (is_active = true);
CREATE POLICY "used_parts_public_insert" ON used_parts_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "used_parts_owner_manage" ON used_parts_listings FOR ALL USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_used_parts_emirate ON used_parts_listings(emirate);
CREATE INDEX IF NOT EXISTS idx_used_parts_active ON used_parts_listings(is_active);
