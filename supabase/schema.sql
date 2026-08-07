-- =============================================
-- SGO-SouqUAE Database Schema
-- Supabase PostgreSQL
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends Supabase auth.users)
-- =============================================
CREATE TABLE profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name       TEXT,
  phone           TEXT,
  role            TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','vendor','admin')),
  emirate         TEXT CHECK (emirate IN ('dubai','abu_dhabi','sharjah','ajman','rak','uaq','fujairah')),
  preferred_lang  TEXT DEFAULT 'en' CHECK (preferred_lang IN ('en','ar','id')),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role, emirate, preferred_lang)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'emirate', 'dubai'),
    COALESCE(NEW.raw_user_meta_data->>'preferred_lang', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- VENDORS
-- =============================================
CREATE TABLE vendors (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id             UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_name       TEXT NOT NULL,
  business_name_ar    TEXT,
  trade_license_no    TEXT UNIQUE NOT NULL,
  trade_license_expiry DATE NOT NULL,
  trade_license_url   TEXT,
  vat_trn             TEXT,
  business_type       TEXT CHECK (business_type IN ('retailer','wholesaler','distributor','manufacturer')),
  emirate             TEXT CHECK (emirate IN ('dubai','abu_dhabi','sharjah','ajman','rak','uaq','fujairah')),
  address             TEXT,
  bank_name           TEXT,
  bank_iban           TEXT,
  commission_rate     DECIMAL(5,2) DEFAULT 5.00,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','suspended','rejected')),
  rejection_reason    TEXT,
  approved_at         TIMESTAMPTZ,
  approved_by         UUID REFERENCES profiles(id),
  rating              DECIMAL(3,2) DEFAULT 0.00,
  total_sales         DECIMAL(15,2) DEFAULT 0.00,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VEHICLE MAKES
-- =============================================
CREATE TABLE vehicle_makes (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  name_ar     TEXT,
  logo_url    TEXT,
  origin      TEXT,
  is_popular  BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed popular makes
INSERT INTO vehicle_makes (name, name_ar, origin, is_popular) VALUES
  ('Toyota', 'تويوتا', 'Japan', TRUE),
  ('Nissan', 'نيسان', 'Japan', TRUE),
  ('Mitsubishi', 'ميتسوبيشي', 'Japan', TRUE),
  ('Honda', 'هوندا', 'Japan', TRUE),
  ('Kia', 'كيا', 'Korea', TRUE),
  ('Hyundai', 'هيونداي', 'Korea', TRUE),
  ('Ford', 'فورد', 'USA', FALSE),
  ('BMW', 'بي إم دبليو', 'Germany', FALSE),
  ('Mercedes-Benz', 'مرسيدس بنز', 'Germany', FALSE),
  ('Lexus', 'لكزس', 'Japan', FALSE),
  ('Land Rover', 'لاند روفر', 'UK', FALSE),
  ('Jeep', 'جيب', 'USA', FALSE),
  ('Chevrolet', 'شيفروليه', 'USA', FALSE),
  ('GMC', 'جي إم سي', 'USA', FALSE),
  ('Dodge', 'دودج', 'USA', FALSE);

-- =============================================
-- VEHICLE MODELS
-- =============================================
CREATE TABLE vehicle_models (
  id            SERIAL PRIMARY KEY,
  make_id       INTEGER REFERENCES vehicle_makes(id) NOT NULL,
  model_name    TEXT NOT NULL,
  model_name_ar TEXT,
  body_type     TEXT CHECK (body_type IN ('sedan','suv','pickup','hatchback','coupe','van','truck','bus')),
  year_start    INTEGER NOT NULL,
  year_end      INTEGER,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed popular models
INSERT INTO vehicle_models (make_id, model_name, model_name_ar, body_type, year_start) VALUES
  (1, 'Land Cruiser', 'لاند كروزر', 'suv', 1990),
  (1, 'Camry', 'كامري', 'sedan', 1982),
  (1, 'Hilux', 'هايلكس', 'pickup', 1968),
  (1, 'Fortuner', 'فورتشنر', 'suv', 2005),
  (1, 'Prado', 'برادو', 'suv', 1990),
  (2, 'Patrol', 'باترول', 'suv', 1980),
  (2, 'Altima', 'ألتيما', 'sedan', 1992),
  (2, 'Navara', 'نافارا', 'pickup', 1985),
  (3, 'Pajero', 'باجيرو', 'suv', 1982),
  (3, 'L200', 'إل 200', 'pickup', 1978),
  (4, 'Accord', 'أكورد', 'sedan', 1976),
  (4, 'CR-V', 'سي آر في', 'suv', 1995),
  (5, 'Sorento', 'سورينتو', 'suv', 2002),
  (6, 'Tucson', 'توسان', 'suv', 2004);

-- =============================================
-- PART CATEGORIES
-- =============================================
CREATE TABLE part_categories (
  id          SERIAL PRIMARY KEY,
  parent_id   INTEGER REFERENCES part_categories(id),
  name        TEXT NOT NULL,
  name_ar     TEXT,
  slug        TEXT UNIQUE NOT NULL,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories (level 1)
INSERT INTO part_categories (name, name_ar, slug, sort_order) VALUES
  ('Engine Parts', 'قطع المحرك', 'engine', 1),
  ('Brakes', 'الفرامل', 'brakes', 2),
  ('Suspension', 'التعليق', 'suspension', 3),
  ('Electrical', 'الكهرباء', 'electrical', 4),
  ('Filters & Fluids', 'الفلاتر والسوائل', 'filters-fluids', 5),
  ('A/C & Cooling', 'التكييف والتبريد', 'ac-cooling', 6),
  ('Body & Exterior', 'الهيكل والمظهر', 'body-exterior', 7),
  ('Tools & Accessories', 'الأدوات والإكسسوارات', 'tools', 8);

-- =============================================
-- SPARE PARTS CATALOG
-- =============================================
CREATE TABLE spare_parts (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id         UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  category_id       INTEGER REFERENCES part_categories(id),
  part_number       TEXT NOT NULL,
  oem_code          TEXT,
  aftermarket_code  TEXT,
  name              TEXT NOT NULL,
  name_ar           TEXT,
  description       TEXT,
  description_ar    TEXT,
  brand             TEXT,
  part_type         TEXT DEFAULT 'aftermarket' CHECK (part_type IN ('oem','aftermarket','remanufactured','used')),
  condition         TEXT DEFAULT 'new' CHECK (condition IN ('new','used','refurbished')),
  weight_kg         DECIMAL(8,3),
  warranty_months   INTEGER DEFAULT 0,
  images            TEXT[] DEFAULT '{}',
  is_active         BOOLEAN DEFAULT TRUE,
  is_featured       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PART COMPATIBILITY (Many-to-Many)
-- =============================================
CREATE TABLE part_compatibility (
  id          SERIAL PRIMARY KEY,
  part_id     UUID REFERENCES spare_parts(id) ON DELETE CASCADE,
  make_id     INTEGER REFERENCES vehicle_makes(id),
  model_id    INTEGER REFERENCES vehicle_models(id),
  year_from   INTEGER,
  year_to     INTEGER,
  notes       TEXT,
  UNIQUE(part_id, model_id)
);

-- =============================================
-- INVENTORY
-- =============================================
CREATE TABLE inventory (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  part_id         UUID REFERENCES spare_parts(id) ON DELETE CASCADE NOT NULL,
  vendor_id       UUID REFERENCES vendors(id) NOT NULL,
  emirate         TEXT DEFAULT 'dubai' CHECK (emirate IN ('dubai','abu_dhabi','sharjah','ajman','rak','uaq','fujairah')),
  quantity        INTEGER DEFAULT 0,
  reserved_qty    INTEGER DEFAULT 0,
  price_aed       DECIMAL(10,2) NOT NULL,
  sku             TEXT UNIQUE,
  low_stock_alert INTEGER DEFAULT 5,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(part_id, vendor_id, emirate)
);

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE orders (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number        TEXT UNIQUE NOT NULL,
  customer_id         UUID REFERENCES profiles(id) NOT NULL,
  vendor_id           UUID REFERENCES vendors(id) NOT NULL,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal_aed        DECIMAL(12,2) NOT NULL,
  vat_amount_aed      DECIMAL(12,2) NOT NULL,
  shipping_fee_aed    DECIMAL(10,2) DEFAULT 0,
  discount_aed        DECIMAL(10,2) DEFAULT 0,
  total_aed           DECIMAL(12,2) NOT NULL,
  shipping_address    JSONB NOT NULL,
  notes               TEXT,
  cancelled_reason    TEXT,
  confirmed_at        TIMESTAMPTZ,
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE order_items (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  part_id         UUID REFERENCES spare_parts(id),
  inventory_id    UUID REFERENCES inventory(id),
  part_snapshot   JSONB NOT NULL,
  quantity        INTEGER NOT NULL,
  unit_price_aed  DECIMAL(10,2) NOT NULL,
  vat_per_unit    DECIMAL(10,2) NOT NULL,
  total_aed       DECIMAL(12,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CART (temporary, per session)
-- =============================================
CREATE TABLE cart_items (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  inventory_id  UUID REFERENCES inventory(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, inventory_id)
);

-- =============================================
-- REVIEWS
-- =============================================
CREATE TABLE reviews (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id    UUID REFERENCES orders(id),
  part_id     UUID REFERENCES spare_parts(id),
  vendor_id   UUID REFERENCES vendors(id),
  customer_id UUID REFERENCES profiles(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       TEXT,
  comment     TEXT,
  is_visible  BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, part_id)
);

-- =============================================
-- VAT LOGS (Invoice tracking)
-- =============================================
CREATE TABLE vat_logs (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id        UUID REFERENCES orders(id) NOT NULL,
  vendor_id       UUID REFERENCES vendors(id) NOT NULL,
  invoice_number  TEXT UNIQUE NOT NULL,
  taxable_amount  DECIMAL(12,2) NOT NULL,
  vat_rate        DECIMAL(5,2) DEFAULT 5.00,
  vat_amount      DECIMAL(12,2) NOT NULL,
  total_amount    DECIMAL(12,2) NOT NULL,
  invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  tax_period      TEXT,
  invoice_pdf_url TEXT,
  is_reported     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_spare_parts_vendor     ON spare_parts(vendor_id);
CREATE INDEX idx_spare_parts_category   ON spare_parts(category_id);
CREATE INDEX idx_spare_parts_part_number ON spare_parts(part_number);
CREATE INDEX idx_spare_parts_oem_code   ON spare_parts(oem_code);
CREATE INDEX idx_spare_parts_active     ON spare_parts(is_active);
CREATE INDEX idx_spare_parts_featured   ON spare_parts(is_featured);
CREATE INDEX idx_inventory_part         ON inventory(part_id);
CREATE INDEX idx_inventory_vendor       ON inventory(vendor_id);
CREATE INDEX idx_orders_customer        ON orders(customer_id);
CREATE INDEX idx_orders_vendor          ON orders(vendor_id);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_cart_user              ON cart_items(user_id);

-- Full text search index
ALTER TABLE spare_parts ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(oem_code,'') || ' ' || coalesce(part_number,'') || ' ' || coalesce(brand,''))
  ) STORED;
CREATE INDEX idx_spare_parts_search ON spare_parts USING GIN(search_vector);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: user can read/update own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Spare parts: anyone can read active parts
CREATE POLICY "parts_select_public" ON spare_parts FOR SELECT USING (is_active = TRUE);
CREATE POLICY "parts_vendor_manage" ON spare_parts FOR ALL USING (
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);

-- Inventory: anyone can read
CREATE POLICY "inventory_select_public" ON inventory FOR SELECT USING (TRUE);
CREATE POLICY "inventory_vendor_manage" ON inventory FOR ALL USING (
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);

-- Orders: customer sees own, vendor sees their orders
CREATE POLICY "orders_customer_select" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "orders_vendor_select" ON orders FOR SELECT USING (
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);
CREATE POLICY "orders_customer_insert" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Cart: user manages own cart
CREATE POLICY "cart_own" ON cart_items FOR ALL USING (user_id = auth.uid());

-- Reviews: public read, customer insert
CREATE POLICY "reviews_select_public" ON reviews FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "reviews_customer_insert" ON reviews FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Vehicle makes & models: public read
ALTER TABLE vehicle_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicle_makes_public" ON vehicle_makes FOR SELECT USING (TRUE);
CREATE POLICY "vehicle_models_public" ON vehicle_models FOR SELECT USING (TRUE);
CREATE POLICY "categories_public" ON part_categories FOR SELECT USING (TRUE);

-- Vendors: public can read approved vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors_select_public" ON vendors FOR SELECT USING (status = 'approved');
CREATE POLICY "vendors_select_own" ON vendors FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "vendors_insert_own" ON vendors FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "vendors_update_own" ON vendors FOR UPDATE USING (user_id = auth.uid());

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', TRUE),
  ('vendor-documents', 'vendor-documents', FALSE),
  ('avatars', 'avatars', TRUE);
