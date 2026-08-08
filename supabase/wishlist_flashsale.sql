-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  part_id UUID REFERENCES spare_parts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, part_id)
);

GRANT ALL ON wishlists TO authenticated;
GRANT ALL ON wishlists TO service_role;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist_own" ON wishlists FOR ALL USING (user_id = (SELECT auth.uid()));

-- Flash sales table
CREATE TABLE IF NOT EXISTS flash_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  discount_percent DECIMAL(5,2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  banner_color TEXT DEFAULT '#c9a84c',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flash sale items
CREATE TABLE IF NOT EXISTS flash_sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flash_sale_id UUID REFERENCES flash_sales(id) ON DELETE CASCADE,
  part_id UUID REFERENCES spare_parts(id) ON DELETE CASCADE,
  discount_percent DECIMAL(5,2),
  UNIQUE(flash_sale_id, part_id)
);

GRANT ALL ON flash_sales TO authenticated;
GRANT ALL ON flash_sales TO service_role;
GRANT SELECT ON flash_sales TO anon;
GRANT ALL ON flash_sale_items TO authenticated;
GRANT ALL ON flash_sale_items TO service_role;
GRANT SELECT ON flash_sale_items TO anon;

ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flash_sales_public" ON flash_sales FOR SELECT USING (true);
CREATE POLICY "flash_sales_admin" ON flash_sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "flash_items_public" ON flash_sale_items FOR SELECT USING (true);
CREATE POLICY "flash_items_admin" ON flash_sale_items FOR ALL USING (auth.role() = 'authenticated');

-- Sample flash sale
INSERT INTO flash_sales (title, title_ar, discount_percent, starts_at, ends_at, is_active, banner_color)
VALUES (
  'Weekend Flash Sale',
  'تخفيضات نهاية الأسبوع',
  15.00,
  NOW(),
  NOW() + INTERVAL '48 hours',
  true,
  '#c9a84c'
) ON CONFLICT DO NOTHING;
